(() => {
  const config = window.DX_CONFIG || {};
  const client = window.supabase?.createClient(config.supabaseUrl, config.supabaseKey);
  const $ = id => document.getElementById(id);
  let mode = "login";
  const countrySelect = $("countrySelect");
  const supportedCountries = ["ID","MY","SG","US","JP","TH","PH","AU","GB","DE","FR","IN","KR","BR","CA","CN"];
  const savedCountry = localStorage.getItem("dx-country") || "ID";
  if (countrySelect) {
    countrySelect.value = supportedCountries.includes(savedCountry) ? savedCountry : "ID";
    countrySelect.addEventListener("change", () => localStorage.setItem("dx-country", countrySelect.value));
  }
  // Suara sapaan DX-01 pada halaman login. Browser mensyaratkan interaksi pengguna sebelum audio diputar.
  const mascotStage = $("mascotStage");
  const mascotSpeech = $("mascotSpeech");
  const mascotListen = $("mascotListen");
  const mascotGreetings = {
    ID: ["Halo! Aku DX-01, maskot resmi DX STORE. Selamat datang! Silakan masuk atau daftar untuk mulai menjelajahi marketplace.", "id-ID"],
    MY: ["Helo! Saya DX-01, maskot rasmi DX STORE. Selamat datang! Sila log masuk atau daftar untuk meneroka pasaran kami.", "ms-MY"],
    SG: ["Hello! I'm DX-01, the official DX STORE mascot. Welcome! Sign in or register to explore the marketplace.", "en-SG"],
    US: ["Hello! I'm DX-01, the official DX STORE mascot. Welcome! Sign in or register to explore the marketplace.", "en-US"],
    JP: ["こんにちは！DX STORE公式マスコットのDX-01です。ログインまたは登録して、マーケットプレイスをご覧ください。", "ja-JP"],
    TH: ["สวัสดี! ฉันคือ DX-01 มาสคอตอย่างเป็นทางการของ DX STORE ยินดีต้อนรับ เข้าสู่ระบบหรือลงทะเบียนเพื่อเริ่มใช้งาน", "th-TH"],
    PH: ["Hello! I'm DX-01, the official DX STORE mascot. Welcome! Sign in or register to explore the marketplace.", "en-PH"],
    AU: ["Hello! I'm DX-01, the official DX STORE mascot. Welcome! Sign in or register to explore the marketplace.", "en-AU"],
    GB: ["Hello! I'm DX-01, the official DX STORE mascot. Welcome! Sign in or register to explore the marketplace.", "en-GB"],
    DE: ["Hallo! Ich bin DX-01, das offizielle Maskottchen von DX STORE. Willkommen! Melde dich an oder registriere dich.", "de-DE"],
    FR: ["Bonjour ! Je suis DX-01, la mascotte officielle de DX STORE. Bienvenue ! Connectez-vous ou inscrivez-vous.", "fr-FR"],
    IN: ["नमस्ते! मैं DX STORE का आधिकारिक शुभंकर DX-01 हूँ। स्वागत है! आगे बढ़ने के लिए लॉग इन करें या पंजीकरण करें।", "hi-IN"],
    KR: ["안녕하세요! DX STORE의 공식 마스코트 DX-01입니다. 환영합니다! 로그인하거나 가입해 주세요.", "ko-KR"],
    BR: ["Olá! Sou DX-01, o mascote oficial da DX STORE. Boas-vindas! Entre ou cadastre-se para explorar nossa loja.", "pt-BR"],
    CA: ["Hello! I'm DX-01, the official DX STORE mascot. Welcome! Sign in or register to explore the marketplace.", "en-CA"],
    CN: ["你好！我是 DX STORE 的官方吉祥物 DX-01。欢迎！请登录或注册以浏览商城。", "zh-CN"]
  };
  let mascotHasGreeted = false;
  let mascotUtterance = null;
  function speakMascotGreeting() {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      if (mascotSpeech) mascotSpeech.textContent = "Peramban ini belum mendukung suara otomatis. Kamu tetap bisa melanjutkan login.";
      return;
    }
    const code = countrySelect?.value || "ID";
    const [line, language] = mascotGreetings[code] || mascotGreetings.ID;
    window.speechSynthesis.cancel();
    mascotUtterance = new SpeechSynthesisUtterance(line);
    mascotUtterance.lang = language;
    mascotUtterance.rate = 0.96;
    mascotUtterance.pitch = 1.08;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(item => item.lang.toLowerCase() === language.toLowerCase())
      || voices.find(item => item.lang.toLowerCase().startsWith(language.slice(0,2).toLowerCase()));
    if (voice) mascotUtterance.voice = voice;
    if (mascotSpeech) mascotSpeech.textContent = line;
    mascotUtterance.onstart = () => mascotStage?.classList.add("talking");
    mascotUtterance.onboundary = () => {
      if (!mascotStage) return;
      mascotStage.classList.add("talking");
    };
    mascotUtterance.onend = mascotUtterance.onerror = () => mascotStage?.classList.remove("talking");
    window.speechSynthesis.speak(mascotUtterance);
    mascotHasGreeted = true;
    if (mascotListen) mascotListen.textContent = "↻ Ulangi sapaan DX-01";
  }
  mascotListen?.addEventListener("click", speakMascotGreeting);
  document.addEventListener("pointerdown", () => {
    if (!mascotHasGreeted) speakMascotGreeting();
  }, { once: true, capture: true });
  document.addEventListener("keydown", () => {
    if (!mascotHasGreeted) speakMascotGreeting();
  }, { once: true, capture: true });
  countrySelect?.addEventListener("change", () => {
    if (mascotSpeech) mascotSpeech.textContent = "Bahasa suara maskot telah disesuaikan dengan negara pilihan.";
  });
  window.addEventListener("pagehide", () => window.speechSynthesis?.cancel());

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