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
    const fileInput = $("dxImageFile");
    if (!urlInput || !fileInput) return;

    // app.js sudah menyediakan picker dan menangani upload + penyimpanan URL.
    // Jangan membuat input file kedua atau mengunggah gambar dua kali.
    urlInput.type = "hidden";
    form.dataset.imageUploadReady = "1";
  }

  // Amati perubahan DOM agar form admin yang muncul belakangan tetap terpasang,
  // tanpa polling setiap detik yang membebani perangkat pengguna.
  const observer = new MutationObserver(() => {
    installAdminUpload();
  });
  function start() {
    installAdminUpload();
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
