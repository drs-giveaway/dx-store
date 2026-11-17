
/* =====================================
   DX STORE - APP.JS
   Versi kompatibel dengan index.html
   ===================================== */

const config = window.DX_CONFIG;

let db = null;
let currentUser = null;
let authMode = "login";

/* =====================================
   ELEMENTS
===================================== */

const productGrid = document.getElementById("productGrid");
const accountGrid = document.getElementById("accountGrid");
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");

const authTitle = authModal?.querySelector("h2");
const authSubmit = authForm?.querySelector('button[type="submit"]');

const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

/* =====================================
   HELPER
===================================== */

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
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
    const url = new URL(String(value));

    return ["https:", "http:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

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

/* =====================================
   PRODUCT CARD
===================================== */

function createCard(item, type) {
  const title = type === "product"
    ? item.name
    : item.title;

  const imageUrl = safeImageUrl(item.image_url);

  const label = type === "product"
    ? "PRODUK DIGITAL"
    : (item.game || "AKUN GAME");

  const cardClass = type === "product"
    ? "product-card"
    : "account-card";

  const image = imageUrl
    ? `
      <img
        class="listing-image"
        src="${safeText(imageUrl)}"
        alt="${safeText(title || "Gambar produk")}"
        loading="lazy">
    `
    : `
      <div class="listing-image listing-image-placeholder">
        <span>DX STORE</span>
      </div>
    `;

  return `
    <article class="${cardClass}">
      ${image}

      <div class="product-card-content">
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
      </div>
    </article>
  `;
}

/* =====================================
   LOAD PRODUCTS
===================================== */

async function loadProducts() {
  if (!productGrid || !db) return;

  productGrid.innerHTML =
    '<div class="dx-empty-card">Memuat produk digital...</div>';

  try {
    const { data, error } = await db
      .from("products")
      .select("id, name, description, price, image_url")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data?.length) {
      productGrid.innerHTML =
        '<div class="dx-empty-card">Belum ada produk digital yang tersedia.</div>';
      return;
    }

    productGrid.innerHTML = data
      .map(item => createCard(item, "product"))
      .join("");

  } catch (error) {
    console.error("Gagal memuat produk:", error);

    productGrid.innerHTML =
      '<div class="dx-empty-card">Produk belum dapat dimuat. Silakan coba lagi.</div>';
  }
}

/* =====================================
   LOAD GAME ACCOUNTS
===================================== */

async function loadAccounts() {
  if (!accountGrid || !db) return;

  accountGrid.innerHTML =
    '<div class="dx-empty-card">Memuat akun game...</div>';

  try {
    const { data, error } = await db
      .from("account_listings")
      .select("id, game, title, description, price, image_url")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data?.length) {
      accountGrid.innerHTML =
        '<div class="dx-empty-card">Belum ada akun game yang tersedia.</div>';
      return;
    }

    accountGrid.innerHTML = data
      .map(item => createCard(item, "account"))
      .join("");

  } catch (error) {
    console.error("Gagal memuat akun:", error);

    accountGrid.innerHTML =
      '<div class="dx-empty-card">Akun game belum dapat dimuat. Silakan coba lagi.</div>';
  }
}

/* =====================================
   AUTH MODAL
===================================== */

function openAuth(mode = "login") {
  if (!authModal) return;

  authMode = mode;
  updateAuthModal();

  authModal.classList.add("active");

  if (authMessage) {
    authMessage.textContent = "";
  }
}

function closeAuth() {
  if (!authModal) return;

  authModal.classList.remove("active");
}

window.openAuth = openAuth;
window.closeAuth = closeAuth;

/* =====================================
   SWITCH LOGIN / REGISTER
===================================== */

