
/* =========================================
   DX STORE - PERBAIKAN FINAL
   BAGIAN 1 DARI 5
   INISIALISASI DAN FUNGSI DASAR
========================================= */

const DX_CONFIG = window.DX_CONFIG || {};

if (
  !window.supabase ||
  !DX_CONFIG.supabaseUrl ||
  !DX_CONFIG.supabaseKey
) {
  console.error("DX STORE: Konfigurasi Supabase tidak tersedia.");
}

const dxSupabase = window.supabase
  ? window.supabase.createClient(
      DX_CONFIG.supabaseUrl,
      DX_CONFIG.supabaseKey
    )
  : null;

let currentUser = null;
let currentProfile = null;
let dxAuthMode = "login";
let dxAdminType = "products";
let dxAuthReady = false;

const $ = (id) => document.getElementById(id);

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function safeImageUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value, window.location.origin);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

const DX_COUNTRIES = {
  ID: { name: "Indonesia", language: "id-ID", currency: "IDR", locale: "id-ID", timezone: "Asia/Jakarta" },
  MY: { name: "Malaysia", language: "ms-MY", currency: "MYR", locale: "ms-MY", timezone: "Asia/Kuala_Lumpur" },
  SG: { name: "Singapore", language: "en-SG", currency: "SGD", locale: "en-SG", timezone: "Asia/Singapore" },
  US: { name: "United States", language: "en-US", currency: "USD", locale: "en-US", timezone: "America/New_York" },
  JP: { name: "Japan", language: "ja-JP", currency: "JPY", locale: "ja-JP", timezone: "Asia/Tokyo" },
  TH: { name: "Thailand", language: "th-TH", currency: "THB", locale: "th-TH", timezone: "Asia/Bangkok" },
  PH: { name: "Philippines", language: "en-PH", currency: "PHP", locale: "en-PH", timezone: "Asia/Manila" },
  AU: { name: "Australia", language: "en-AU", currency: "AUD", locale: "en-AU", timezone: "Australia/Sydney" },
  GB: { name: "United Kingdom", language: "en-GB", currency: "GBP", locale: "en-GB", timezone: "Europe/London" },
  DE: { name: "Germany", language: "de-DE", currency: "EUR", locale: "de-DE", timezone: "Europe/Berlin" },
  FR: { name: "France", language: "fr-FR", currency: "EUR", locale: "fr-FR", timezone: "Europe/Paris" },
  IN: { name: "India", language: "hi-IN", currency: "INR", locale: "en-IN", timezone: "Asia/Kolkata" },
  KR: { name: "South Korea", language: "ko-KR", currency: "KRW", locale: "ko-KR", timezone: "Asia/Seoul" },
  BR: { name: "Brazil", language: "pt-BR", currency: "BRL", locale: "pt-BR", timezone: "America/Sao_Paulo" },
  CA: { name: "Canada", language: "en-CA", currency: "CAD", locale: "en-CA", timezone: "America/Toronto" },
  CN: { name: "China", language: "zh-CN", currency: "CNY", locale: "zh-CN", timezone: "Asia/Shanghai" }
};

function getDXCountry() {
  const code = localStorage.getItem("dx-country") || "ID";
  return DX_COUNTRIES[code] ? { code, ...DX_COUNTRIES[code] } : { code: "ID", ...DX_COUNTRIES.ID };
}

function setDXCountry(code) {
  if (!DX_COUNTRIES[code]) return;
  localStorage.setItem("dx-country", code);
  document.documentElement.lang = DX_COUNTRIES[code].language;
  const selector = $("dxCountry");
  if (selector && selector.value !== code) selector.value = code;
  document.dispatchEvent(new CustomEvent("dx-country-change", { detail: { code, ...DX_COUNTRIES[code] } }));
}

function formatPrice(value) {
  const country = getDXCountry();
  const formatter = new Intl.NumberFormat(country.locale, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  });
  const amount = formatter.format(Number(value) || 0);
  return country.currency === "IDR" ? amount : amount + " (IDR)";
}

function formatDXRupiahInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseDXRupiahInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function installDXRupiahInput(input) {
  if (!input || input.dataset.dxRupiahReady === "1") return;
  input.type = "text";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.addEventListener("input", () => {
    const before = input.value;
    const cursor = input.selectionStart ?? before.length;
    const digitsBeforeCursor = before.slice(0, cursor).replace(/\D/g, "").length;
    const digits = before.replace(/\D/g, "");
    const formatted = formatDXRupiahInput(digits);
    input.value = formatted;
    let position = 0;
    let seen = 0;
    while (position < formatted.length && seen < digitsBeforeCursor) {
      if (/\d/.test(formatted[position])) seen++;
      position++;
    }
    input.setSelectionRange(position, position);
  });
  input.value = formatDXRupiahInput(input.value);
  input.dataset.dxRupiahReady = "1";
}

function getDXError(error) {
  return error?.message || "Terjadi kesalahan. Silakan coba lagi.";
}

function showDXMessage(message) {
  const element = $("authMessage");

  if (element) {
    element.textContent = message;
  } else {
    console.log(message);
  }
}

function showDXAdminMessage(message) {
  const element = $("dxAdminMessage");

  if (element) {
    element.textContent = message;
  }
}

/* MODAL LOGIN */

function openAuth() {
  window.location.href = "login.html";
}

function closeAuth() {
  const modal = $("authModal");

  if (modal) {
    modal.classList.remove("active");
  }
}

/* STATUS TOMBOL HEADER */

function updateDXHeaderAuth() {
  const actions = document.querySelector(".dx-nav-actions");
  const button = actions?.querySelector(".dx-button");
  if (!actions || !button) return;

  button.textContent = currentUser
    ? (currentProfile?.role === "admin" ? "Admin / Keluar" : "Keluar")
    : "Masuk / Daftar";

  button.onclick = () => {
    if (currentUser) handleDXLogout();
    else openAuth();
  };

  let countrySelect = $("dxCountry");
  if (currentUser && !countrySelect) {
    countrySelect = document.createElement("select");
    countrySelect.id = "dxCountry";
    countrySelect.setAttribute("aria-label", "Pengaturan negara dan mata uang");
    countrySelect.title = "Ubah negara";
    countrySelect.style.cssText = "min-height:42px;max-width:145px;padding:0 10px;border:1px solid rgba(81,229,255,.45);border-radius:10px;background:#101b32;color:#eaf5ff;font:600 12px Inter,sans-serif";
    Object.entries(DX_COUNTRIES).forEach(([code, country]) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = country.name + " (" + country.currency + ")";
      countrySelect.appendChild(option);
    });
    countrySelect.addEventListener("change", () => setDXCountry(countrySelect.value));
    actions.insertBefore(countrySelect, button);
  }

  if (countrySelect) {
    countrySelect.hidden = !currentUser;
    countrySelect.value = getDXCountry().code;
  }
}

/* =========================================
   DX STORE - BAGIAN 2 DARI 5
   PRODUK DIGITAL DAN MARKETPLACE AKUN GAME
========================================= */

