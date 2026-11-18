import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FRONTEND_ORIGIN = Deno.env.get("DX_FRONTEND_ORIGIN") || "https://drs-giveaway.github.io";

const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Vary": "Origin",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getItemTable(itemType: unknown) {
  if (itemType === "product") return "products";
  if (itemType === "account") return "account_listings";
  return null;
}

async function getUser(req: Request) {
  const header = req.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const { data, error } = await authClient.auth.getUser(token);
  return error ? null : data.user;
}

async function isAdmin(userId: string) {
  const { data, error } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return !error && data?.role === "admin";
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && origin !== FRONTEND_ORIGIN) return json({ message: "Origin tidak diizinkan." }, 403);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname;
  const user = await getUser(req);
  const protectedPath = path.includes("/api/payments/") || path.includes("/api/admin/");
  if (protectedPath && !user) return json({ message: "Silakan masuk terlebih dahulu." }, 401);

  if (req.method === "POST" && path.endsWith("/api/payments/create")) {
    try {
      const body = await req.json();
      const table = getItemTable(body?.itemType);
      if (!table || !isUuid(body?.itemId)) return json({ message: "Item pesanan tidak valid." }, 400);

      const columns = body.itemType === "product" ? "id,name,price,status" : "id,title,price,status";
      const { data: item, error: itemError } = await adminClient
        .from(table).select(columns).eq("id", body.itemId).eq("status", "active").maybeSingle();

      if (itemError || !item) return json({ message: "Barang tidak tersedia." }, 404);

      const amount = Number(item.price);
      if (!Number.isSafeInteger(amount) || amount < 1) return json({ message: "Harga barang tidak valid." }, 400);

      const itemName = String(item.name || item.title || "Item DX STORE").slice(0, 200);
      const { data: order, error: insertError } = await adminClient
        .from("orders")
        .insert({
          buyer_id: user!.id,
          total_amount: amount,
          item_type: body.itemType,
          item_id: item.id,
          item_name: itemName,
          status: "pending",
        })
        .select("id,total_amount,status")
        .single();

      if (insertError || !order) {
        console.error("Create order:", insertError?.message);
        return json({ message: "Pesanan gagal dibuat. Pastikan migrasi database sudah diterapkan." }, 500);
      }
      return json({ orderId: order.id, amount: Number(order.total_amount), status: order.status });
    } catch (error) {
      console.error("Create order:", error);
      return json({ message: "Permintaan pesanan tidak valid." }, 400);
    }
  }

  if (req.method === "POST" && path.endsWith("/api/payments/submit-proof")) {
    try {
      const body = await req.json();
      const orderId = body?.orderId;
      const proofPath = body?.proofPath;
      if (!isUuid(orderId) || typeof proofPath !== "string") return json({ message: "Bukti pembayaran tidak valid." }, 400);

      const allowedPath = new RegExp("^" + user!.id + "/" + orderId + "\\.(jpg|png)$", "i");
      if (!allowedPath.test(proofPath)) return json({ message: "Lokasi bukti pembayaran tidak valid." }, 400);

      const { data: order, error } = await adminClient.from("orders")
        .select("id,status").eq("id", orderId).eq("buyer_id", user!.id).maybeSingle();
      if (error || !order) return json({ message: "Pesanan tidak ditemukan." }, 404);
      if (!["pending", "review"].includes(order.status)) return json({ message: "Pesanan tidak dapat menerima bukti lagi." }, 409);

      const { data: updated, error: updateError } = await adminClient.from("orders")
        .update({ proof_path: proofPath, status: "review" })
        .eq("id", orderId).eq("buyer_id", user!.id).in("status", ["pending", "review"])
        .select("id,status").maybeSingle();

      if (updateError || !updated) return json({ message: "Bukti gagal disimpan. Periksa status pesanan." }, 409);
      return json({ received: true, status: updated.status });
    } catch {
      return json({ message: "Permintaan bukti pembayaran tidak valid." }, 400);
    }
  }

  if (req.method === "GET" && path.endsWith("/api/payments/status")) {
    const orderId = url.searchParams.get("orderId") || "";
    if (!isUuid(orderId)) return json({ message: "Nomor pesanan tidak valid." }, 400);

    const { data: order, error } = await adminClient.from("orders")
      .select("id,total_amount,status").eq("id", orderId).eq("buyer_id", user!.id).maybeSingle();
    if (error || !order) return json({ message: "Pesanan tidak ditemukan." }, 404);

    return json({ orderId: order.id, amount: Number(order.total_amount), status: order.status });
  }

  if (path.endsWith("/api/admin/orders") && req.method === "GET") {
    if (!await isAdmin(user!.id)) return json({ message: "Akses khusus admin." }, 403);

    const { data, error } = await adminClient.from("orders")
      .select("id,buyer_id,total_amount,item_name,status,proof_path,created_at")
      .order("created_at", { ascending: false }).limit(100);
    if (error) return json({ message: "Daftar pesanan gagal dimuat." }, 500);

    const orders = await Promise.all((data || []).map(async (order) => {
      let proofUrl = null;
      if (order.proof_path) {
        const { data: signed, error: signedError } = await adminClient.storage
          .from("payment-proofs").createSignedUrl(order.proof_path, 300);
        if (!signedError) proofUrl = signed?.signedUrl || null;
      }
      return {
        order_id: order.id,
        buyer_id: order.buyer_id,
        amount: Number(order.total_amount),
        item_name: order.item_name || "Pesanan DX STORE",
        status: order.status,
        created_at: order.created_at,
        proof_url: proofUrl,
      };
    }));
    return json({ orders });
  }

  const adminMatch = path.match(/\/api\/admin\/orders\/([0-9a-f-]+)$/i);
  if (req.method === "PATCH" && adminMatch) {
    if (!await isAdmin(user!.id)) return json({ message: "Akses khusus admin." }, 403);
    const orderId = adminMatch[1];
    let status = "";
    try { status = (await req.json())?.status; } catch { /* invalid JSON */ }
    if (!isUuid(orderId) || !["paid", "rejected"].includes(status)) {
      return json({ message: "Perubahan status tidak valid." }, 400);
    }
    const { data, error } = await adminClient.from("orders").update({ status })
      .eq("id", orderId).eq("status", "review").select("id,status").maybeSingle();
    if (error || !data) return json({ message: "Pesanan tidak ditemukan atau sudah diproses." }, 409);
    return json({ order_id: data.id, status: data.status });
  }

  return json({ message: "Endpoint tidak ditemukan." }, 404);
});
