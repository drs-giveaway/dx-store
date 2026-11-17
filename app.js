
/* =========================================
   DX STORE - BAGIAN 1 DARI 5
   INISIALISASI SUPABASE DAN FUNGSI DASAR
========================================= */

const DX_CONFIG = window.DX_CONFIG || {};

if (
  !window.supabase ||
  !DX_CONFIG.supabaseUrl ||
  !DX_CONFIG.supabaseKey
) {
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
let dxAuthMode = "login";
let dxAdminType = "products";

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
  const messageElement = $("authMessage");

  if (messageElement) {
    messageElement.textContent = message;
  } else {
    alert(message);
  }
}

function getDXError(error) {
  return error?.message || "Terjadi kesalahan. Silakan coba lagi.";
}

/* Membuka dan menutup modal */

function openAuth() {
  const modal = $("authModal");

  if (modal) {
    modal.classList.add("active");
    showDXMessage("");
  }
}

function closeAuth() {
  const modal = $("authModal");

  if (modal) {
    modal.classList.remove("active");
  }
}

/* =========================================
   DX STORE - BAGIAN 2 DARI 5
   PRODUK DIGITAL DAN MARKETPLACE AKUN GAME
========================================= */

async function loadProducts() {
  if (!dxSupabase) return;

  const container = $("productGrid");
  if (!container) return;

  container.innerHTML = "Memuat produk digital...";

  const { data, error } = await dxSupabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal memuat produk:", error);
    container.innerHTML = "Produk belum dapat dimuat.";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "Belum ada produk digital.";
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
          class="dx-button"
          onclick="selectItem('products', '${safeText(product.id)}')"
        >
          Lihat Produk
        </button>
      </article>
    `;
  }).join("");
}

async function loadAccountListings() {
  if (!dxSupabase) return;

  const container = $("accountGrid");
  if (!container) return;

  container.innerHTML = "Memuat akun game...";

  const { data, error } = await dxSupabase
    .from("account_listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal memuat akun:", error);
    container.innerHTML = "Akun game belum dapat dimuat.";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "Belum ada akun game.";
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
          class="dx-button"
          onclick="selectItem('account_listings', '${safeText(account.id)}')"
        >
          Lihat Akun
        </button>
      </article>
    `;
  }).join("");
}

async function selectItem(table, id) {
  if (!dxSupabase) return;

  if (!["products", "account_listings"].includes(table)) {
    return;
  }

  const { data, error } = await dxSupabase
    .from(table)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    showDXMessage("Data tidak ditemukan.");
    return;
  }

  const name = table === "products"
    ? data.name
    : data.title;

  alert(
    name +
    "\nHarga: " +
    formatPrice(data.price)
  );
}

async function loadDXStore() {
  await Promise.all([
    loadProducts(),
    loadAccountListings()
  ]);
}