async function loadProducts() {
  const grid = $("productGrid");
  if (!grid || !dxSupabase) return;

  grid.innerHTML = "<p>Memuat produk...</p>";

  const { data, error } = await dxSupabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal memuat produk:", error);
    grid.innerHTML = "<p>Produk gagal dimuat.</p>";
    return;
  }

  if (!data || data.length === 0) {
    grid.innerHTML = "<p>Belum ada produk digital.</p>";
    return;
  }

  grid.innerHTML = data.map((item) => {
    const image = safeImageUrl(item.image_url);

    return `
      <article class="product-card">
        ${
          image
            ? `<img src="${safeText(image)}" alt="${safeText(item.name)}">`
            : ""
        }
        <div class="product-info">
          <h3>${safeText(item.name)}</h3>
          <p>${safeText(item.description || "")}</p>
          <strong>${formatPrice(item.price)}</strong>
          ${item.sale_status === "pending" ? '<span class="dx-stock-status">PENDING — SEDANG DIPESAN</span>' : item.sale_status === "sold_out" ? '<span class="dx-stock-status dx-sold-out">SOLD OUT</span>' : ''}
          <button class="dx-button" type="button" ${item.sale_status !== "available" ? "disabled" : ""} onclick="selectItem('product','${safeText(item.id)}')">
            ${item.sale_status === "pending" ? "Sedang Dipesan" : item.sale_status === "sold_out" ? "Habis Terjual" : "Lihat Produk"}
          </button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadAccountListings() {
  const grid = $("accountGrid");
  if (!grid || !dxSupabase) return;

  grid.innerHTML = "<p>Memuat akun game...</p>";

  const { data, error } = await dxSupabase
    .from("account_listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal memuat akun:", error);
    grid.innerHTML = "<p>Akun game gagal dimuat.</p>";
    return;
  }

  if (!data || data.length === 0) {
    grid.innerHTML = "<p>Belum ada akun game.</p>";
    return;
  }

  grid.innerHTML = data.map((item) => {
    const image = safeImageUrl(item.image_url);

    return `
      <article class="product-card">
        ${
          image
            ? `<img src="${safeText(image)}" alt="${safeText(item.title)}">`
            : ""
        }
        <div class="product-info">
          <h3>${safeText(item.title)}</h3>
          <p>${safeText(item.description || "")}</p>
          <strong>${formatPrice(item.price)}</strong>
          ${item.sale_status === "pending" ? '<span class="dx-stock-status">PENDING — SEDANG DIPESAN</span>' : item.sale_status === "sold_out" ? '<span class="dx-stock-status dx-sold-out">SOLD OUT</span>' : ''}
          <button class="dx-button" type="button" ${item.sale_status !== "available" ? "disabled" : ""} onclick="selectItem('account','${safeText(item.id)}')">
            ${item.sale_status === "pending" ? "Sedang Dipesan" : item.sale_status === "sold_out" ? "Habis Terjual" : "Lihat Akun"}
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function selectItem(type, id) {
  const table = type === "account" ? "account_listings" : "products";
  if (!dxSupabase) return;

  dxSupabase.from(table).select("*").eq("id", id).maybeSingle()
    .then(({ data, error }) => {
      if (error || !data) {
        alert("Data tidak ditemukan.");
        return;
      }

      let modal = document.getElementById("dxProductDetailModal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "dxProductDetailModal";
        modal.className = "dx-detail-overlay";
        modal.innerHTML = '<section class="dx-detail-panel" role="dialog" aria-modal="true" aria-labelledby="dxDetailName"><button type="button" class="dx-detail-close" aria-label="Tutup">&times;</button><div id="dxDetailPhoto" class="dx-detail-photo"></div><div class="dx-detail-copy"><span id="dxDetailType" class="dx-detail-label"></span><h2 id="dxDetailName"></h2><p id="dxDetailDescription"></p><strong id="dxDetailPrice" class="dx-detail-price"></strong><button type="button" id="dxDetailOrder" class="dx-button">Lanjutkan</button></div></section>';
        document.body.appendChild(modal);
        modal.querySelector(".dx-detail-close").addEventListener("click", () => modal.classList.remove("active"));
        modal.addEventListener("click", event => { if (event.target === modal) modal.classList.remove("active"); });
        document.addEventListener("keydown", event => { if (event.key === "Escape") modal.classList.remove("active"); });
      }

      const name = data.name || data.title || "Item DX STORE";
      const image = safeImageUrl(data.image_url);
      modal.querySelector("#dxDetailName").textContent = name;
      modal.querySelector("#dxDetailType").textContent = type === "account" ? (data.game || "AKUN GAME") : (data.category || "PRODUK DIGITAL");
      modal.querySelector("#dxDetailDescription").textContent = data.description || "Belum ada deskripsi tambahan.";
      modal.querySelector("#dxDetailPrice").textContent = formatPrice(data.price);
      modal.querySelector("#dxDetailPhoto").innerHTML = image ? '<img src="' + safeText(image) + '" alt="' + safeText(name) + '">' : '<span>DX STORE</span>';
      const unavailable = data.status !== "active" || (data.sale_status || "available") !== "available";
      modal.querySelector("#dxDetailOrder").disabled = unavailable;
      modal.querySelector("#dxDetailOrder").textContent = data.sale_status === "pending" ? "PENDING — SEDANG DIPESAN" : data.sale_status === "sold_out" ? "SOLD OUT" : "Lanjutkan";
      modal.querySelector("#dxDetailOrder").onclick = () => {
        if (unavailable) return;
        modal.classList.remove("active");
        if (!currentUser) {
          openAuth();
          showDXMessage("Masuk atau daftar untuk melanjutkan pemesanan.");
          return;
        }
        openDXCheckout(type, data);
      };
      modal.classList.add("active");
    });
}

/* CHECKOUT QRIS DX STORE
   Nominal ditampilkan dari harga item terpilih.
   QRIS dinamis dan status resmi hanya berasal dari backend Midtrans.
*/
function createDXCheckoutModal() {
  let modal = $("dxCheckoutModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "dxCheckoutModal";
  modal.className = "dx-checkout-overlay";
  modal.innerHTML = `
    <section class="dx-checkout-panel" role="dialog" aria-modal="true" aria-labelledby="dxCheckoutTitle">
      <button type="button" class="dx-checkout-close" aria-label="Tutup">&times;</button>
      <header class="dx-checkout-brand">
        <div class="dx-checkout-logo">DX <span>STORE</span></div>
        <small>GAME TOP UP &amp; DIGITAL PRODUCT</small>
      </header>
      <div class="dx-checkout-banner">
        <span class="dx-checkout-qr-icon">▦</span>
        <div><h2 id="dxCheckoutTitle">Pembayaran QRIS</h2><p>Scan QR berikut untuk menyelesaikan pembayaran</p></div>
      </div>
      <div class="dx-checkout-main">
        <div class="dx-checkout-qr" id="dxCheckoutQr">
          <div class="dx-checkout-qr-placeholder">QRIS<br>AKAN MUNCUL<br>SETELAH TRANSAKSI DIBUAT</div>
        </div>
        <div class="dx-checkout-details">
          <small>Barang yang dibeli</small>
          <strong id="dxCheckoutItem">-</strong>
          <small>Nominal Pembayaran</small>
          <strong class="dx-checkout-amount" id="dxCheckoutAmount">Rp0</strong>
          <small>Status Pembayaran</small>
          <div class="dx-checkout-status" id="dxCheckoutStatus">Menunggu pembuatan transaksi</div>
          <small>Batas Waktu</small>
          <strong id="dxCheckoutExpiry">-</strong>
        </div>
      </div>
      <p class="dx-checkout-note" id="dxCheckoutMessage" aria-live="polite">QRIS DANA Bisnis statis. Masukkan nominal yang tertera saat membayar; admin akan memeriksa pembayaran secara manual.</p>
      <div class="dx-checkout-proof" style="margin:16px 0;display:grid;gap:10px">
        <label for="dxPaymentProof">Unggah bukti pembayaran (JPG/PNG, maks. 4 MB)</label>
        <input id="dxPaymentProof" type="file" accept="image/jpeg,image/png" disabled>
        <button type="button" class="dx-button" id="dxSubmitProof" disabled>Kirim Bukti Pembayaran</button>
      </div>
      <div class="dx-checkout-actions">
        <button type="button" class="dx-button" id="dxCreatePayment">Buat Pesanan</button>
        <button type="button" class="dx-button dx-checkout-secondary" id="dxCheckPayment" disabled>↻ Cek Status Pesanan</button>
      </div>
      <div class="dx-checkout-instructions">
        <strong>Petunjuk Pembayaran</strong>
        <ol>
          <li>Periksa total pesanan yang tertera.</li>
          <li>Buka aplikasi pembayaran yang mendukung QRIS.</li>
          <li>Scan QRIS DANA Bisnis dan masukkan nominal yang sama persis.</li>
          <li>Unggah bukti pembayaran. Pesanan lunas setelah admin memeriksa dana masuk.</li>
        </ol>
      </div>
      <button type="button" class="dx-checkout-close-link">Tutup</button>
    </section>`;

  const style = document.createElement("style");
  style.id = "dxCheckoutStyles";
  style.textContent = `
    .dx-checkout-overlay{position:fixed;inset:0;z-index:1200;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.9);backdrop-filter:blur(12px);overflow:auto}
    .dx-checkout-overlay.active{display:flex}
    .dx-checkout-panel{position:relative;width:min(900px,100%);max-height:94vh;overflow:auto;padding:25px;border:1px solid #278dff;border-radius:24px;background:radial-gradient(circle at 0 0,rgba(20,115,255,.18),transparent 35%),radial-gradient(circle at 100% 20%,rgba(128,45,255,.18),transparent 35%),#071126;color:#f5f7ff;box-shadow:0 0 45px rgba(20,130,255,.18)}
    .dx-checkout-close{position:absolute;top:14px;right:16px;width:38px;height:38px;border:1px solid #38527d;border-radius:12px;background:#111d39;color:#fff;font-size:25px}
    .dx-checkout-brand{display:flex;align-items:center;gap:18px;margin-bottom:22px}
    .dx-checkout-logo{font-size:28px;font-weight:900;font-style:italic;color:#28caff}.dx-checkout-logo span{color:#bd6cff}
    .dx-checkout-brand small{padding-left:18px;border-left:1px solid #7890bd;color:#dce6ff;font-size:12px}
    .dx-checkout-banner{display:flex;align-items:center;gap:18px;padding:18px 22px;border:1px solid #5e6dff;border-radius:17px;background:linear-gradient(105deg,#155eea,#7414db);margin-bottom:25px}
    .dx-checkout-qr-icon{font-size:38px}.dx-checkout-banner h2{font-size:25px;margin:0 0 5px}.dx-checkout-banner p{margin:0;color:#e5eaff;font-size:13px}
    .dx-checkout-main{display:grid;grid-template-columns:minmax(210px,1fr) minmax(220px,1fr);gap:28px;align-items:center}
    .dx-checkout-qr{min-height:260px;display:grid;place-items:center;padding:18px;border:2px dashed #526caa;border-radius:18px;background:#fff;color:#667085;text-align:center}
    .dx-checkout-qr img{width:min(100%,300px);max-height:300px;object-fit:contain}
    .dx-checkout-qr-placeholder{font-size:15px;font-weight:800;line-height:1.8}
    .dx-checkout-details{display:grid;gap:8px}.dx-checkout-details small{color:#9eb1d6;font-size:12px;margin-top:8px}.dx-checkout-details strong{overflow-wrap:anywhere}.dx-checkout-amount{font-size:clamp(30px,5vw,43px);color:#fff}.dx-checkout-status{padding:12px;border:1px solid #eab308;border-radius:12px;color:#facc15;background:rgba(120,75,0,.2);font-weight:700}
    .dx-checkout-note{margin:20px 0;padding:13px;border:1px solid #30466f;border-radius:12px;color:#c4d3ee;font-size:13px;line-height:1.6}
    .dx-checkout-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px}.dx-checkout-actions button{min-height:48px;border:0;border-radius:12px;color:#fff;font-weight:800;background:linear-gradient(100deg,#087eea,#8618d5)}.dx-checkout-actions button:disabled{opacity:.45;cursor:not-allowed}.dx-checkout-actions .dx-checkout-secondary{background:#182747;border:1px solid #46618f}
    .dx-checkout-instructions{margin-top:22px;padding:18px;border:1px solid #344a75;border-radius:14px;color:#cbd8f1;font-size:13px;line-height:1.8}.dx-checkout-instructions strong{color:#36caff}.dx-checkout-instructions ol{padding-left:20px;margin-top:8px}
    .dx-checkout-close-link{display:block;margin:16px auto 0;border:0;background:transparent;color:#9bb7e8}
    @media(max-width:620px){.dx-checkout-panel{padding:18px}.dx-checkout-brand{display:block}.dx-checkout-brand small{display:block;margin-top:7px;padding:0;border:0}.dx-checkout-main{grid-template-columns:1fr}.dx-checkout-qr{min-height:220px}.dx-checkout-actions{grid-template-columns:1fr}.dx-checkout-banner{padding:14px}.dx-checkout-banner h2{font-size:20px}}
  `;
  document.head.appendChild(style);
  document.body.appendChild(modal);

  const close = () => modal.classList.remove("active");
  modal.querySelector(".dx-checkout-close").addEventListener("click", close);
  modal.querySelector(".dx-checkout-close-link").addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  return modal;
}

function openDXCheckout(type, item) {
  const modal = createDXCheckoutModal();
  const itemName = item.name || item.title || "Item DX STORE";
  const amount = Number(item.price);
  modal.dataset.itemType = type;
  modal.dataset.itemId = String(item.id);
  modal.dataset.orderId = "";
  $("dxCheckoutItem").textContent = itemName;
  $("dxCheckoutAmount").textContent = formatPrice(amount);
  $("dxCheckoutExpiry").textContent = "-";
  $("dxCheckoutStatus").textContent = "Menunggu pembuatan transaksi";
  $("dxCheckoutQr").innerHTML = '<div class="dx-checkout-qr-placeholder">QRIS DANA BISNIS<br>AKAN MUNCUL SETELAH PESANAN DIBUAT</div>';
  $("dxCheckoutMessage").textContent = "Pembayaran QRIS manual. Admin akan memeriksa bukti pembayaran.";
  $("dxCreatePayment").disabled = false;
  $("dxCheckPayment").disabled = true;
  $("dxPaymentProof").value = "";
  $("dxPaymentProof").disabled = true;
  $("dxSubmitProof").disabled = true;
  $("dxSubmitProof").textContent = "Kirim Bukti Pembayaran";
  $("dxCreatePayment").onclick = createDXPayment;
  $("dxCheckPayment").onclick = checkDXPaymentStatus;
  $("dxSubmitProof").onclick = submitDXPaymentProof;
  modal.classList.add("active");
}

async function createDXPayment() {
  const modal = $("dxCheckoutModal");
  const base = DX_CONFIG.paymentApiUrl;
  if (!base) { $("dxCheckoutMessage").textContent = "Server pesanan belum dikonfigurasi."; return; }
  const button = $("dxCreatePayment");
  button.disabled = true;
  button.textContent = "Membuat pesanan...";
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    if (!session?.access_token) throw new Error("Silakan masuk terlebih dahulu.");
    const response = await fetch(new URL("api/payments/create", base + "/"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": DX_CONFIG.supabaseKey, "Authorization": "Bearer " + session.access_token },
      body: JSON.stringify({ itemType: modal.dataset.itemType, itemId: modal.dataset.itemId })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Pesanan gagal dibuat.");
    if (!result.orderId || !Number.isFinite(Number(result.amount))) throw new Error("Data pesanan dari server tidak lengkap.");
    modal.dataset.orderId = result.orderId;
    $("dxCheckoutAmount").textContent = formatPrice(result.amount);
    $("dxCheckoutStatus").textContent = "Menunggu pembayaran";
    $("dxCheckoutQr").innerHTML = '<img src="payment-qris.png" alt="QRIS resmi DANA Bisnis DX STORE">';
    $("dxCheckoutExpiry").textContent = "Tidak berlaku sebagai QRIS dinamis";
    $("dxCheckoutMessage").textContent = "Bayar tepat " + formatPrice(result.amount) + " melalui aplikasi apa pun yang mendukung QRIS. QRIS ini statis, jadi nominal harus dimasukkan sendiri. Setelah membayar, unggah bukti pembayaran.";
    $("dxPaymentProof").disabled = false;
    $("dxSubmitProof").disabled = false;
    $("dxCheckPayment").disabled = false;
    button.disabled = true;
    button.textContent = "Pesanan Dibuat";
  } catch (error) {
    $("dxCheckoutMessage").textContent = getDXError(error);
    button.disabled = false;
    button.textContent = "Buat Pesanan";
  }
}

async function submitDXPaymentProof() {
  const modal = $("dxCheckoutModal");
  const file = $("dxPaymentProof")?.files?.[0];
  const orderId = modal.dataset.orderId;
  if (!orderId) { $("dxCheckoutMessage").textContent = "Buat pesanan terlebih dahulu."; return; }
  if (!file || !["image/jpeg", "image/png"].includes(file.type) || file.size > 4 * 1024 * 1024) {
    $("dxCheckoutMessage").textContent = "Pilih bukti JPG/PNG dengan ukuran maksimal 4 MB.";
    return;
  }
  const button = $("dxSubmitProof");
  button.disabled = true; button.textContent = "Mengirim bukti...";
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    if (!session?.access_token) throw new Error("Sesi login berakhir. Silakan masuk kembali.");
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = currentUser.id + "/" + orderId + "." + ext;
    const upload = await dxSupabase.storage.from("payment-proofs").upload(path, file, { upsert: true, contentType: file.type });
    if (upload.error) throw upload.error;
    const response = await fetch(new URL("api/payments/submit-proof", DX_CONFIG.paymentApiUrl + "/"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": DX_CONFIG.supabaseKey, "Authorization": "Bearer " + session.access_token },
      body: JSON.stringify({ orderId, proofPath: path })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Bukti pembayaran gagal dikirim.");
    $("dxCheckoutStatus").textContent = "Menunggu pemeriksaan admin";
    $("dxCheckoutMessage").textContent = "Bukti diterima. Pesanan belum lunas sampai admin memeriksa dana masuk.";
    $("dxPaymentProof").disabled = true;
  } catch (error) {
    $("dxCheckoutMessage").textContent = getDXError(error);
    button.disabled = false;
  } finally {
    button.textContent = button.disabled ? "Bukti Terkirim" : "Kirim Bukti Pembayaran";
  }
}

async function checkDXPaymentStatus() {
  const modal = $("dxCheckoutModal");
  const base = DX_CONFIG.paymentApiUrl;
  if (!base || !modal.dataset.orderId) return;
  const button = $("dxCheckPayment");
  button.disabled = true; button.textContent = "Memeriksa...";
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    const response = await fetch(new URL("api/payments/status?orderId=" + encodeURIComponent(modal.dataset.orderId), base + "/"), {
      headers: { "apikey": DX_CONFIG.supabaseKey, "Authorization": "Bearer " + session?.access_token }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Status pesanan gagal diperiksa.");
    const labels = { pending: "Menunggu pembayaran", review: "Menunggu pemeriksaan admin", paid: "LUNAS", rejected: "Bukti ditolak" };
    $("dxCheckoutStatus").textContent = labels[result.status] || result.status;
    $("dxCheckoutMessage").textContent = result.status === "paid"
      ? "Pembayaran telah diverifikasi oleh admin."
      : result.status === "rejected"
        ? "Bukti pembayaran ditolak. Hubungi admin DX STORE."
        : "Status terbaru: " + $("dxCheckoutStatus").textContent;
  } catch (error) { $("dxCheckoutMessage").textContent = getDXError(error); }
  finally { button.disabled = false; button.textContent = "↻ Cek Status Pesanan"; }
}

async function loadDXStore() {
  await Promise.all([
    loadProducts(),
    loadAccountListings()
  ]);
}

/* =========================================
   DX STORE - BAGIAN 3 DARI 5
   LOGIN, REGISTRASI DAN CEK ADMIN
========================================= */

async function loadDXProfile(user) {
  if (!dxSupabase || !user) {
    currentProfile = null;
    return null;
  }

  const { data, error } = await dxSupabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Gagal memuat profil:", error);
    currentProfile = null;
    return null;
  }

  currentProfile = data || {
    id: user.id,
    role: "user"
  };

  return currentProfile;
}

/* CEK ADMIN MELALUI RPC SUPABASE */

async function checkDXAdmin() {
  if (!dxSupabase || !currentUser) {
    return false;
  }

  const { data, error } = await dxSupabase.rpc("is_admin");

  if (error) {
    console.error("Pengecekan admin gagal:", error);
    return currentProfile?.role === "admin";
  }

  if (data === true) {
    currentProfile = {
      ...(currentProfile || {}),
      id: currentUser.id,
      role: "admin"
    };

    return true;
  }

  if (currentProfile) {
    currentProfile.role = "user";
  }

  return false;
}

/* GANTI MODE LOGIN DAN DAFTAR */

function setupDXAuthSwitch() {
  const switchButton = $("switchAuth");

  if (!switchButton) return;

  switchButton.onclick = () => {
    dxAuthMode = dxAuthMode === "login"
      ? "register"
      : "login";

    const submitButton = $("authSubmit");
    const title = $("authTitle");
    const text = $("authSwitchText");

    if (title) {
      title.textContent = dxAuthMode === "login"
        ? "Masuk ke DX STORE"
        : "Buat Akun DX STORE";
    }

    if (submitButton) {
      submitButton.textContent = dxAuthMode === "login"
        ? "Masuk"
        : "Daftar";
    }

    if (text) {
      text.textContent = dxAuthMode === "login"
        ? "Belum punya akun?"
        : "Sudah punya akun?";
    }

    switchButton.textContent = dxAuthMode === "login"
      ? "Daftar sekarang"
      : "Masuk sekarang";

    showDXMessage("");
  };
}

/* PROSES LOGIN DAN REGISTRASI */

async function handleAuthSubmit(event) {
  event.preventDefault();

  if (!dxSupabase) {
    showDXMessage("Supabase belum terhubung.");
    return;
  }

  const email = $("authEmail")?.value.trim();
  const password = $("authPassword")?.value;
  const submitButton = $("authSubmit");

  if (!email || !password) {
    showDXMessage("Email dan sandi wajib diisi.");
    return;
  }

  const originalText = submitButton?.textContent;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Memproses...";
  }

  try {
    let result;

    if (dxAuthMode === "login") {
      result = await dxSupabase.auth.signInWithPassword({
        email,
        password
      });
    } else {
      result = await dxSupabase.auth.signUp({
        email,
        password
      });
    }

    if (result.error) {
      throw result.error;
    }

    if (dxAuthMode === "register") {
      if (!result.data.session) {
        showDXMessage(
          "Pendaftaran berhasil. Silakan periksa email untuk konfirmasi akun."
        );
        return;
      }
    }

    currentUser = result.data.user;

    if (!currentUser) {
      showDXMessage("Akun belum berhasil masuk.");
      return;
    }

    await loadDXProfile(currentUser);

    const isAdmin = await checkDXAdmin();

    updateDXHeaderAuth();

    if (isAdmin) {
      createDXAdminPanel();

      const panel = $("dxAdminPanel");
      if (panel) panel.style.display = "block";

      if (typeof loadDXAdminList === "function") {
        await loadDXAdminList();
      }
    }

    if ($("authPassword")) {
      $("authPassword").value = "";
    }

    if ($("authPassword")) $("authPassword").value = "";
    if (window.location.pathname.endsWith("/login.html")) {
      window.location.replace("index.html");
      return;
    }

    closeAuth();
    await loadDXStore();

  } catch (error) {
    console.error("Auth error:", error);
    showDXMessage(getDXError(error));

  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText || "Masuk";
    }
  }
}

/* PERBARUI STATUS LOGIN */

async function refreshDXUser() {
  if (!dxSupabase) return;

  const { data, error } = await dxSupabase.auth.getUser();

  if (error || !data?.user) {
    currentUser = null;
    currentProfile = null;

    const panel = $("dxAdminPanel");
    if (panel) panel.style.display = "none";

    updateDXHeaderAuth();
    return;
  }

  currentUser = data.user;

  if (window.location.pathname.endsWith("/login.html")) {
    window.location.replace("index.html");
    return;
  }

  await loadDXProfile(currentUser);

  const isAdmin = await checkDXAdmin();

  updateDXHeaderAuth();

  if (isAdmin) {
    createDXAdminPanel();

    const panel = $("dxAdminPanel");
    if (panel) panel.style.display = "block";

    if (typeof loadDXAdminList === "function") {
      await loadDXAdminList();
    }
  } else {
    const panel = $("dxAdminPanel");
    if (panel) panel.style.display = "none";
  }
}

/* SALAM PERPISAHAN MASKOT DX-01 */
function showDXMascotFarewell() {
  const country = getDXCountry();
  const messages = {
    ID: ["Sampai jumpa! Terima kasih sudah berkunjung ke DX STORE. Semoga harimu menyenangkan!", "id-ID"],
    MY: ["Jumpa lagi! Terima kasih kerana mengunjungi DX STORE. Semoga hari anda menyenangkan!", "ms-MY"],
    SG: ["See you again! Thanks for visiting DX STORE. Have a great day!", "en-SG"],
    US: ["See you next time! Thanks for visiting DX STORE. Have a wonderful day!", "en-US"],
    JP: ["またお会いしましょう！DX STOREをご利用いただき、ありがとうございます。良い一日を！", "ja-JP"],
    TH: ["แล้วพบกันใหม่นะ! ขอบคุณที่แวะมา DX STORE ขอให้เป็นวันที่ดี!", "th-TH"],
    PH: ["See you again! Thank you for visiting DX STORE. Have a great day!", "en-PH"],
    AU: ["See you next time! Thanks for visiting DX STORE. Have a great day!", "en-AU"],
    GB: ["Goodbye for now! Thanks for visiting DX STORE. Have a lovely day!", "en-GB"],
    DE: ["Bis zum nächsten Mal! Danke für deinen Besuch bei DX STORE. Hab einen schönen Tag!", "de-DE"],
    FR: ["À bientôt ! Merci de votre visite sur DX STORE. Passez une excellente journée !", "fr-FR"],
    IN: ["फिर मिलेंगे! DX STORE पर आने के लिए धन्यवाद। आपका दिन शुभ हो!", "hi-IN"],
    KR: ["다음에 또 만나요! DX STORE를 방문해 주셔서 감사합니다. 좋은 하루 보내세요!", "ko-KR"],
    BR: ["Até a próxima! Obrigado por visitar a DX STORE. Tenha um ótimo dia!", "pt-BR"],
    CA: ["See you next time! Thanks for visiting DX STORE. Have a great day!", "en-CA"],
    CN: ["再见！感谢您访问 DX STORE，祝您今天愉快！", "zh-CN"]
  };
  const [message, lang] = messages[country.code] || messages.ID;
  let bubble = document.getElementById("dxMascotFarewell");
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.id = "dxMascotFarewell";
    bubble.setAttribute("role", "status");
    bubble.setAttribute("aria-live", "polite");
    bubble.style.cssText = "position:fixed;z-index:99999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,calc(100vw - 32px));padding:22px 24px;border:1px solid #51e5ff99;border-radius:18px;background:linear-gradient(145deg,#13284a,#171333);box-shadow:0 18px 70px #000b,0 0 28px #278fff55;color:#f4f8ff;text-align:center;font:600 15px/1.65 Inter,sans-serif";
    document.body.appendChild(bubble);
  }
  bubble.innerHTML = '<div style="color:#51e5ff;font-size:11px;letter-spacing:2px;font-weight:900;margin-bottom:8px">DX-01 · SEE YOU AGAIN</div><div></div>';
  bubble.lastElementChild.textContent = message;
  if ("speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined") {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = lang;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }
  return new Promise(function(resolve) {
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      bubble.remove();
      resolve();
    }
    const fallback = window.setTimeout(finish, 9000);
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = lang;
      utterance.rate = 1;
      utterance.onend = function() { window.clearTimeout(fallback); finish(); };
      utterance.onerror = function() { window.clearTimeout(fallback); finish(); };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      window.setTimeout(function() { window.clearTimeout(fallback); finish(); }, 2200);
    }
  });
}

