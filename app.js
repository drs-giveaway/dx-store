
/* =====================================
   DX STORE - APP.JS
   ===================================== */

const config = window.DX_CONFIG;

let db = null;
let currentUser = null;
let authMode = "login";

const productGrid = document.getElementById("productGrid");
const accountGrid = document.getElementById("accountGrid");
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");

/* Membuat teks aman sebelum ditampilkan */
function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

/* Format harga Rupiah */
function formatPrice(price) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(price) || 0);
}

/* Kartu produk */
function createCard(item, type) {
  const title = type === "product"
    ? item.name
    : item.title;

  const description = item.description || "Informasi produk tersedia.";

  return `
    <article class="product-card">
      <span class="eyebrow">
        ${type === "product" ? "PRODUK DIGITAL" : safeText(item.game || "AKUN GAME")}
      </span>

      <h3>${safeText(title)}</h3>
      <p>${safeText(description)}</p>

      <strong class="product-price">
        ${formatPrice(item.price)}
      </strong>

      <button class="btn-primary" onclick="selectItem('${type}')">
        Lihat Produk
      </button>
    </article>
  `;
}

/* Memuat produk digital */
async function loadProducts() {
  productGrid.innerHTML = '<div class="loading-card">Memuat produk...</div>';

  const { data, error } = await db
    .from("products")
    .select("id, name, description, price, image_url")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    productGrid.innerHTML =
      '<div class="loading-card">Produk belum dapat dimuat. Periksa konfigurasi Supabase dan izin tabel.</div>';
    console.error("Products:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    productGrid.innerHTML =
      '<div class="loading-card">Belum ada produk digital yang tersedia.</div>';
    return;
  }

  productGrid.innerHTML = data
    .map(item => createCard(item, "product"))
    .join("");
}

/* Memuat marketplace akun game */
async function loadAccounts() {
  accountGrid.innerHTML = '<div class="loading-card">Memuat akun game...</div>';

  const { data, error } = await db
    .from("account_listings")
    .select("id, game, title, description, price, image_url")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    accountGrid.innerHTML =
      '<div class="loading-card">Akun game belum dapat dimuat. Periksa konfigurasi Supabase dan izin tabel.</div>';
    console.error("Accounts:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    accountGrid.innerHTML =
      '<div class="loading-card">Belum ada akun game yang tersedia.</div>';
    return;
  }

  accountGrid.innerHTML = data
    .map(item => createCard(item, "account"))
    .join("");
}

/* Membuka halaman autentikasi */
function openAuth(mode = "login") {
  authMode = mode;
  updateAuthModal();
  authModal.classList.remove("hidden");
  authMessage.textContent = "";
}

/* Mengubah tampilan login / daftar */
function updateAuthModal() {
  const isLogin = authMode === "login";

  authTitle.textContent = isLogin ? "Masuk Akun" : "Buat Akun";
  authSubmit.textContent = isLogin ? "Masuk" : "Daftar";
  document.getElementById("switchAuth").textContent =
    isLogin ? "Daftar" : "Masuk";

  document.getElementById("authSwitch").childNodes[0].textContent =
    isLogin ? "Belum punya akun? " : "Sudah punya akun? ";
}

/* Proses login dan pendaftaran */
authForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!db) {
    authMessage.textContent = "Koneksi Supabase belum tersedia.";
    return;
  }

  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;

  authSubmit.disabled = true;
  authSubmit.textContent = "Memproses...";
  authMessage.textContent = "";

  let result;

  if (authMode === "login") {
    result = await db.auth.signInWithPassword({
      email,
      password
    });
  } else {
    result = await db.auth.signUp({
      email,
      password
    });
  }

  authSubmit.disabled = false;
  authSubmit.textContent = authMode === "login" ? "Masuk" : "Daftar";

  if (result.error) {
    authMessage.textContent = result.error.message;
    return;
  }

  if (authMode === "register" && !result.data.session) {
    authMessage.textContent =
      "Pendaftaran berhasil. Periksa email jika verifikasi diminta.";
    return;
  }

  currentUser = result.data.user;
  authModal.classList.add("hidden");
  updateAccountButton();
});

/* Status akun */
function updateAccountButton() {
  const loginButton = document.getElementById("loginButton");

  if (currentUser) {
    loginButton.textContent = "Keluar";
    loginButton.onclick = async () => {
      await db.auth.signOut();
      currentUser = null;
      updateAccountButton();
    };
  } else {
    loginButton.textContent = "Masuk";
    loginButton.onclick = () => openAuth("login");
  }
}

/* Tombol produk */
function selectItem(type) {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  alert(
    type === "product"
      ? "Kamu sudah masuk. Fitur pemesanan akan ditambahkan setelah sistem checkout dan pembayaran dikonfigurasi."
      : "Kamu sudah masuk. Fitur pembelian akun akan ditambahkan setelah sistem checkout dikonfigurasi."
  );
}

/* Tombol navigasi dan modal */
document.getElementById("registerButton").onclick =
  () => openAuth("register");

document.getElementById("ctaRegister").onclick =
  () => openAuth("register");

document.getElementById("closeModal").onclick =
  () => authModal.classList.add("hidden");

document.getElementById("switchAuth").onclick = () => {
  authMode = authMode === "login" ? "register" : "login";
  updateAuthModal();
  authMessage.textContent = "";
};

authModal.addEventListener("click", event => {
  if (event.target === authModal) {
    authModal.classList.add("hidden");
  }
});

/* Menu HP */
document.getElementById("menuButton").onclick = () => {
  document.querySelector(".navigation").classList.toggle("open");
};

document.querySelectorAll(".navigation a").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelector(".navigation").classList.remove("open");
  });
});

/* Tahun footer */
document.getElementById("currentYear").textContent =
  new Date().getFullYear();

/* Inisialisasi Supabase */
async function initializeDXStore() {
  if (
    !config ||
    !config.supabaseUrl ||
    !config.supabaseKey ||
    !window.supabase
  ) {
    productGrid.innerHTML =
      '<div class="loading-card">Konfigurasi Supabase belum tersedia.</div>';

    accountGrid.innerHTML =
      '<div class="loading-card">Konfigurasi Supabase belum tersedia.</div>';

    return;
  }

  db = window.supabase.createClient(
    config.supabaseUrl,
    config.supabaseKey
  );

  const { data } = await db.auth.getSession();
  currentUser = data.session?.user || null;

  updateAccountButton();

  db.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateAccountButton();
  });

  await Promise.all([
    loadProducts(),
    loadAccounts()
  ]);
}

/* Jalankan aplikasi */
initializeDXStore();
