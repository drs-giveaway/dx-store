const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const midtransClient = require("midtrans-client");
const { createClient } = require("@supabase/supabase-js");

const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "MIDTRANS_SERVER_KEY"];
for (const key of required) {
  if (!process.env[key]) {
    console.error("Missing required environment variable:", key);
    process.exit(1);
  }
}

const app = express();
const port = Number(process.env.PORT || 10000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "https://drs-giveaway.github.io";
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const snap = new midtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY || ""
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === frontendOrigin || origin === "https://drs-giveaway.github.io") {
      return callback(null, true);
    }
    return callback(new Error("Origin tidak diizinkan."));
  }
}));
app.use(express.json({ limit: "100kb" }));

async function requireUser(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Silakan masuk terlebih dahulu." });

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ message: "Sesi login tidak valid." });
  req.user = data.user;
  next();
}

function getTable(itemType) {
  if (itemType === "product") return "products";
  if (itemType === "account") return "account_listings";
  return null;
}

function mapMidtransStatus(status) {
  if (status.transaction_status === "settlement") return "paid";
  if (status.transaction_status === "capture" && status.fraud_status === "accept") return "paid";
  if (["expire"].includes(status.transaction_status)) return "expired";
  if (["cancel", "deny"].includes(status.transaction_status)) return "failed";
  return "pending";
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "DX STORE payment API" }));

app.post("/api/payments/create", requireUser, async (req, res) => {
  try {
    const { itemType, itemId } = req.body || {};
    const table = getTable(itemType);
    if (!table || typeof itemId !== "string" || !/^[0-9a-f-]{16,}$/i.test(itemId)) {
      return res.status(400).json({ message: "Item pesanan tidak valid." });
    }

    const { data: item, error: itemError } = await supabaseAdmin
      .from(table).select("id,name,title,price,status").eq("id", itemId).eq("status", "active").maybeSingle();
    if (itemError || !item) return res.status(404).json({ message: "Barang tidak tersedia." });

    const amount = Number(item.price);
    if (!Number.isSafeInteger(amount) || amount < 1) {
      return res.status(400).json({ message: "Harga barang tidak valid." });
    }

    const orderId = "DX-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const itemName = String(item.name || item.title || "Item DX STORE").slice(0, 200);

    const { error: insertError } = await supabaseAdmin.from("orders").insert({
      user_id: req.user.id,
      order_id: orderId,
      item_type: itemType,
      item_id: item.id,
      item_name: itemName,
      amount,
      status: "pending"
    });
    if (insertError) throw insertError;

    try {
      const transaction = await snap.createTransaction({
        transaction_details: { order_id: orderId, gross_amount: amount },
        item_details: [{ id: String(item.id), price: amount, quantity: 1, name: itemName }],
        customer_details: { email: req.user.email || undefined },
        payment_type: "qris",
        qris: { acquirer: "gopay" }
      });

      const qrAction = (transaction.actions || []).find(action =>
        action.name === "generate-qr-code" || action.name === "generate-qr-code-v2"
      );
      if (!qrAction?.url) throw new Error("Midtrans tidak mengembalikan URL QRIS.");

      await supabaseAdmin.from("orders").update({
        midtrans_transaction_id: transaction.transaction_id || null
      }).eq("order_id", orderId);

      return res.json({
        orderId,
        amount,
        qrUrl: qrAction.url,
        expiresAt: transaction.expiry_time || null
      });
    } catch (paymentError) {
      await supabaseAdmin.from("orders").update({ status: "failed" }).eq("order_id", orderId);
      throw paymentError;
    }
  } catch (error) {
    console.error("Create payment error:", error.message);
    return res.status(500).json({ message: "Transaksi QRIS belum berhasil dibuat. Periksa konfigurasi pembayaran." });
  }
});

app.get("/api/payments/status", requireUser, async (req, res) => {
  const orderId = String(req.query.orderId || "");
  if (!orderId) return res.status(400).json({ message: "Nomor pesanan wajib diisi." });

  const { data: order, error } = await supabaseAdmin
    .from("orders").select("order_id,amount,status").eq("order_id", orderId).eq("user_id", req.user.id).maybeSingle();
  if (error || !order) return res.status(404).json({ message: "Pesanan tidak ditemukan." });
  return res.json({ orderId: order.order_id, amount: order.amount, status: order.status });
});

app.post("/api/payments/webhook", async (req, res) => {
  try {
    const body = req.body || {};
    const signature = crypto.createHash("sha512")
      .update(String(body.order_id) + String(body.status_code) + String(body.gross_amount) + process.env.MIDTRANS_SERVER_KEY)
      .digest("hex");
    if (!body.signature_key || signature !== body.signature_key) {
      return res.status(401).json({ message: "Signature tidak valid." });
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders").select("order_id,amount,status").eq("order_id", body.order_id).maybeSingle();
    if (error || !order) return res.status(404).json({ message: "Pesanan tidak ditemukan." });

    if (Number(body.gross_amount) !== Number(order.amount)) {
      return res.status(400).json({ message: "Nominal notifikasi tidak cocok." });
    }

    const status = mapMidtransStatus(body);
    const update = { status, midtrans_transaction_id: body.transaction_id || null };
    const { error: updateError } = await supabaseAdmin.from("orders").update(update).eq("order_id", body.order_id);
    if (updateError) throw updateError;
    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.status(500).json({ message: "Webhook gagal diproses." });
  }
});

app.listen(port, () => console.log("DX STORE payment API listening on", port));
