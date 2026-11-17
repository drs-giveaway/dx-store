
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

/* Teks aman */
function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

/* URL gambar aman */
function safeImageUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(String(value));

    return ["https:", "http:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

/* Format Rupiah */
function formatPrice(price) {
  const amount = Number(price);

  if (!Number.isFinite(amount) || amount < 0) {
    return "Hubungi penjual";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

/* Membuat kartu produk */
function createCard(item, type) {
  const title = type === "product"
    ? item.name
    : item.title;

  const imageUrl = safeImageUrl(item.image_url);

  const label = type === "product"
    ? "PRODUK DIGITAL"
    : (item.game || "AKUN GAME");

  const image = imageUrl
    ? `<img class="listing-image"
        src="${safeText(imageUrl)}"
        alt="${safeText(title || "Gambar produk")}"
        loading="lazy">`
    : `<div class="listing-image listing-image-placeholder">
        <span>DX STORE</span>
      </div>`;

  return `
    <article class="product-card">

      ${image}

      <span class="eyebrow">
        ${safeText(label)}
      </span>

      <h3>${safeText(title || "Tanpa judul")}</h3>

      <p>
        ${safeText(item.description || "Informasi produk tersedia.")}
      </p>

      <strong class="product-price">
        ${formatPrice(item.price)}
      </strong>

      <button
        class="btn-primary item-action"
        type="button"
        data-item-type="${type}"
        data-item-id="${safeText(item.id)}">
        Lihat Produk
      </button>

    </article>
  `;
}

/* Memuat produk digital */
async function loadProducts() {
  if (!productGrid || !db) return;

  productGrid.innerHTML =
    '<div class="loading-card">Memuat produk...</div>';

  try {
    const { data, error } = await db
      .from("products")
      .select("id, name, description, price, image_url")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data?.length) {
      productGrid.innerHTML =
        '<div class="loading-card">Belum ada produk digital yang tersedia.</div>';
      return;
    }

    productGrid.innerHTML = data
      .map(item => createCard(item, "product"))
      .join("");

  } catch (error) {
    console.error("Gagal memuat produk:", error);

    productGrid.innerHTML =
      '<div class="loading-card">Produk belum dapat dimuat. Silakan coba lagi nanti.</div>';
  }
}

/* Memuat akun game */
async function loadAccounts() {
  if (!accountGrid || !db) return;

  accountGrid.innerHTML =
    '<div class="loading-card">Memuat akun game...</div>';

  try {
    const { data, error } = await db
      .from("account_listings")
      .select("id, game, title, description, price, image_url")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data?.length) {
      accountGrid.innerHTML =
        '<div class="loading-card">Belum ada akun game yang tersedia.</div>';
      return;
    }

    accountGrid.innerHTML = data
      .map(item => createCard(item, "account"))
      .join("");

  } catch (error) {
    console.error("Gagal memuat akun:", error);

    accountGrid.innerHTML =
      '<div class="loading-card">Akun game belum dapat dimuat. Silakan coba lagi nanti.</div>';
  }
}

/* Modal login dan daftar */
function openAuth(mode = "login") {
  if (!authModal) return;

  authMode = mode;
  updateAuthModal();

  authModal.classList.remove("hidden");

  if (authMessage) authMessage.textContent = "";
}

function updateAuthModal() {
  const isLogin = authMode === "login";

  if (authTitle) {
    authTitle.textContent = isLogin
      ? "Masuk Akun"
      : "Buat Akun";
  }

  if (authSubmit) {
    authSubmit.textContent = isLogin
      ? "Masuk"
      : "Daftar";
  }

  const switchButton =
    document.getElementById("switchAuth");

  const switchContainer =
    document.getElementById("authSwitch");

  if (switchButton) {
    switchButton.textContent = isLogin
      ? "Daftar"
      : "Masuk";
  }

  if (switchContainer?.firstChild) {
    switchContainer.firstChild.textContent = isLogin
      ? "Belum punya akun? "
      : "Sudah punya akun? ";
  }
}

/* Proses login dan pendaftaran */
if (authForm) {
  authForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!db) {
      authMessage.textContent =
        "Koneksi Supabase belum tersedia.";
      return;
    }

    const email =
      document.getElementById("authEmail")?.value.trim();

    const password =
      document.getElementById("authPassword")?.value;

    if (!email || !password) {
      authMessage.textContent =
        "Masukkan email dan kata sandi.";
      return;
    }

    authSubmit.disabled = true;
    authSubmit.textContent = "Memproses...";
    authMessage.textContent = "";

    try {
      const result = authMode === "login"
        ? await db.auth.signInWithPassword({
            email,
            password
          })
        : await db.auth.signUp({
            email,
            password
          });

      if (result.error) throw result.error;

      if (authMode === "register" && !result.data.session) {
        authMessage.textContent =
          "Pendaftaran berhasil. Periksa email jika verifikasi diminta.";
        return;
      }

      currentUser = result.data.user || null;

      authModal.classList.add("hidden");
      updateAccountButton();

    } catch (error) {
      authMessage.textContent =
        error.message || "Terjadi kesalahan. Silakan coba lagi.";

    } finally {
      authSubmit.disabled = false;

      authSubmit.textContent =
        authMode === "login" ? "Masuk" : "Daftar";
    }
  });
}