/* =========================================
   DX STORE - BAGIAN 3 DARI 5
   LOGIN, DAFTAR, DAN PROFIL ADMIN
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

  currentProfile = data || null;
  return currentProfile;
}

async function checkDXAdmin() {
  if (!currentUser) {
    currentProfile = null;
    return false;
  }

  const profile = await loadDXProfile(currentUser);
  return profile?.role === "admin";
}

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
    nameInput.style.width = "100%";
    nameInput.style.marginBottom = "12px";
    nameInput.style.padding = "12px";
    nameInput.style.borderRadius = "8px";
    nameInput.style.border = "1px solid #334155";
    nameInput.style.background = "#0f172a";
    nameInput.style.color = "#ffffff";

    const emailInput = $("authEmail");

    if (emailInput) {
      form.insertBefore(nameInput, emailInput);
    }
  }

  if (dxAuthMode === "login" && nameInput) {
    nameInput.remove();
  }

  const submitButton = form.querySelector(
    'button[type="submit"], input[type="submit"]'
  );

  if (submitButton) {
    if (submitButton.tagName === "INPUT") {
      submitButton.value = dxAuthMode === "login"
        ? "Masuk"
        : "Daftar";
    } else {
      submitButton.textContent = dxAuthMode === "login"
        ? "Masuk"
        : "Daftar";
    }
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

  const switchButton = document.createElement("button");
  switchButton.id = "dxAuthSwitch";
  switchButton.type = "button";
  switchButton.textContent = "Belum punya akun? Daftar";
  switchButton.style.display = "block";
  switchButton.style.width = "100%";
  switchButton.style.marginTop = "14px";
  switchButton.style.padding = "10px";
  switchButton.style.border = "0";
  switchButton.style.background = "transparent";
  switchButton.style.color = "#38bdf8";
  switchButton.style.cursor = "pointer";

  switchButton.addEventListener("click", switchAuthMode);
  form.appendChild(switchButton);
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  if (!dxSupabase) {
    showDXMessage("Konfigurasi Supabase belum tersedia.");
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

  const submitButton = $("authForm")?.querySelector(
    'button[type="submit"]'
  );

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Memproses...";
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

    if (currentProfile?.role === "admin") {
      createDXAdminPanel();

      const panel = $("dxAdminPanel");

      if (panel) {
        panel.style.display = "block";
        await loadDXAdminList();
        panel.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }

    closeAuth();
    await loadDXStore();

  } catch (error) {
    console.error("Kesalahan autentikasi:", error);
    showDXMessage(getDXError(error));
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent =
        dxAuthMode === "login" ? "Masuk" : "Daftar";
    }
  }
}

async function refreshDXUser() {
  if (!dxSupabase) return;

  const { data, error } = await dxSupabase.auth.getUser();

  if (error) {
    console.error("Gagal mengambil pengguna:", error);
    return;
  }

  currentUser = data.user || null;

  if (currentUser) {
    await loadDXProfile(currentUser);
  } else {
    currentProfile = null;
  }

  const panel = $("dxAdminPanel");

  if (panel) {
    panel.style.display =
      currentProfile?.role === "admin" ? "block" : "none";
  }
}

async function handleDXLogout() {
  if (!dxSupabase) return;

  const { error } = await dxSupabase.auth.signOut();

  if (error) {
    showDXMessage(getDXError(error));
    return;
  }

  currentUser = null;
  currentProfile = null;

  const panel = $("dxAdminPanel");

  if (panel) {
    panel.remove();
  }

  await loadDXStore();
  alert("Berhasil keluar dari akun.");
}

function initDXNavigation() {
  const navigation = $("dxNavLinks");
  if (!navigation) return;

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
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
  `;

  main.prepend(panel);

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

  $("dxCancelEdit").addEventListener("click", resetDXAdminForm);

  $("dxAdminForm").addEventListener("submit", saveDXAdminItem);

  updateDXAdminFormLabels();
}

function updateDXAdminFormLabels() {
  const isAccount = dxAdminType === "account_listings";

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

    const status = item.status || "pending";

    return `
      <article>
        <h4>${safeText(title)}</h4>

        ${dxAdminType === "account_listings"
          ? `<p>Game: ${safeText(item.game)}</p>`
          : ""}

        <p>Harga: ${formatPrice(item.price)}</p>
        <p>Status: ${safeText(status)}</p>

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
      </article>
    `;
  }).join("");
}

/* =========================================
   DX STORE - BAGIAN 5 DARI 5
   SIMPAN, EDIT, HAPUS, DAN INISIALISASI
========================================= */