/* KELUAR DARI AKUN */

async function handleDXLogout() {
  if (!dxSupabase) return;

  const { error } = await dxSupabase.auth.signOut();

  if (error) {
    alert(getDXError(error));
    return;
  }

  currentUser = null;
  currentProfile = null;

  const panel = $("dxAdminPanel");
  if (panel) panel.style.display = "none";

  updateDXHeaderAuth();
  await showDXMascotFarewell();
  window.location.href = "login.html";
}

/* NAVIGASI */

function initDXNavigation() {
  document.querySelectorAll(".dxNavLinks a").forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = link.getAttribute("href");

      if (!target || !target.startsWith("#")) return;

      const section = document.querySelector(target);

      if (section) {
        event.preventDefault();
        section.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });
}

/* =========================================
   DX STORE - BAGIAN 4 DARI 5
   PANEL ADMINISTRATOR
========================================= */

function createDXAdminPanel() {
  if ($("dxAdminPanel")) return;

  const main = document.querySelector("main");

  if (!main) {
    console.error("DX STORE: Elemen main tidak ditemukan.");
    return;
  }

  const panel = document.createElement("section");
  panel.id = "dxAdminPanel";
  panel.style.display = "none";
  panel.style.margin = "30px auto";
  panel.style.padding = "24px";
  panel.style.maxWidth = "1100px";
  panel.style.background = "#101b32";
  panel.style.border = "1px solid #263c60";
  panel.style.borderRadius = "16px";
  panel.style.color = "#ffffff";

  panel.innerHTML = `
    <h2 style="color:#38bdf8;margin-top:0;">
      DX STORE - ADMINISTRATOR
    </h2>

    <p>Kelola produk digital dan marketplace akun game.</p>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:20px 0;">
      <button type="button" id="dxAdminProducts">
        Produk Digital
      </button>

      <button type="button" id="dxAdminAccounts">
        Akun Game
      </button>

      <button type="button" id="dxAdminLogout">
        Keluar
      </button>
    </div>

    <form id="dxAdminForm">
      <input type="hidden" id="dxEditId">

      <div id="dxGameWrap" style="display:none;margin-bottom:12px;">
        <label for="dxGame">Nama game</label>
        <input
          id="dxGame"
          type="text"
          placeholder="Contoh: Mobile Legends"
        >
      </div>

      <div style="margin-bottom:12px;">
        <label for="dxName" id="dxNameLabel">Nama produk</label>
        <input
          id="dxName"
          type="text"
          placeholder="Nama produk atau judul akun"
          required
        >
      </div>

      <div style="margin-bottom:12px;">
        <label for="dxDescription">Deskripsi</label>
        <textarea
          id="dxDescription"
          rows="4"
          placeholder="Deskripsi produk atau akun"
        ></textarea>
      </div>

      <div style="margin-bottom:12px;">
        <label for="dxPrice">Harga (Rupiah)</label>
        <input
          id="dxPrice"
          type="number"
          min="0"
          step="1"
          placeholder="Contoh: 50000"
          required
        >
      </div>

      <div style="margin-bottom:12px;">
        <label for="dxImage">URL gambar</label>
        <input
          id="dxImage"
          type="url"
          placeholder="https://contoh.com/gambar.jpg"
        >
      </div>

      <button type="submit" id="dxSaveButton">
        Simpan Produk
      </button>

      <button type="button" id="dxCancelEdit" style="display:none;">
        Batal Edit
      </button>
    </form>

    <p id="dxAdminMessage" aria-live="polite"></p>

    <hr style="border-color:#263c60;margin:25px 0;">

    <h3>Daftar Data</h3>

    <div id="dxAdminList">
      Memuat data...
    </div>
    <hr style="border-color:#263c60;margin:25px 0;">
    <h3>Pesanan &amp; Verifikasi Pembayaran QRIS</h3>
    <button type="button" id="dxRefreshPaymentOrders">Muat Ulang Pesanan</button>
    <div id="dxPaymentOrders">Memuat pesanan...</div>
  `;

  main.prepend(panel);
  installDXRupiahInput($("dxPrice"));

  if (!$("dxAdminStyles")) {
    const style = document.createElement("style");
    style.id = "dxAdminStyles";

    style.textContent = `
      #dxAdminPanel input,
      #dxAdminPanel textarea {
        display:block;
        box-sizing:border-box;
        width:100%;
        padding:12px;
        margin-top:6px;
        border:1px solid #334b70;
        border-radius:8px;
        background:#0b1426;
        color:#ffffff;
      }

      #dxAdminPanel label {
        display:block;
        color:#cbd5e1;
        font-size:14px;
      }

      #dxAdminPanel button {
        padding:11px 16px;
        border:0;
        border-radius:8px;
        background:#0879d1;
        color:#ffffff;
        cursor:pointer;
        margin:4px 4px 4px 0;
      }

      #dxAdminPanel button:disabled {
        opacity:.6;
        cursor:not-allowed;
      }

      #dxAdminList article {
        padding:14px;
        margin:12px 0;
        border:1px solid #334b70;
        border-radius:10px;
        background:#0b1426;
      }

      #dxAdminList article h4 {
        margin:0 0 8px;
        color:#7dd3fc;
      }
    `;

    document.head.appendChild(style);
  }

  $("dxAdminProducts").addEventListener("click", () => {
    dxAdminType = "products";
    resetDXAdminForm();
    loadDXAdminList();
    updateDXAdminFormLabels();
  });

  $("dxAdminAccounts").addEventListener("click", () => {
    dxAdminType = "account_listings";
    resetDXAdminForm();
    loadDXAdminList();
    updateDXAdminFormLabels();
  });

  $("dxAdminLogout").addEventListener("click", handleDXLogout);
  $("dxRefreshPaymentOrders").addEventListener("click", loadDXPaymentOrders);
  $("dxPaymentOrders").addEventListener("click", event => {
    const button = event.target.closest("[data-dx-order][data-dx-decision]");
    if (button) reviewDXPayment(button.dataset.dxOrder, button.dataset.dxDecision);
  });
  $("dxCancelEdit").addEventListener("click", resetDXAdminForm);
  $("dxAdminForm").addEventListener("submit", saveDXAdminItem);

  updateDXAdminFormLabels();
}

