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
    wrap.innerHTML = '<h3 style="color:#51e5ff;margin-bottom:8px">Jual Akun Game di DX STORE</h3><p style="color:#aab8d0;margin-bottom:16px">Masuk ke akun untuk memasang iklan. Foto bisa dipilih langsung dari galeri.</p><form id="dxSellerForm" style="display:grid;gap:10px"><label>Nama game<input id="dxSellerGame" required placeholder="Contoh: Mobile Legends"></label><label>Judul akun<input id="dxSellerTitle" required placeholder="Judul listing akun"></label><label>Deskripsi<textarea id="dxSellerDescription" rows="3" placeholder="Jelaskan detail akun"></textarea></label><label>Harga (Rupiah)<input id="dxSellerPrice" type="text" inputmode="numeric" required placeholder="Contoh: 150.000"></label><label>Foto akun<input id="dxSellerImage" type="file" accept="image/jpeg,image/png,image/webp" required></label><button class="dx-button" type="submit">Kirim Listing untuk Ditinjau</button><p id="dxSellerMessage" aria-live="polite"></p></form>';
    const style = document.createElement("style");
    style.textContent = "#dxSellerForm input,#dxSellerForm textarea{display:block;width:100%;padding:11px;margin-top:6px;border:1px solid #334b70;border-radius:8px;background:#0b1426;color:white}#dxSellerForm label{color:#cbd5e1;font-size:14px}";
    document.head.appendChild(style);
    section.querySelector(".dx-container")?.appendChild(wrap);
    if (typeof installDXRupiahInput === "function") installDXRupiahInput($("dxSellerPrice"));\n    $("dxSellerForm").addEventListener("submit", async event => {
      event.preventDefault();
      const message = $("dxSellerMessage");
      if (!currentUser) { message.textContent = "Silakan masuk atau daftar terlebih dahulu."; openAuth(); return; }
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
          price: typeof parseDXRupiahInput === "function" ? parseDXRupiahInput($("dxSellerPrice").value) : Number($("dxSellerPrice").value.replace(/\\./g, "")),
          image_url: imageUrl,
          status: "pending"
        });
        if (error) throw error;
        $("dxSellerForm").reset();
        message.textContent = "Listing terkirim. Admin akan meninjau sebelum ditampilkan.";
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