async function saveDXAdminItem(event) {
  event.preventDefault();

  if (!dxSupabase || !currentUser) {
    $("dxAdminMessage").textContent =
      "Silakan login sebagai administrator.";
    return;
  }

  if (currentProfile?.role !== "admin") {
    $("dxAdminMessage").textContent =
      "Akses ditolak. Khusus administrator.";
    return;
  }

  const isAccount = dxAdminType === "account_listings";
  const editId = $("dxEditId").value;

  const name = $("dxName").value.trim();
  const description = $("dxDescription").value.trim();
  const price = Number($("dxPrice").value);
  const imageUrl = $("dxImage").value.trim();

  if (!name || !Number.isFinite(price) || price < 0) {
    $("dxAdminMessage").textContent =
      "Nama dan harga harus diisi dengan benar.";
    return;
  }

  if (isAccount && !$("dxGame").value.trim()) {
    $("dxAdminMessage").textContent =
      "Nama game wajib diisi.";
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
      payload.seller_id = currentUser.id;
      payload.status = "pending";

      result = await dxSupabase
        .from(dxAdminType)
        .insert(payload);
    }

    if (result.error) throw result.error;

    $("dxAdminMessage").textContent = editId
      ? "Data berhasil diperbarui!"
      : "Data berhasil disimpan!";

    resetDXAdminForm();

    await loadDXAdminList();
    await loadDXStore();

  } catch (error) {
    console.error("Gagal menyimpan data:", error);

    $("dxAdminMessage").textContent =
      "Gagal menyimpan: " + getDXError(error);
  } finally {
    saveButton.disabled = false;
    updateDXAdminFormLabels();
  }
}

async function editDXAdminItem(id) {
  if (!dxSupabase || currentProfile?.role !== "admin") {
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
  $("dxPrice").value = data.price;
  $("dxImage").value = data.image_url || "";

  if (dxAdminType === "account_listings") {
    $("dxGame").value = data.game || "";
  }

  $("dxCancelEdit").style.display = "inline-block";

  updateDXAdminFormLabels();

  $("dxAdminMessage").textContent =
    "Mode edit aktif. Silakan ubah data.";

  $("dxAdminPanel").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

async function deleteDXAdminItem(id) {
  if (!dxSupabase || currentProfile?.role !== "admin") {
    alert("Akses ditolak.");
    return;
  }

  const confirmed = confirm(
    "Apakah kamu yakin ingin menghapus data ini?"
  );

  if (!confirmed) return;

  const { error } = await dxSupabase
    .from(dxAdminType)
    .delete()
    .eq("id", id);

  if (error) {
    alert("Gagal menghapus: " + getDXError(error));
    return;
  }

  $("dxAdminMessage").textContent =
    "Data berhasil dihapus.";

  resetDXAdminForm();

  await loadDXAdminList();
  await loadDXStore();
}

/* =========================================
   INISIALISASI DX STORE
========================================= */

async function initializeDXStore() {
  if (!dxSupabase) {
    console.error("Supabase tidak tersedia.");
    return;
  }

  setupDXAuthSwitch();
  initDXNavigation();

  const authForm = $("authForm");

  if (authForm) {
    authForm.addEventListener("submit", handleAuthSubmit);
  }

  createDXAdminPanel();

  await refreshDXUser();
  await loadDXStore();

  if (currentProfile?.role === "admin") {
    const panel = $("dxAdminPanel");

    if (panel) {
      panel.style.display = "block";
      await loadDXAdminList();
    }
  }

  dxSupabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;

    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
      setTimeout(async () => {
        await refreshDXUser();

        if (currentProfile?.role === "admin") {
          createDXAdminPanel();

          const panel = $("dxAdminPanel");

          if (panel) {
            panel.style.display = "block";
            await loadDXAdminList();

            panel.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        }

        await loadDXStore();
      }, 0);
    }

    if (event === "SIGNED_OUT") {
      currentUser = null;
      currentProfile = null;

      const panel = $("dxAdminPanel");

      if (panel) {
        panel.style.display = "none";
      }

      loadDXStore();
    }
  });
}

/* =========================================
   JALANKAN APLIKASI
========================================= */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeDXStore
  );
} else {
  initializeDXStore();
}