function updateDXAdminFormLabels() {
  const isAccount = dxAdminType === "account_listings";

  if (!$("dxGameWrap")) return;

  $("dxGameWrap").style.display = isAccount ? "block" : "none";

  $("dxNameLabel").textContent = isAccount
    ? "Judul akun"
    : "Nama produk";

  $("dxName").placeholder = isAccount
    ? "Contoh: Akun Mobile Legends"
    : "Nama produk digital";

  $("dxSaveButton").textContent = $("dxEditId").value
    ? "Perbarui Data"
    : isAccount
      ? "Simpan Akun"
      : "Simpan Produk";
}

function resetDXAdminForm() {
  const form = $("dxAdminForm");
  if (!form) return;

  form.reset();
  $("dxEditId").value = "";
  $("dxCancelEdit").style.display = "none";

  updateDXAdminFormLabels();

  $("dxAdminMessage").textContent = "";
}

/* =========================================
   DX STORE - BAGIAN 5 DARI 5
   SIMPAN, EDIT, HAPUS, DAN INISIALISASI
========================================= */

/* DAFTAR DATA ADMIN */

async function loadDXAdminList() {
  if (!dxSupabase) return;

  const container = $("dxAdminList");
  if (!container) return;

  container.textContent = "Memuat data...";

  const { data, error } = await dxSupabase
    .from(dxAdminType)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal memuat data admin:", error);
    container.textContent = "Data gagal dimuat: " + error.message;
    return;
  }

  if (!data || data.length === 0) {
    container.textContent = "Belum ada data.";
    return;
  }

  container.innerHTML = data.map((item) => {
    const title = dxAdminType === "products"
      ? item.name
      : item.title;

    return `
      <article>
        <h4>${safeText(title)}</h4>

        ${dxAdminType === "account_listings"
          ? `<p>Game: ${safeText(item.game)}</p>`
          : ""}

        <p>Harga: ${formatPrice(item.price)}</p>
        <p>Status moderasi: <strong>${safeText(item.status || (dxAdminType === "products" ? "active" : "pending"))}</strong></p>
        <p>Status penjualan: <strong>${safeText(item.sale_status || "available")}</strong></p>
        ${item.sale_status && item.sale_status !== "available" ? '<button type="button" onclick="setDXSaleStatus(\'' + dxAdminType + '\', \'' + safeText(item.id) + '\', \'available\')">Aktifkan Kembali / Tersedia</button>' : ""}

        ${item.status === "pending"
          ? `<button type="button" onclick="reviewDXListing('${dxAdminType}', '${safeText(item.id)}', 'active')">Setujui / Terbitkan</button>
             <button type="button" onclick="reviewDXListing('${dxAdminType}', '${safeText(item.id)}', 'rejected')">Tolak</button>`
          : ""}

        <button
          type="button"
          onclick="editDXAdminItem('${safeText(item.id)}')"
        >Edit</button>

        <button
          type="button"
          onclick="deleteDXAdminItem('${safeText(item.id)}')"
        >Hapus</button>
      </article>
    `;
  }).join("");
}

