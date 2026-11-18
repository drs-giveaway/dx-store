const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
for (const key of required) {
  if (!process.env[key]) { console.error("Missing required environment variable:", key); process.exit(1); }
}
const app = express();
const port = Number(process.env.PORT || 10000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "https://drs-giveaway.github.io";
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
app.use(cors({ origin(origin, callback) { if (!origin || origin === frontendOrigin || origin === "https://drs-giveaway.github.io") return callback(null, true); return callback(new Error("Origin tidak diizinkan.")); } }));
app.use(express.json({ limit: "100kb" }));

async function requireUser(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Silakan masuk terlebih dahulu." });
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ message: "Sesi login tidak valid." });
  req.user = data.user; next();
}
async function requireAdmin(req, res, next) {
  const { data, error } = await supabaseAdmin.from("profiles").select("role").eq("id", req.user.id).maybeSingle();
  if (error || data?.role !== "admin") return res.status(403).json({ message: "Akses khusus admin." });
  next();
}
function getTable(type) { return type === "product" ? "products" : type === "account" ? "account_listings" : null; }
app.get("/health", (_req, res) => res.json({ ok: true, service: "DX STORE manual QRIS payment API" }));

app.post("/api/payments/create", requireUser, async (req, res) => {
  try {
    const { itemType, itemId } = req.body || {};
    const table = getTable(itemType);
    if (!table || typeof itemId !== "string" || !/^[0-9a-f-]{16,}$/i.test(itemId)) return res.status(400).json({ message: "Item pesanan tidak valid." });
    const columns = itemType === "product" ? "id,name,price,status" : "id,title,price,status";
    const { data: item, error } = await supabaseAdmin.from(table).select(columns).eq("id", itemId).eq("status", "active").maybeSingle();
    if (error || !item) return res.status(404).json({ message: "Barang tidak tersedia." });
    const amount = Number(item.price);
    if (!Number.isSafeInteger(amount) || amount < 1) return res.status(400).json({ message: "Harga barang tidak valid." });
    const orderId = "DX-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const { error: insertError } = await supabaseAdmin.from("orders").insert({ user_id: req.user.id, order_id: orderId, item_type: itemType, item_id: item.id, item_name: String(item.name || item.title || "Item DX STORE").slice(0, 200), amount, status: "pending" });
    if (insertError) throw insertError;
    return res.json({ orderId, amount, status: "pending" });
  } catch (error) { console.error("Create order error:", error.message); return res.status(500).json({ message: "Pesanan gagal dibuat." }); }
});

app.post("/api/payments/submit-proof", requireUser, async (req, res) => {
  const { orderId, proofPath } = req.body || {};
  if (typeof orderId !== "string" || typeof proofPath !== "string" || !proofPath.startsWith(req.user.id + "/" + orderId + ".")) return res.status(400).json({ message: "Bukti pembayaran tidak valid." });
  const { data: order, error } = await supabaseAdmin.from("orders").select("status").eq("order_id", orderId).eq("user_id", req.user.id).maybeSingle();
  if (error || !order) return res.status(404).json({ message: "Pesanan tidak ditemukan." });
  if (order.status === "paid") return res.status(409).json({ message: "Pesanan sudah lunas." });
  const { error: updateError } = await supabaseAdmin.from("orders").update({ proof_path: proofPath, status: "review", updated_at: new Date().toISOString() }).eq("order_id", orderId).eq("user_id", req.user.id);
  if (updateError) return res.status(500).json({ message: "Bukti gagal disimpan." });
  return res.json({ received: true, status: "review" });
});

app.get("/api/payments/status", requireUser, async (req, res) => {
  const orderId = String(req.query.orderId || "");
  const { data, error } = await supabaseAdmin.from("orders").select("order_id,amount,status").eq("order_id", orderId).eq("user_id", req.user.id).maybeSingle();
  if (error || !data) return res.status(404).json({ message: "Pesanan tidak ditemukan." });
  return res.json(data);
});

app.get("/api/admin/orders", requireUser, requireAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin.from("orders").select("order_id,item_name,amount,status,proof_path,created_at").order("created_at", { ascending: false }).limit(100);
  if (error) return res.status(500).json({ message: "Daftar pesanan gagal dimuat." });
  const orders = await Promise.all((data || []).map(async order => {
    if (order.proof_path) {
      const { data: signed } = await supabaseAdmin.storage.from("payment-proofs").createSignedUrl(order.proof_path, 300);
      order.proof_url = signed?.signedUrl || null;
    }
    return order;
  }));
  return res.json({ orders });
});

app.patch("/api/admin/orders/:orderId", requireUser, requireAdmin, async (req, res) => {
  const status = req.body?.status;
  if (!["paid", "rejected"].includes(status)) return res.status(400).json({ message: "Status admin tidak valid." });
  const { data, error } = await supabaseAdmin.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("order_id", req.params.orderId).eq("status", "review").select("order_id,status").maybeSingle();
  if (error || !data) return res.status(409).json({ message: "Pesanan tidak ditemukan atau sudah diproses." });
  return res.json(data);
});

app.listen(port, () => console.log("DX STORE manual payment API listening on", port));
