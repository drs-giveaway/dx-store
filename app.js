
/* =========================================
   DX STORE - BAGIAN 1
   INISIALISASI SUPABASE DAN FUNGSI DASAR
========================================= */

const DX_CONFIG = window.DX_CONFIG || {};

if (!window.supabase || !DX_CONFIG.supabaseUrl || !DX_CONFIG.supabaseKey) {
  console.error("DX STORE: Konfigurasi Supabase belum tersedia.");
}

const dxSupabase = window.supabase
  ? window.supabase.createClient(
      DX_CONFIG.supabaseUrl,
      DX_CONFIG.supabaseKey
    )
  : null;

let currentUser = null;
let currentProfile = null;
let adminPanelPromise = null;

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

function formatPrice(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function showDXMessage(message) {
  alert(message);
}

function getDXError(error) {
  return error?.message || "Terjadi kesalahan. Silakan coba lagi.";
}

/* =========================================
   DX STORE - BAGIAN 2
   PRODUK DIGITAL DAN MARKETPLACE AKUN GAME
========================================= */

async function loadProducts() {
  if (!dxSupabase) return;

  const container = $("productList") || $("productsList");
  if (!container) return;

  container.innerHTML = "<p>Memuat produk...</p>";

  const { data, error } = await dxSupabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal memuat produk:", error);
    container.innerHTML = "<p>Produk belum dapat dimuat.</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>Belum ada produk digital.</p>";
    return;
  }

  container.innerHTML = data.map((product) => {
    const image = safeImageUrl(product.image_url);

    return `
      <article class="product-card">
        ${image ? `
          <img
            src="${safeText(image)}"
            alt="${safeText(product.name)}"
            loading="lazy"
          >
        ` : ""}

        <h3>${safeText(product.name)}</h3>
        <p>${safeText(product.description || "")}</p>
        <strong>${formatPrice(product.price)}</strong>

        <button
          type="button"
          onclick="selectItem('product', '${safeText(product.id)}')"
        >
          Lihat Produk
        </button>
      </article>
    `;
  }).join("");
}

async function loadAccountListings() {
  if (!dxSupabase) return;

  const container =
    $("accountList") ||
    $("accountsList") ||
    $("gameAccountList");

  if (!container) return;

  container.innerHTML = "<p>Memuat akun game...</p>";

  const { data, error } = await dxSupabase
    .from("account_listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal memuat akun:", error);
    container.innerHTML = "<p>Akun game belum dapat dimuat.</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>Belum ada akun game.</p>";
    return;
  }

  container.innerHTML = data.map((account) => {
    const image = safeImageUrl(account.image_url);

    return `
      <article class="product-card account-card">
        ${image ? `
          <img
            src="${safeText(image)}"
            alt="${safeText(account.title)}"
            loading="lazy"
          >
        ` : ""}

        <span>${safeText(account.game)}</span>
        <h3>${safeText(account.title)}</h3>
        <p>${safeText(account.description || "")}</p>
        <strong>${formatPrice(account.price)}</strong>

        <button
          type="button"
          onclick="selectItem('account', '${safeText(account.id)}')"
        >
          Lihat Akun
        </button>
      </article>
    `;
  }).join("");
}

async function selectItem(type, id) {
  if (!dxSupabase) return;

  const table = type === "product"
    ? "products"
    : "account_listings";

  const { data, error } = await dxSupabase
    .from(table)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    showDXMessage("Data tidak ditemukan.");
    return;
  }

  const name = type === "product"
    ? data.name
    : data.title;

  showDXMessage(
    name + "\nHarga: " + formatPrice(data.price)
  );
}

async function loadDXStore() {
  await Promise.all([
    loadProducts(),
    loadAccountListings()
  ]);
}

/* =========================================
   DX STORE - BAGIAN 3
   LOGIN, DAFTAR, DAN NAVIGASI
========================================= */

function openAuthModal() {
  const modal = $("authModal");

  if (modal) {
    modal.style.display = "flex";
  }
}