async function loadDXPaymentOrders() {
  const container = $("dxPaymentOrders");
  if (!container || !currentUser || !(await checkDXAdmin())) return;
  container.textContent = "Memuat pesanan...";
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    const response = await fetch(new URL("api/admin/orders", DX_CONFIG.paymentApiUrl + "/"), {
      headers: { "apikey": DX_CONFIG.supabaseKey, "Authorization": "Bearer " + session?.access_token }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Pesanan gagal dimuat.");
    if (!result.orders?.length) { container.textContent = "Belum ada pesanan."; return; }
    container.innerHTML = result.orders.map(order => `
      <article>
        <h4>${safeText(order.item_name)} — ${safeText(order.order_id)}</h4>
        <p>Nominal: <strong>${formatPrice(order.amount)}</strong></p>
        <p>Status: <strong>${safeText(order.status)}</strong></p>
        <p>Dibuat: ${new Date(order.created_at).toLocaleString("id-ID")}</p>
        ${order.proof_url ? `<p><a href="${safeText(order.proof_url)}" target="_blank" rel="noopener">Lihat bukti pembayaran</a></p>` : "<p>Belum ada bukti pembayaran.</p>"}
        ${order.status === "review" ? `
          <button type="button" data-dx-order="${safeText(order.order_id)}" data-dx-decision="paid">Setujui — sudah cek dana masuk</button>
          <button type="button" data-dx-order="${safeText(order.order_id)}" data-dx-decision="rejected">Tolak bukti</button>
        ` : order.status === "pending" ? `
          <button type="button" data-dx-order="${safeText(order.order_id)}" data-dx-decision="rejected">Batalkan pesanan / lepaskan barang</button>
        ` : ""}
      </article>
    `).join("");
  } catch (error) { container.textContent = getDXError(error); }
}

async function reviewDXPayment(orderId, status) {
  if (!currentUser || !(await checkDXAdmin())) { alert("Akses admin diperlukan."); return; }
  const message = status === "paid"
    ? "Pastikan dana benar-benar sudah masuk ke DANA Bisnis sebelum menyetujui. Lanjutkan?"
    : "Tolak bukti pembayaran ini?";
  if (!confirm(message)) return;
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    const response = await fetch(new URL("api/admin/orders/" + encodeURIComponent(orderId), DX_CONFIG.paymentApiUrl + "/"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session?.access_token },
      body: JSON.stringify({ status })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Status pesanan gagal diperbarui.");
    await loadDXPaymentOrders();
  } catch (error) { alert(getDXError(error)); }
}

/* SIMPAN DATA */

async function saveDXAdminItem(event) {
  event.preventDefault();

  if (!dxSupabase || !currentUser || !(await checkDXAdmin())) {
    showDXAdminMessage("Akses ditolak. Khusus administrator.");
    return;
  }

  const isAccount = dxAdminType === "account_listings";
  const editId = $("dxEditId").value;
  const name = $("dxName").value.trim();
  const description = $("dxDescription").value.trim();
  const price = parseDXRupiahInput($("dxPrice").value);
  const imageUrl = $("dxImage").value.trim();

  if (!name || !Number.isFinite(price) || price < 0) {
    showDXAdminMessage("Nama dan harga harus diisi dengan benar.");
    return;
  }

  if (isAccount && !$("dxGame").value.trim()) {
    showDXAdminMessage("Nama game wajib diisi.");
    return;
  }

  const payload = {
    description: description || null,
    price,
    image_url: imageUrl || null,
    updated_at: new Date().toISOString()
  };

  if (isAccount) {
    payload.game = $("dxGame").value.trim();
    payload.title = name;
  } else {
    payload.name = name;
  }

  const saveButton = $("dxSaveButton");
  saveButton.disabled = true;
  saveButton.textContent = "Menyimpan...";

  try {
    let result;

    if (editId) {
      result = await dxSupabase
        .from(dxAdminType)
        .update(payload)
        .eq("id", editId);
    } else {
      if (isAccount) {
        // Kiriman akun game menunggu pemeriksaan admin.
        payload.seller_id = currentUser.id;
        payload.status = "pending";
      } else {
        // Produk digital yang dibuat admin langsung aktif.
        payload.status = "active";
      }

      result = await dxSupabase
        .from(dxAdminType)
        .insert(payload);
    }

    if (result.error) throw result.error;

    showDXAdminMessage(
      editId
        ? "Data berhasil diperbarui!"
        : "Data berhasil disimpan!"
    );

    resetDXAdminForm();
    await loadDXAdminList();
    await loadDXStore();

  } catch (error) {
    console.error(error);
    showDXAdminMessage("Gagal menyimpan: " + getDXError(error));
  } finally {
    saveButton.disabled = false;
    updateDXAdminFormLabels();
  }
}

/* VERIFIKASI AKUN GAME OLEH ADMIN */

async function reviewDXListing(table, id, status) {
  if (!currentUser || !(await checkDXAdmin())) {
    alert("Akses ditolak. Khusus administrator.");
    return;
  }

  if (!["products", "account_listings"].includes(table)) return;
  if (!["active", "rejected"].includes(status)) return;

  const label = status === "active" ? "menyetujui dan menerbitkan" : "menolak";
  const itemLabel = table === "products" ? "produk digital" : "akun game";
  if (!confirm("Yakin ingin " + label + " " + itemLabel + " ini?")) return;

  const { error } = await dxSupabase
    .from(table)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    alert("Gagal memverifikasi: " + getDXError(error));
    return;
  }

  showDXAdminMessage(status === "active"
    ? itemLabel + " berhasil disetujui dan diterbitkan."
    : "Pengajuan " + itemLabel + " ditolak.");
  await loadDXAdminList();
  await loadDXStore();
}

