/* DX STORE image upload + seller listing */
(() => {
  const MAX = 5 * 1024 * 1024;
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  const bucket = "marketplace-images";
  const $ = id => document.getElementById(id);

  async function uploadImage(file, ownerId, folder) {
    if (!file || !allowed.includes(file.type) || file.size > MAX) {
      throw new Error("Pilih JPG, PNG, atau WEBP maksimal 5 MB.");
    }
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const path = ownerId + "/" + folder + "/" + crypto.randomUUID() + "." + ext;
    const { data, error } = await dxSupabase.storage.from(bucket).upload(path, file, {
      contentType: file.type, upsert: false
    });
    if (error) throw error;
    return dxSupabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
  }

  function installAdminUpload() {
    const form = $("dxAdminForm");
    if (!form || form.dataset.imageUploadReady) return;
    const urlInput = $("dxImage");
    if (!urlInput) return;
    urlInput.type = "hidden";
    const wrap = document.createElement("div");
    wrap.style.margin = "12px 0";
    wrap.innerHTML = '<label for="dxImageFile">Foto produk / akun (JPG, PNG, WEBP, maks. 5 MB)</label><input id="dxImageFile" type="file" accept="image/jpeg,image/png,image/webp" style="display:block;width:100%;margin-top:8px;color:white"><small id="dxImagePreviewText">Pilih gambar dari galeri HP.</small>';
    urlInput.parentElement.insertBefore(wrap, urlInput);
    form.dataset.imageUploadReady = "1";
    form.addEventListener("submit", async event => {
      const file = $("dxImageFile")?.files?.[0];
      if (!file) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const button = $("dxSaveButton");
      button.disabled = true;
      button.textContent = "Mengunggah gambar...";
      try {
        const url = await uploadImage(file, currentUser.id, "admin");
        urlInput.value = url;
        await saveDXAdminItem({ preventDefault() {} });
        $("dxImageFile").value = "";
      } catch (error) {
        showDXAdminMessage("Upload gagal: " + getDXError(error));
      } finally {
        button.disabled = false;
        updateDXAdminFormLabels();
      }
    }, true);
  }

  function installSellerForm() {
    const section = $("accounts");
    if (!section || $("dxSellerFormWrap")) return;
    const wrap = document.createElement("section");
    wrap.id = "dxSellerFormWrap";
    wrap.style.cssText = "max-width:900px;margin:30px auto;padding:22px;border:1px solid #29466f;border-radius:16px;background:#101b32;color:white";
    wrap.innerHTML = '<h3 style="color:#51e5ff;margin-bottom:8px">Jual Akun Game di DX STORE</h3><p style="color:#aab8d0;margin-bottom:16px">Foto akan tersimpan bersama listing. Listing baru tampil di marketplace setelah disetujui admin.</p><form id="dxSellerForm" style="display:grid;gap:10px"><label>Nama game<input id="dxSellerGame" required maxlength="80" placeholder="Contoh: Mobile Legends"></label><label>Judul akun<input id="dxSellerTitle" required maxlength="120" placeholder="Judul listing akun"></label><label>Deskripsi<textarea id="dxSellerDescription" rows="3" maxlength="2000" placeholder="Jelaskan detail akun"></textarea></label><label>Harga (Rupiah)<input id="dxSellerPrice" type="text" inputmode="numeric" required placeholder="Contoh: 150.000"></label><label>Foto akun (JPG, PNG, WEBP · maks. 5 MB)<input id="dxSellerImage" type="file" accept="image/jpeg,image/png,image/webp" required></label><div id="dxSellerImagePreview" style="display:none"><img alt="Pratinjau foto akun" style="display:block;width:100%;max-height:220px;object-fit:contain;border-radius:12px;background:#081326"><small>Pratinjau foto yang akan diunggah.</small></div><button class="dx-button" type="submit">Kirim Listing untuk Ditinjau</button><p id="dxSellerMessage" aria-live="polite"></p></form><div id="dxSellerMyListings" style="margin-top:20px"></div>';
    const style = document.createElement("style");
    style.textContent = "#dxSellerForm input,#dxSellerForm textarea{display:block;width:100%;padding:11px;margin-top:6px;border:1px solid #334b70;border-radius:8px;background:#0b1426;color:white}#dxSellerForm label{color:#cbd5e1;font-size:14px}";
    document.head.appendChild(style);
    section.querySelector(".dx-container")?.appendChild(wrap);

    // Form jual akun hanya untuk pengguna yang sudah masuk.
    // Jangan tampilkan form atau status "Belum ada listing" di halaman publik/login.
    function syncSellerFormVisibility() {
      wrap.hidden = !currentUser;
      if (!currentUser) {
        const host = $("dxSellerMyListings");
        if (host) host.innerHTML = "";
      }
    }
    syncSellerFormVisibility();

    if (typeof installDXRupiahInput === "function") installDXRupiahInput($("dxSellerPrice"));
    const imageInput = $("dxSellerImage");
    const preview = $("dxSellerImagePreview");
    const previewImage = preview?.querySelector("img");
    imageInput?.addEventListener("change", () => {
      const file = imageInput.files?.[0];
      if (!file) { preview.style.display = "none"; previewImage.removeAttribute("src"); return; }
      if (!allowed.includes(file.type) || file.size > MAX) {
        imageInput.value = "";
        preview.style.display = "none";
        $("dxSellerMessage").textContent = "Pilih JPG, PNG, atau WEBP maksimal 5 MB.";
        return;
      }
      previewImage.src = URL.createObjectURL(file);
      preview.style.display = "block";
      $("dxSellerMessage").textContent = "";
    });

    async function loadSellerListings() {
      const host = $("dxSellerMyListings");
      if (!host || !currentUser || !dxSupabase) { if (host) host.innerHTML = ""; return; }
      host.innerHTML = '<p style="color:#aab8d0">Memuat listing kamu...</p>';
      const { data, error } = await dxSupabase.from("account_listings")
        .select("id,game,title,price,image_url,status,created_at")
        .eq("seller_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) {
        host.innerHTML = '<p style="color:#fca5a5">Listing kamu belum dapat dimuat: ' + safeText(error.message) + '</p>';
        return;
      }
      if (!data?.length) {
        host.innerHTML = '<h4 style="color:#51e5ff">Listing Saya</h4><p style="color:#aab8d0">Belum ada listing yang dikirim.</p>';
        return;
      }
      const labels = { pending: "Menunggu pemeriksaan admin", active: "Tayang di marketplace", rejected: "Perlu diperbaiki / ditolak" };
      host.innerHTML = '<h4 style="color:#51e5ff;margin-bottom:10px">Listing Saya</h4>' + data.map(item => {
        const photo = safeImageUrl(item.image_url);
        return '<article style="display:flex;gap:12px;align-items:center;padding:10px;margin:8px 0;border:1px solid #29466f;border-radius:12px;background:#0b1426">' +
          (photo ? '<img src="' + safeText(photo) + '" alt="' + safeText(item.title) + '" style="width:72px;height:72px;object-fit:cover;border-radius:9px">' : '') +
          '<div style="min-width:0"><strong>' + safeText(item.title) + '</strong><p style="margin:4px 0;color:#aab8d0;font-size:12px">' + safeText(item.game) + ' · ' + formatPrice(item.price) + '</p><small style="color:#7de7ff">' + safeText(labels[item.status] || item.status) + '</small></div></article>';
      }).join("");
    }
    loadSellerListings();
    dxSupabase?.auth.onAuthStateChange((_event, session) => {
      // Tunggu app.js memperbarui currentUser dari sesi terbaru.
      setTimeout(() => {
        syncSellerFormVisibility();
        loadSellerListings();
      }, 0);
    });
    $("dxSellerForm").addEventListener("submit", async event => {
      event.preventDefault();
      const message = $("dxSellerMessage");
      if (!currentUser) { message.textContent = "Silakan masuk atau daftar terlebih dahulu."; openAuth(); return; }
      if (!dxSupabase) { message.textContent = "Layanan belum siap. Muat ulang halaman."; return; }
      const price = typeof parseDXRupiahInput === "function" ? parseDXRupiahInput($("dxSellerPrice").value) : Number($("dxSellerPrice").value.replace(/\./g, ""));
      if (!Number.isFinite(price) || price < 1) { message.textContent = "Masukkan harga lebih dari Rp0."; return; }
      const button = event.submitter;
      button.disabled = true;
      message.textContent = "Mengunggah foto dan menyimpan listing...";
      try {
        const imageUrl = await uploadImage($("dxSellerImage").files[0], currentUser.id, "seller");
        const { error } = await dxSupabase.from("account_listings").insert({
          seller_id: currentUser.id,
          game: $("dxSellerGame").value.trim(),
          title: $("dxSellerTitle").value.trim(),
          description: $("dxSellerDescription").value.trim() || null,
          price,
          image_url: imageUrl,
          status: "pending"
        });
        if (error) throw error;
        $("dxSellerForm").reset();
        message.textContent = "Listing dan foto berhasil dikirim. Status: menunggu pemeriksaan admin. Foto akan tampil di marketplace setelah disetujui.";
        preview.style.display = "none";
        previewImage.removeAttribute("src");
        await loadSellerListings();
      } catch (error) {
        message.textContent = "Gagal mengirim: " + getDXError(error);
      } finally { button.disabled = false; }
    });
  }

  const observer = new MutationObserver(() => installAdminUpload());
  function start() {
    installSellerForm();
    installAdminUpload();
    if ($("dxAdminPanel")) observer.observe($("dxAdminPanel"), { childList: true, subtree: true });
    setInterval(() => { installSellerForm(); installAdminUpload(); }, 1000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