/* Status akun */
function updateAccountButton() {
  const loginButton =
    document.getElementById("loginButton");

  if (!loginButton) return;

  loginButton.textContent =
    currentUser ? "Keluar" : "Masuk";

  loginButton.onclick = async () => {
    if (!currentUser) {
      openAuth("login");
      return;
    }

    try {
      const { error } = await db.auth.signOut();

      if (error) throw error;

      currentUser = null;
      updateAccountButton();

    } catch (error) {
      console.error("Gagal keluar:", error);
      alert("Belum berhasil keluar. Coba lagi.");
    }
  };
}

/* Pilihan produk */
function selectItem(type, id) {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  alert(
    "Produk berhasil dipilih.\n\n" +
    "Sistem checkout dan pembayaran DX STORE " +
    "masih dalam tahap pengembangan."
  );

  console.info("Item dipilih:", {
    type,
    id,
    userId: currentUser.id
  });
}

/* Tombol kartu produk */
document.addEventListener("click", event => {
  const button = event.target.closest(".item-action");

  if (!button) return;

  selectItem(
    button.dataset.itemType,
    button.dataset.itemId
  );
});

/* Tombol navigasi */
document.getElementById("registerButton")
  ?.addEventListener("click", () => openAuth("register"));

document.getElementById("ctaRegister")
  ?.addEventListener("click", () => openAuth("register"));

document.getElementById("closeModal")
  ?.addEventListener("click", () => {
    authModal?.classList.add("hidden");
  });

document.getElementById("switchAuth")
  ?.addEventListener("click", () => {
    authMode = authMode === "login"
      ? "register"
      : "login";

    updateAuthModal();

    if (authMessage) authMessage.textContent = "";
  });

authModal?.addEventListener("click", event => {
  if (event.target === authModal) {
    authModal.classList.add("hidden");
  }
});

/* Menu HP */
const navigation =
  document.querySelector(".navigation");

document.getElementById("menuButton")
  ?.addEventListener("click", () => {
    navigation?.classList.toggle("open");
  });

navigation?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
  });
});

/* Tahun footer */
const yearElement =
  document.getElementById("currentYear");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

/* Inisialisasi Supabase */
async function initializeDXStore() {
  if (
    !config?.supabaseUrl ||
    !config?.supabaseKey ||
    !window.supabase
  ) {
    if (productGrid) {
      productGrid.innerHTML =
        '<div class="loading-card">Konfigurasi Supabase belum tersedia.</div>';
    }

    if (accountGrid) {
      accountGrid.innerHTML =
        '<div class="loading-card">Konfigurasi Supabase belum tersedia.</div>';
    }

    return;
  }

  try {
    db = window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseKey
    );

    const { data, error } =
      await db.auth.getSession();

    if (error) throw error;

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

  } catch (error) {
    console.error("Inisialisasi DX STORE gagal:", error);

    if (productGrid) {
      productGrid.innerHTML =
        '<div class="loading-card">Koneksi belum berhasil. Muat ulang halaman beberapa saat lagi.</div>';
    }

    if (accountGrid) {
      accountGrid.innerHTML =
        '<div class="loading-card">Koneksi belum berhasil. Muat ulang halaman beberapa saat lagi.</div>';
    }
  }
}

initializeDXStore();