async function setDXSaleStatus(table, id, status) {
  if (!currentUser || !(await checkDXAdmin())) { alert("Akses admin diperlukan."); return; }
  if (!["products", "account_listings"].includes(table) || status !== "available") return;
  if (!confirm("Aktifkan kembali barang ini agar bisa dipesan?")) return;
  const { error } = await dxSupabase.from(table)
    .update({ sale_status: "available", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { alert("Gagal mengubah status: " + getDXError(error)); return; }
  await loadDXAdminList();
  await loadDXStore();
}

/* EDIT DATA */

async function editDXAdminItem(id) {
  if (!currentUser || !(await checkDXAdmin())) {
    alert("Akses ditolak.");
    return;
  }

  const { data, error } = await dxSupabase
    .from(dxAdminType)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    alert("Data tidak ditemukan.");
    return;
  }

  $("dxEditId").value = data.id;
  $("dxName").value = dxAdminType === "products"
    ? data.name
    : data.title;

  $("dxDescription").value = data.description || "";
  $("dxPrice").value = formatDXRupiahInput(data.price);
  $("dxImage").value = data.image_url || "";

  if (dxAdminType === "account_listings") {
    $("dxGame").value = data.game || "";
  }

  $("dxCancelEdit").style.display = "inline-block";
  updateDXAdminFormLabels();

  showDXAdminMessage("Mode edit aktif. Silakan ubah data.");

  $("dxAdminPanel").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/* HAPUS DATA */

async function deleteDXAdminItem(id) {
  if (!currentUser || !(await checkDXAdmin())) {
    alert("Akses ditolak.");
    return;
  }

  if (!confirm("Yakin ingin menghapus data ini?")) return;

  const { error } = await dxSupabase
    .from(dxAdminType)
    .delete()
    .eq("id", id);

  if (error) {
    alert("Gagal menghapus: " + getDXError(error));
    return;
  }

  showDXAdminMessage("Data berhasil dihapus.");

  resetDXAdminForm();
  await loadDXAdminList();
  await loadDXStore();
}

/* PERBAIKAN TOMBOL LOGIN / DAFTAR */

function switchAuthMode() {
  const form = $("authForm");
  if (!form) return;

  dxAuthMode = dxAuthMode === "login" ? "register" : "login";

  let nameInput = $("dxRegisterName");

  if (dxAuthMode === "register" && !nameInput) {
    nameInput = document.createElement("input");
    nameInput.id = "dxRegisterName";
    nameInput.type = "text";
    nameInput.placeholder = "Nama pengguna";
    nameInput.autocomplete = "name";
    nameInput.required = true;
    nameInput.style.cssText =
      "width:100%;margin-bottom:12px;padding:12px;border-radius:8px;";

    const emailInput = $("authEmail");
    if (emailInput) form.insertBefore(nameInput, emailInput);
  }

  if (dxAuthMode === "login" && nameInput) {
    nameInput.remove();
  }

  const submit = form.querySelector('button[type="submit"]');

  if (submit) {
    submit.textContent = dxAuthMode === "login" ? "Masuk" : "Daftar";
  }

  const switchButton = $("dxAuthSwitch");

  if (switchButton) {
    switchButton.textContent = dxAuthMode === "login"
      ? "Belum punya akun? Daftar"
      : "Sudah punya akun? Masuk";
  }

  showDXMessage("");
}

function setupDXAuthSwitch() {
  const form = $("authForm");
  if (!form || $("dxAuthSwitch")) return;

  const button = document.createElement("button");
  button.id = "dxAuthSwitch";
  button.type = "button";
  button.textContent = "Belum punya akun? Daftar";
  button.style.cssText =
    "display:block;width:100%;margin-top:14px;padding:10px;border:0;background:transparent;color:#38bdf8;cursor:pointer;";

  button.addEventListener("click", switchAuthMode);
  form.appendChild(button);
}

/* PROSES LOGIN DAN DAFTAR */

async function handleAuthSubmit(event) {
  event.preventDefault();

  if (!dxSupabase) {
    showDXMessage("Supabase belum terhubung.");
    return;
  }

  const email = $("authEmail")?.value.trim();
  const password = $("authPassword")?.value;
  const name = $("dxRegisterName")?.value.trim();

  if (!email || !password) {
    showDXMessage("Email dan password wajib diisi.");
    return;
  }

  if (password.length < 6) {
    showDXMessage("Password minimal 6 karakter.");
    return;
  }

  const submit = $("authForm")?.querySelector('button[type="submit"]');
  const originalText = submit?.textContent;

  if (submit) {
    submit.disabled = true;
    submit.textContent = "Memproses...";
  }

  try {
    let result;

    if (dxAuthMode === "register") {
      result = await dxSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name || email.split("@")[0]
          }
        }
      });

      if (result.error) throw result.error;

      if (!result.data.session) {
        showDXMessage(
          "Pendaftaran berhasil. Periksa email jika verifikasi diminta."
        );
        return;
      }
    } else {
      result = await dxSupabase.auth.signInWithPassword({
        email,
        password
      });

      if (result.error) throw result.error;
    }

    currentUser = result.data.user;

    await loadDXProfile(currentUser);

    const isAdmin = await checkDXAdmin();

    updateDXHeaderAuth();

    if (isAdmin) {
      createDXAdminPanel();

      const panel = $("dxAdminPanel");

      if (panel) {
        panel.style.display = "block";
        await loadDXAdminList();
        await loadDXPaymentOrders();
        panel.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }

    if ($("authPassword")) $("authPassword").value = "";

    closeAuth();
    await loadDXStore();

  } catch (error) {
    console.error("Kesalahan autentikasi:", error);
    showDXMessage(getDXError(error));
  } finally {
    if (submit) {
      submit.disabled = false;
      submit.textContent = originalText || "Masuk";
    }
  }
}