function closeAuthModal() {
  const modal = $("authModal");

  if (modal) {
    modal.style.display = "none";
  }
}

function switchAuthMode() {
  const title = $("authTitle");
  const submit = $("authSubmit");
  const switchButton = $("switchAuth");
  const nameField = $("registerName");

  if (!title || !submit) return;

  const isLogin = title.textContent.toLowerCase().includes("login");

  title.textContent = isLogin ? "Daftar Akun" : "Login";
  submit.textContent = isLogin ? "Daftar" : "Masuk";

  if (nameField) {
    nameField.style.display = isLogin ? "block" : "none";
  }

  if (switchButton) {
    switchButton.textContent = isLogin
      ? "Sudah punya akun? Login"
      : "Belum punya akun? Daftar";
  }
}

async function handleAuthSubmit(event) {
  if (event) event.preventDefault();

  if (!dxSupabase) return;

  const email = $("authEmail")?.value.trim();
  const password = $("authPassword")?.value;
  const name = $("registerName")?.value.trim();

  const title = $("authTitle")?.textContent.toLowerCase() || "";
  const isLogin = title.includes("login");

  if (!email || !password) {
    showDXMessage("Email dan password wajib diisi.");
    return;
  }

  let result;

  if (isLogin) {
    result = await dxSupabase.auth.signInWithPassword({
      email,
      password
    });
  } else {
    result = await dxSupabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name || ""
        }
      }
    });
  }

  if (result.error) {
    showDXMessage(getDXError(result.error));
    return;
  }

  if (isLogin) {
    showDXMessage("Login berhasil!");
    closeAuthModal();
  } else {
    showDXMessage(
      "Pendaftaran berhasil. Periksa email jika verifikasi diminta."
    );
  }
}

async function handleLogout() {
  if (!dxSupabase) return;

  const { error } = await dxSupabase.auth.signOut();

  if (error) {
    showDXMessage(getDXError(error));
    return;
  }

  currentUser = null;
  currentProfile = null;

  showDXMessage("Berhasil keluar dari akun.");
  updateDXAuthUI();
}

function updateDXAuthUI() {
  const loginButton = $("loginButton");
  const accountButton = $("accountButton");
  const logoutButton = $("logoutButton");

  if (loginButton) {
    loginButton.style.display = currentUser ? "none" : "";
  }

  if (accountButton) {
    accountButton.style.display = currentUser ? "" : "none";
  }

  if (logoutButton) {
    logoutButton.style.display = currentUser ? "" : "none";
  }
}

function initDXNavigation() {
  const menuButton = $("menuButton");
  const navigation = $("dxNavLinks");

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      navigation.classList.toggle("active");
    });
  }

  document.querySelectorAll("#dxNavLinks a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation?.classList.remove("active");
    });
  });

  $("loginButton")?.addEventListener("click", openAuthModal);
  $("authClose")?.addEventListener("click", closeAuthModal);
  $("switchAuth")?.addEventListener("click", switchAuthMode);
  $("authForm")?.addEventListener("submit", handleAuthSubmit);
  $("logoutButton")?.addEventListener("click", handleLogout);
}

async function loadDXProfile(user) {
  if (!dxSupabase || !user) return null;

  const { data, error } = await dxSupabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Gagal memuat profil:", error);
    return null;
  }

  return data;
}

/* =========================================
   DX STORE - BAGIAN 4
   PANEL ADMINISTRATOR
========================================= */

async function checkDXAdmin() {
  if (!dxSupabase || !currentUser) return false;

  const { data, error } = await dxSupabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error("Gagal memeriksa admin:", error);
    return false;
  }

  currentProfile = data;
  return data?.role === "admin";
}

