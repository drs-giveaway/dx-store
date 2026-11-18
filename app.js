
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

function formatPrice(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
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

/* STATUS TOMBOL HEADER */

function updateDXHeaderAuth() {
  const button = document.querySelector(
    ".dx-nav-actions .dx-button"
  );

  if (!button) return;

  button.textContent = currentUser
    ? (
        currentProfile?.role === "admin"
          ? "Admin / Keluar"
          : "Keluar"
      )
    : "Masuk / Daftar";

  button.onclick = () => {
    if (currentUser) {
      handleDXLogout();
    } else {
      openAuth();
    }
  };
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
          <button
            class="dx-button"
            type="button"
            onclick="selectItem('product','${safeText(item.id)}')"
          >
            Lihat Produk
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
          <button
            class="dx-button"
            type="button"
            onclick="selectItem('account','${safeText(item.id)}')"
          >
            Lihat Akun
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
      modal.querySelector("#dxDetailOrder").onclick = () => {
        modal.classList.remove("active");
        if (!currentUser) {
          openAuth();
          showDXMessage("Masuk atau daftar untuk melanjutkan pemesanan.");
        } else {
          alert("Untuk menyelesaikan pesanan, silakan hubungi admin DX STORE.");
        }
      };
      modal.classList.add("active");
    });
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
  await loadDXStore();
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
  `;

  main.prepend(panel);

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
        <p>Status: ${safeText(item.status || "pending")}</p>

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
  const price = Number($("dxPrice").value);
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
      payload.seller_id = currentUser.id;
      payload.status = "pending";

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
  $("dxPrice").value = data.price;
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
  } else {
    const panel = $("dxAdminPanel");
    if (panel) panel.style.display = "none";
  }
}

/* KELUAR */

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
  await loadDXStore();

  alert("Berhasil keluar dari akun.");
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
