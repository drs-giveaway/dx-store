
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
const authMessage = document.getElementById("authMessage");

const authTitle =
  document.getElementById("authTitle") ||
  authModal?.querySelector("h2");

const authSubmit =
  document.getElementById("authSubmit") ||
  authForm?.querySelector('button[type="submit"]');

/* TEKS AMAN */
function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

/* URL GAMBAR AMAN */
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

/* FORMAT RUPIAH */
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

/* KARTU PRODUK */
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

/* MEMUAT PRODUK DIGITAL */
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
      '<div class="loading-card">Produk belum dapat dimuat. Silakan coba lagi.</div>';
  }
}

/* MEMUAT AKUN GAME */
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
      '<div class="loading-card">Akun game belum dapat dimuat. Silakan coba lagi.</div>';
  }
}

/* MODAL LOGIN DAN DAFTAR */
function openAuth(mode = "login") {
  if (!authModal) return;

  authMode = mode;
  updateAuthModal();

  authModal.classList.add("active");
  authModal.classList.remove("hidden");

  if (authMessage) authMessage.textContent = "";
}

function closeAuth() {
  if (!authModal) return;

  authModal.classList.remove("active");
  authModal.classList.add("hidden");
}

window.openAuth = openAuth;
window.closeAuth = closeAuth;

/* TOMBOL GANTI MODE LOGIN */
function createAuthSwitch() {
  if (!authForm || document.getElementById("authSwitch")) return;

  const container = document.createElement("p");
  container.id = "authSwitch";
  container.style.textAlign = "center";
  container.style.marginTop = "16px";

  const text = document.createElement("span");
  const button = document.createElement("button");

  button.id = "switchAuth";
  button.type = "button";
  button.style.background = "none";
  button.style.border = "none";
  button.style.color = "#60a5fa";
  button.style.cursor = "pointer";
  button.style.fontWeight = "bold";

  button.addEventListener("click", () => {
    authMode = authMode === "login" ? "register" : "login";
    updateAuthModal();

    if (authMessage) authMessage.textContent = "";
  });

  container.append(text, button);
  authForm.insertAdjacentElement("afterend", container);
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

  const switchContainer =
    document.getElementById("authSwitch");

  const switchButton =
    document.getElementById("switchAuth");

  if (switchContainer && switchButton) {
    switchContainer.firstChild.textContent = isLogin
      ? "Belum punya akun? "
      : "Sudah punya akun? ";

    switchButton.textContent = isLogin
      ? "Daftar"
      : "Masuk";
  }
}

/* PROSES LOGIN DAN PENDAFTARAN */
createAuthSwitch();

if (authForm) {
  authForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!db) {
      if (authMessage) {
        authMessage.textContent =
          "Koneksi Supabase belum tersedia.";
      }
      return;
    }

    const email =
      document.getElementById("authEmail")?.value.trim();

    const password =
      document.getElementById("authPassword")?.value;

    if (!email || !password) {
      if (authMessage) {
        authMessage.textContent =
          "Masukkan email dan kata sandi.";
      }
      return;
    }

    if (authSubmit) {
      authSubmit.disabled = true;
      authSubmit.textContent = "Memproses...";
    }

    if (authMessage) authMessage.textContent = "";

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
        if (authMessage) {
          authMessage.textContent =
            "Pendaftaran berhasil. Periksa email jika verifikasi diminta.";
        }
        return;
      }

      currentUser = result.data.user || null;

      closeAuth();
      updateAccountButton();

    } catch (error) {
      console.error("Autentikasi gagal:", error);

      if (authMessage) {
        authMessage.textContent =
          error.message || "Terjadi kesalahan. Silakan coba lagi.";
      }

    } finally {
      if (authSubmit) {
        authSubmit.disabled = false;
        authSubmit.textContent =
          authMode === "login" ? "Masuk" : "Daftar";
      }
    }
  });
}

/* STATUS AKUN */
function updateAccountButton() {
  const loginButton =
    document.getElementById("loginButton") ||
    document.querySelector(".dx-nav-actions .dx-button");

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

/* PILIH PRODUK */
function selectItem(type, id) {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  alert(
    "Produk berhasil dipilih.\n\n" +
    "Checkout dan pembayaran DX STORE " +
    "masih dalam tahap pengembangan."
  );

  console.info("Item dipilih:", {
    type,
    id,
    userId: currentUser.id
  });
}

/* KLIK KARTU PRODUK */
document.addEventListener("click", event => {
  const button = event.target.closest(".item-action");

  if (!button) return;

  selectItem(
    button.dataset.itemType,
    button.dataset.itemId
  );
});

/* TOMBOL DAFTAR */
document.getElementById("registerButton")
  ?.addEventListener("click", () => openAuth("register"));

document.getElementById("ctaRegister")
  ?.addEventListener("click", () => openAuth("register"));

/* TUTUP MODAL */
document.getElementById("closeModal")
  ?.addEventListener("click", closeAuth);

authModal?.addEventListener("click", event => {
  if (event.target === authModal) closeAuth();
});

/* NAVIGASI */
const navigation =
  document.querySelector(".dx-nav-links") ||
  document.querySelector(".navigation");

const navContainer =
  document.querySelector(".dx-nav");

if (navigation && navContainer) {
  let menuButton = document.getElementById("menuButton");

  if (!menuButton) {
    menuButton = document.createElement("button");
    menuButton.id = "menuButton";
    menuButton.type = "button";
    menuButton.textContent = "☰";
    menuButton.setAttribute("aria-label", "Buka menu");

    menuButton.style.background = "transparent";
    menuButton.style.color = "white";
    menuButton.style.border = "1px solid #334155";
    menuButton.style.borderRadius = "8px";
    menuButton.style.padding = "8px 12px";
    menuButton.style.cursor = "pointer";

    navContainer.appendChild(menuButton);
  }

  menuButton.addEventListener("click", () => {
    navigation.classList.toggle("open");
  });

  navigation.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
    });
  });
}

/* TAHUN FOOTER */
const yearElement =
  document.getElementById("currentYear");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

/* INISIALISASI SUPABASE */
async function initializeDXStore() {
  if (
    !config?.supabaseUrl ||
    !config?.supabaseKey ||
    !window.supabase
  ) {
    const message =
      '<div class="loading-card">Konfigurasi Supabase atau library Supabase belum tersedia.</div>';

    if (productGrid) productGrid.innerHTML = message;
    if (accountGrid) accountGrid.innerHTML = message;

    console.error("Supabase belum siap.");
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

    const message =
      '<div class="loading-card">Koneksi belum berhasil. Muat ulang halaman beberapa saat lagi.</div>';

    if (productGrid) productGrid.innerHTML = message;
    if (accountGrid) accountGrid.innerHTML = message;
  }
}

initializeDXStore();