async function initDXAdminPanel() {
  if (!currentUser || !dxSupabase) return;

  const isAdmin = await checkDXAdmin();

  if (!isAdmin) return;

  let panel = $("dxAdminPanel");

  if (!panel) {
    panel = document.createElement("section");
    panel.id = "dxAdminPanel";
    panel.className = "dx-admin-panel";

    const main = $("adminContainer") || document.querySelector("main");

    if (!main) {
      document.body.appendChild(panel);
    } else {
      main.appendChild(panel);
    }
  }

  panel.innerHTML = `
    <div class="dx-admin-header">
      <h2>Administrator DX STORE</h2>
      <p>Kelola produk digital dan akun game</p>
    </div>

    <div class="dx-admin-tabs">
      <button type="button" id="dxShowProducts">
        Produk Digital
      </button>

      <button type="button" id="dxShowAccounts">
        Akun Game
      </button>
    </div>

    <div class="dx-admin-form">
      <h3 id="dxAdminFormTitle">Tambah Produk Digital</h3>

      <form id="dxAdminForm">
        <input type="hidden" id="dxEditId">
        <input type="hidden" id="dxItemType" value="products">

        <label>Nama produk / judul akun</label>
        <input id="dxItemName" required>

        <label>Nama game (khusus akun game)</label>
        <input id="dxItemGame">

        <label>Deskripsi</label>
        <textarea id="dxItemDescription"></textarea>

        <label>Harga</label>
        <input id="dxItemPrice" type="number" min="0" required>

        <label>URL gambar</label>
        <input id="dxItemImage" type="url">

        <button type="submit" id="dxAdminSave">
          Simpan
        </button>

        <button type="button" id="dxAdminCancel">
          Batal
        </button>
      </form>

      <p id="dxAdminMessage"></p>
    </div>

    <div class="dx-admin-list">
      <h3>Daftar Data</h3>
      <div id="dxAdminItems">Memuat data...</div>
    </div>
  `;

  $("dxShowProducts").addEventListener("click", () => {
    setDXAdminType("products");
  });

  $("dxShowAccounts").addEventListener("click", () => {
    setDXAdminType("account_listings");
  });

  $("dxAdminForm").addEventListener("submit", saveDXAdminItem);
  $("dxAdminCancel").addEventListener("click", resetDXAdminForm);

  await loadDXAdminItems();
}

let dxAdminType = "products";

function setDXAdminType(type) {
  dxAdminType = type;

  $("dxItemType").value = type;
  $("dxAdminFormTitle").textContent =
    type === "products"
      ? "Tambah Produk Digital"
      : "Tambah Akun Game";

  $("dxItemGame").parentElement.style.display =
    type === "account_listings" ? "" : "none";

  resetDXAdminForm();
  loadDXAdminItems();
}

async function loadDXAdminItems() {
  if (!dxSupabase || !currentUser) return;

  const container = $("dxAdminItems");
  if (!container) return;

  container.textContent = "Memuat data...";

  const { data, error } = await dxSupabase
    .from(dxAdminType)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    container.textContent = getDXError(error);
    return;
  }

  if (!data || data.length === 0) {
    container.textContent = "Belum ada data.";
    return;
  }

  container.innerHTML = data.map((item) => {
    const name = dxAdminType === "products"
      ? item.name
      : item.title;

    return `
      <div class="dx-admin-item">
        <div>
          <strong>${safeText(name)}</strong>
          <p>${formatPrice(item.price)}</p>
          <small>Status: ${safeText(item.status)}</small>
        </div>

        <div class="dx-admin-actions">
          <button
            type="button"
            onclick="editDXAdminItem('${safeText(item.id)}')"
          >
            Edit
          </button>

          <button
            type="button"
            onclick="deleteDXAdminItem('${safeText(item.id)}')"
          >
            Hapus
          </button>
        </div>
      </div>
    `;
  }).join("");
}

/* =========================================
   DX STORE - BAGIAN 5
   SIMPAN, EDIT, HAPUS, DAN INISIALISASI
========================================= */