/* PERBARUI STATUS PENGGUNA */

async function refreshDXUser() {
  if (!dxSupabase) return;

  const { data, error } = await dxSupabase.auth.getUser();

  if (error || !data?.user) {
    currentUser = null;
    currentProfile = null;

    const panel = $("dxAdminPanel");
    if (panel) panel.style.display = "none";

    updateDXHeaderAuth();
    return;
  }

  currentUser = data.user;

  await loadDXProfile(currentUser);

  const isAdmin = await checkDXAdmin();

  updateDXHeaderAuth();

  if (isAdmin) {
    createDXAdminPanel();

    const panel = $("dxAdminPanel");
    if (panel) panel.style.display = "block";

    await loadDXAdminList();
    await loadDXPaymentOrders();
  } else {
    const panel = $("dxAdminPanel");
    if (panel) panel.style.display = "none";
  }
}

/* KELUAR */

async function handleDXLogout() {
  if (!dxSupabase || window.dxLogoutInProgress) return;
  window.dxLogoutInProgress = true;

  const logoutButton = document.querySelector(".dx-nav-actions .dx-button");
  if (logoutButton) {
    logoutButton.disabled = true;
    logoutButton.textContent = "Keluar...";
  }

  try {
    const { error } = await dxSupabase.auth.signOut();
    if (error) throw error;

    currentUser = null;
    currentProfile = null;

    const panel = $("dxAdminPanel");
    if (panel) panel.style.display = "none";

    updateDXHeaderAuth();

    // Salam perpisahan DX-01 ditampilkan dan dibacakan sebelum kembali ke login.
    if (typeof showDXMascotFarewell === "function") {
      await showDXMascotFarewell();
    }

    window.location.replace("login.html");
  } catch (error) {
    window.dxLogoutInProgress = false;
    if (logoutButton) {
      logoutButton.disabled = false;
      logoutButton.textContent = "Keluar";
    }
    alert("Gagal keluar: " + getDXError(error));
  }
}

