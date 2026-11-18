(() => {
  const config = window.DX_CONFIG || {};
  const client = window.supabase?.createClient(config.supabaseUrl, config.supabaseKey);
  const $ = id => document.getElementById(id);
  let mode = "login";
  if (!client) { $("message").textContent = "Koneksi layanan belum tersedia. Muat ulang halaman."; return; }

  client.auth.getSession().then(({ data }) => {
    if (data?.session) window.location.replace("index.html");
  });

  $("switchMode").addEventListener("click", () => {
    mode = mode === "login" ? "register" : "login";
    $("nameLabel").hidden = mode !== "register";
    $("displayName").required = mode === "register";
    $("formTitle").textContent = mode === "login" ? "Selamat datang kembali" : "Buat akun DX STORE";
    $("formSubtitle").textContent = mode === "login" ? "Masuk untuk melanjutkan ke beranda." : "Daftar akun untuk mulai menggunakan DX STORE.";
    $("submitButton").textContent = mode === "login" ? "Masuk" : "Daftar";
    $("switchMode").textContent = mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk";
    $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
    $("message").textContent = "";
  });

  $("loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = $("submitButton");
    const email = $("email").value.trim();
    const password = $("password").value;
    const name = $("displayName").value.trim();
    button.disabled = true;
    button.textContent = "Memproses...";
    $("message").textContent = "";
    try {
      let result;
      if (mode === "login") {
        result = await client.auth.signInWithPassword({ email, password });
      } else {
        result = await client.auth.signUp({
          email, password,
          options: { data: { display_name: name || email.split("@")[0] } }
        });
      }
      if (result.error) throw result.error;
      if (mode === "register" && !result.data.session) {
        $("message").textContent = "Pendaftaran berhasil. Silakan periksa email untuk verifikasi, lalu masuk.";
        return;
      }
      if (!result.data.session) throw new Error("Sesi login belum tersedia. Coba masuk kembali.");
      $("message").textContent = "Berhasil masuk. Membuka beranda DX STORE...";
      window.location.replace("index.html");
    } catch (error) {
      $("message").textContent = error?.message || "Tidak dapat memproses akun. Coba lagi.";
    } finally {
      button.disabled = false;
      button.textContent = mode === "login" ? "Masuk" : "Daftar";
    }
  });
})();