async function saveDXAdminItem(event) {
  event.preventDefault();

  if (!dxSupabase || !currentUser) return;

  const name = $("dxItemName").value.trim();
  const game = $("dxItemGame").value.trim();
  const description = $("dxItemDescription").value.trim();
  const price = Number($("dxItemPrice").value);
  const image = $("dxItemImage").value.trim();
  const editId = $("dxEditId").value;

  if (!name || !Number.isFinite(price) || price < 0) {
    $("dxAdminMessage").textContent =
      "Nama dan harga harus diisi dengan benar.";
    return;
  }

  const payload = {
    seller_id: currentUser.id,
    description,
    price,
    image_url: image || null,
    status: "active",
    updated_at: new Date().toISOString()
  };

  if (dxAdminType === "products") {
    payload.name = name;
  } else {
    if (!game) {
      $("dxAdminMessage").textContent =
        "Nama game wajib diisi.";
      return;
    }

    payload.game = game;
    payload.title = name;
  }

  let result;

  if (editId) {
    result = await dxSupabase
      .from(dxAdminType)
      .update(payload)
      .eq("id", editId);
  } else {
    result = await dxSupabase
      .from(dxAdminType)
      .insert(payload);
  }

  if (result.error) {
    $("dxAdminMessage").textContent =
      getDXError(result.error);
    return;
  }

  $("dxAdminMessage").textContent =
    "Berhasil disimpan!";

  resetDXAdminForm();
  await loadDXAdminItems();
  await loadDXStore();
}

async function editDXAdminItem(id) {
  if (!dxSupabase) return;

  const { data, error } = await dxSupabase
    .from(dxAdminType)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    showDXMessage("Data tidak ditemukan.");
    return;
  }

  $("dxEditId").value = data.id;
  $("dxItemName").value =
    dxAdminType === "products" ? data.name : data.title;

  $("dxItemGame").value = data.game || "";
  $("dxItemDescription").value = data.description || "";
  $("dxItemPrice").value = data.price;
  $("dxItemImage").value = data.image_url || "";

  $("dxAdminFormTitle").textContent = "Edit Data";

  $("dxAdminForm").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

async function deleteDXAdminItem(id) {
  if (!dxSupabase) return;

  const confirmed = confirm(
    "Apakah kamu yakin ingin menghapus data ini?"
  );

  if (!confirmed) return;

  const { error } = await dxSupabase
    .from(dxAdminType)
    .delete()
    .eq("id", id);

  if (error) {
    showDXMessage(getDXError(error));
    return;
  }

  showDXMessage("Data berhasil dihapus.");

  await loadDXAdminItems();
  await loadDXStore();
}

function resetDXAdminForm() {
  const form = $("dxAdminForm");

  if (form) form.reset();

  if ($("dxEditId")) {
    $("dxEditId").value = "";
  }

  if ($("dxItemType")) {
    $("dxItemType").value = dxAdminType;
  }

  if ($("dxAdminFormTitle")) {
    $("dxAdminFormTitle").textContent =
      dxAdminType === "products"
        ? "Tambah Produk Digital"
        : "Tambah Akun Game";
  }
}

async function refreshDXUser(user) {
  currentUser = user || null;
  currentProfile = null;

  updateDXAuthUI();

  if (!currentUser) {
    $("dxAdminPanel")?.remove();
    return;
  }

  const profile = await loadDXProfile(currentUser);
  currentProfile = profile;

  if (profile?.role === "admin") {
    await initDXAdminPanel();
  } else {
    $("dxAdminPanel")?.remove();
  }
}

async function initializeDXStore() {
  if (!dxSupabase) {
    console.error("Supabase belum siap.");
    return;
  }

  initDXNavigation();

  await loadDXStore();

  const { data, error } = await dxSupabase.auth.getSession();

  if (error) {
    console.error("Gagal memeriksa sesi:", error);
  }

  await refreshDXUser(data?.session?.user || null);

  dxSupabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => {
      refreshDXUser(session?.user || null);
      loadDXStore();
    }, 0);
  });
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeDXStore
  );
} else {
  initializeDXStore();
}