function createAuthSwitch() {
  if (!authForm || document.getElementById("authSwitch")) {
    return;
  }

  const container = document.createElement("p");
  container.id = "authSwitch";
  container.style.textAlign = "center";
  container.style.marginTop = "18px";
  container.style.fontSize = "13px";
  container.style.color = "#aab8d0";

  const text = document.createElement("span");

  const button = document.createElement("button");
  button.id = "switchAuth";
  button.type = "button";
  button.style.background = "none";
  button.style.border = "none";
  button.style.color = "#51e5ff";
  button.style.cursor = "pointer";
  button.style.fontWeight = "bold";
  button.style.marginLeft = "5px";

  button.addEventListener("click", () => {
    authMode = authMode === "login"
      ? "register"
      : "login";

    updateAuthModal();

    if (authMessage) {
      authMessage.textContent = "";
    }
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

  if (authPassword) {
    authPassword.autocomplete = isLogin
      ? "current-password"
      : "new-password";
  }

  const switchText = document.querySelector(
    "#authSwitch span"
  );

  const switchButton = document.getElementById("switchAuth");

  if (switchText && switchButton) {
    switchText.textContent = isLogin
      ? "Belum punya akun?"
      : "Sudah punya akun?";

    switchButton.textContent = isLogin
      ? "Daftar"
      : "Masuk";
  }
}

createAuthSwitch();

/* =====================================
   LOGIN & REGISTER PROCESS
===================================== */

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

    const email = authEmail?.value.trim();
    const password = authPassword?.value;

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

    if (authMessage) {
      authMessage.textContent = "";
    }

    try {
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

      if (result.error) {
        throw result.error;
      }

      if (authMode === "register" && !result.data.session) {
        if (authMessage) {
          authMessage.textContent =
            "Pendaftaran berhasil. Silakan periksa email untuk verifikasi jika diminta.";
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

/* =====================================
   NAVBAR LOGIN & REGISTER BUTTONS
===================================== */

function setupAuthButtons() {
  const buttons = document.querySelectorAll(
    ".dx-nav-actions .dx-button"
  );

  if (buttons[0]) {
    buttons[0].onclick = () => openAuth("login");
  }

  if (buttons[1]) {
    buttons[1].onclick = () => openAuth("register");
  }
}

setupAuthButtons();

/* =====================================
   ACCOUNT BUTTON
===================================== */

function updateAccountButton() {
  const buttons = document.querySelectorAll(
    ".dx-nav-actions .dx-button"
  );

  const loginButton = buttons[0];

  if (!loginButton) return;

  loginButton.textContent = currentUser
    ? "Keluar"
    : "Masuk";

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
      alert("Belum berhasil keluar. Silakan coba lagi.");
    }
  };

  if (buttons[1]) {
    buttons[1].onclick = () => openAuth("register");
  }
}

/* =====================================
   SELECT PRODUCT
===================================== */

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

  console.info("Produk dipilih:", {
    type,
    id,
    userId: currentUser.id
  });
}

document.addEventListener("click", event => {
  const button = event.target.closest(".item-action");

  if (!button) return;

  selectItem(
    button.dataset.itemType,
    button.dataset.itemId
  );
});

/* =====================================
   CLOSE MODAL
===================================== */

authModal?.addEventListener("click", event => {
  if (event.target === authModal) {
    closeAuth();
  }
});

/* =====================================
   MOBILE NAVIGATION
===================================== */

function setupNavigation() {
  const navigation = document.getElementById("dxNavLinks");
  const menuButton = document.getElementById("menuButton");

  if (!navigation || !menuButton) return;

  menuButton.onclick = function () {
    const isOpen = navigation.classList.toggle("open");

    menuButton.textContent = isOpen ? "✕" : "☰";
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Tutup menu" : "Buka menu"
    );
  };

  navigation.querySelectorAll("a").forEach(function (link) {
    link.onclick = function () {
      navigation.classList.remove("open");
      menuButton.textContent = "☰";
      menuButton.setAttribute("aria-expanded", "false");
    };
  });
}

setupNavigation();

/* =====================================
   FOOTER YEAR
===================================== */

const yearElement = document.getElementById("currentYear");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

/* =====================================
   INITIALIZE SUPABASE
===================================== */

async function initializeDXStore() {
  if (
    !config?.supabaseUrl ||
    !config?.supabaseKey ||
    !window.supabase
  ) {
    const message =
      '<div class="dx-empty-card">Konfigurasi Supabase belum tersedia.</div>';

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

    const { data, error } = await db.auth.getSession();

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

    console.info("DX STORE berhasil diinisialisasi.");

  } catch (error) {
    console.error("Inisialisasi DX STORE gagal:", error);

    const message =
      '<div class="dx-empty-card">Koneksi belum berhasil. Silakan muat ulang halaman.</div>';

    if (productGrid) productGrid.innerHTML = message;
    if (accountGrid) accountGrid.innerHTML = message;
  }
}

initializeDXStore();

/* =====================================
   DX STORE - PANEL ADMINISTRATOR
===================================== */

async function initDXAdminPanel() {
  if (!db) return;

  const { data: sessionData } = await db.auth.getSession();
  const user = sessionData.session?.user;

  if (!user) return;

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") return;

  if (document.getElementById("dxAdminPanel")) return;

  const panel = document.createElement("section");
  panel.id = "dxAdminPanel";
  panel.style.cssText = `
    margin:40px auto;
    padding:24px;
    max-width:1100px;
    background:#101b35;
    border:1px solid #287dff;
    border-radius:18px;
    color:white;
  `;

  panel.innerHTML = `
    <h2 style="color:#51e5ff">DX STORE ADMIN</h2>
    <p>Panel Administrator</p>

    <form id="dxAdminForm">
      <input type="hidden" id="dxEditId">

      <label>Jenis Produk</label>
      <select id="dxType" required>
        <option value="products">Produk Digital</option>
        <option value="account_listings">Akun Game</option>
      </select>

      <label>Nama Produk / Judul Akun</label>
      <input id="dxName" required placeholder="Nama produk atau judul akun">

      <div id="dxGameWrap" style="display:none">
        <label>Nama Game</label>
        <input id="dxGame" placeholder="Nama game">
      </div>

      <label>Deskripsi</label>
      <textarea id="dxDescription" rows="4"
        placeholder="Deskripsi produk"></textarea>

      <label>Harga (Rupiah)</label>
      <input id="dxPrice" type="number" min="0" required>

      <label>URL Gambar</label>
      <input id="dxImage" type="url"
        placeholder="https://...">

      <label>Status</label>
      <select id="dxStatus">
        <option value="active">Aktif / Tampilkan</option>
        <option value="pending">Menunggu</option>
      </select>

      <button type="submit" id="dxSave">
        Simpan Produk
      </button>
      <button type="button" id="dxCancel">
        Batal Edit
      </button>
      <p id="dxAdminMessage"></p>
    </form>

    <hr style="margin:25px 0;border-color:#33476d">

    <h3>Daftar Produk Digital</h3>
    <div id="dxAdminProducts">Memuat...</div>

    <h3 style="margin-top:30px">Daftar Akun Game</h3>
    <div id="dxAdminAccounts">Memuat...</div>
  `;

  const main = document.querySelector("main") || document.body;
  main.appendChild(panel);

  const style = document.createElement("style");
  style.textContent = `
    #dxAdminPanel label {
      display:block;
      margin-top:14px;
      color:#a9c8ff;
    }
    #dxAdminPanel input,
    #dxAdminPanel textarea,
    #dxAdminPanel select {
      display:block;
      box-sizing:border-box;
      width:100%;
      padding:12px;
      margin-top:6px;
      border:1px solid #34517e;
      border-radius:8px;
      background:#091329;
      color:white;
    }
    #dxAdminPanel button {
      margin:14px 8px 0 0;
      padding:11px 16px;
      border:0;
      border-radius:8px;
      background:#087cff;
      color:white;
      cursor:pointer;
    }
    #dxAdminPanel .dx-admin-item {
      padding:14px;
      margin:10px 0;
      border:1px solid #34517e;
      border-radius:10px;
      overflow-wrap:anywhere;
    }
    #dxAdminPanel .dx-delete {
      background:#b52d48;
    }
  `;
  document.head.appendChild(style);

  const $ = id => document.getElementById(id);

  $("dxType").addEventListener("change", () => {
    $("dxGameWrap").style.display =
      $("dxType").value === "account_listings" ? "block" : "none";
  });

  async function loadAdminItems() {
    for (const table of ["products", "account_listings"]) {
      const target = table === "products"
        ? $("dxAdminProducts")
        : $("dxAdminAccounts");

      target.textContent = "Memuat...";

      const { data, error } = await db
        .from(table)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        target.textContent = "Gagal memuat: " + error.message;
        continue;
      }

      if (!data?.length) {
        target.textContent = "Belum ada data.";
        continue;
      }

      target.innerHTML = data.map(item => {
        const name = table === "products"
          ? item.name
          : item.title;

        return `
          <div class="dx-admin-item">
            <strong>${safeText(name)}</strong>
            <p>Harga: ${formatPrice(item.price)}</p>
            <p>Status: ${safeText(item.status)}</p>
            <button type="button"
              data-edit="${safeText(item.id)}"
              data-table="${table}">Edit</button>
            <button type="button" class="dx-delete"
              data-delete="${safeText(item.id)}"
              data-table="${table}">Hapus</button>
          </div>
        `;
      }).join("");
    }
  }

  $("dxAdminForm").addEventListener("submit", async event => {
    event.preventDefault();

    const table = $("dxType").value;
    const id = $("dxEditId").value;

    const name = $("dxName").value.trim();
    const price = Number($("dxPrice").value);

    if (!name || !Number.isFinite(price) || price < 0) {
      $("dxAdminMessage").textContent = "Periksa nama dan harga.";
      return;
    }

    const payload = {
      description: $("dxDescription").value.trim(),
      price,
      image_url: $("dxImage").value.trim() || null,
      status: $("dxStatus").value,
      updated_at: new Date().toISOString()
    };

    if (table === "products") {
      payload.name = name;
    } else {
      payload.title = name;
      payload.game = $("dxGame").value.trim();
      if (!payload.game) {
        $("dxAdminMessage").textContent = "Isi nama game.";
        return;
      }
    }

    $("dxSave").disabled = true;
    $("dxAdminMessage").textContent = "Menyimpan...";

    try {
      let result;

      if (id) {
        result = await db
          .from(table)
          .update(payload)
          .eq("id", id);
      } else {
        payload.seller_id = user.id;
        result = await db
          .from(table)
          .insert(payload);
      }

      if (result.error) throw result.error;

      $("dxAdminMessage").textContent = "Berhasil disimpan!";
      $("dxAdminForm").reset();
      $("dxEditId").value = "";
      $("dxGameWrap").style.display = "none";

      await loadAdminItems();
      await Promise.all([loadProducts(), loadAccounts()]);

    } catch (error) {
      $("dxAdminMessage").textContent =
        "Gagal: " + error.message;
    } finally {
      $("dxSave").disabled = false;
    }
  });

  panel.addEventListener("click", async event => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    if (editButton) {
      const table = editButton.dataset.table;
      const id = editButton.dataset.edit;

      const { data, error } = await db
        .from(table)
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("Data tidak dapat dibuka.");
        return;
      }

      $("dxType").value = table;
      $("dxType").dispatchEvent(new Event("change"));
      $("dxEditId").value = data.id;
      $("dxName").value = table === "products"
        ? data.name
        : data.title;
      $("dxGame").value = data.game || "";
      $("dxDescription").value = data.description || "";
      $("dxPrice").value = data.price;
      $("dxImage").value = data.image_url || "";
      $("dxStatus").value = data.status;

      $("dxAdminForm").scrollIntoView({ behavior: "smooth" });
      $("dxSave").textContent = "Simpan Perubahan";
    }

    if (deleteButton) {
      if (!confirm("Yakin ingin menghapus produk ini?")) return;

      const { error } = await db
        .from(deleteButton.dataset.table)
        .delete()
        .eq("id", deleteButton.dataset.delete);

      if (error) {
        alert("Gagal menghapus: " + error.message);
        return;
      }

      alert("Produk berhasil dihapus.");
      await loadAdminItems();
      await Promise.all([loadProducts(), loadAccounts()]);
    }
  });

  $("dxCancel").addEventListener("click", () => {
    $("dxAdminForm").reset();
    $("dxEditId").value = "";
    $("dxGameWrap").style.display = "none";
    $("dxSave").textContent = "Simpan Produk";
    $("dxAdminMessage").textContent = "";
  });

  await loadAdminItems();
}

const dxAdminWait = setInterval(() => {
  if (db) {
    clearInterval(dxAdminWait);
    initDXAdminPanel();
  }
}, 300);