/* NAVIGASI */

function initDXNavigation() {
  const navigation = $("dxNavLinks");
  if (!navigation) return;

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
    });
  });
}

/* INISIALISASI APLIKASI */

async function initializeDXStore() {
  if (dxAuthReady) return;
  dxAuthReady = true;

  if (!dxSupabase) {
    console.error("Supabase tidak tersedia.");
    return;
  }

  setupDXAuthSwitch();
  const countrySelect = $("dxCountry");
  if (countrySelect) {
    countrySelect.value = getDXCountry().code;
    countrySelect.addEventListener("change", () => setDXCountry(countrySelect.value));
  }
  setDXCountry(getDXCountry().code);
  initDXNavigation();
  const searchInput = document.getElementById("dxMarketplaceSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLocaleLowerCase("id-ID");
      document.querySelectorAll("#productGrid .product-card, #accountGrid .product-card").forEach(card => {
        card.hidden = !card.textContent.toLocaleLowerCase("id-ID").includes(query);
      });
    });
  }

  const authForm = $("authForm");

  if (authForm) {
    authForm.addEventListener("submit", handleAuthSubmit);
  }

  createDXAdminPanel();

  await refreshDXUser();
  await loadDXStore();

  dxSupabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;

    if (event === "SIGNED_OUT") {
      currentProfile = null;

      const panel = $("dxAdminPanel");
      if (panel) panel.style.display = "none";

      updateDXHeaderAuth();
      loadDXStore();
      return;
    }

    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
      setTimeout(async () => {
        await refreshDXUser();
        await loadDXStore();
      }, 0);
    }
  });
}

/* JALANKAN DX STORE */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeDXStore
  );
} else {
  initializeDXStore();
}
