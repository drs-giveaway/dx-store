
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

const DX_COUNTRIES = {
  ID: { name: "Indonesia", language: "id-ID", currency: "IDR", locale: "id-ID", timezone: "Asia/Jakarta" },
  MY: { name: "Malaysia", language: "ms-MY", currency: "MYR", locale: "ms-MY", timezone: "Asia/Kuala_Lumpur" },
  SG: { name: "Singapore", language: "en-SG", currency: "SGD", locale: "en-SG", timezone: "Asia/Singapore" },
  US: { name: "United States", language: "en-US", currency: "USD", locale: "en-US", timezone: "America/New_York" },
  JP: { name: "Japan", language: "ja-JP", currency: "JPY", locale: "ja-JP", timezone: "Asia/Tokyo" },
  TH: { name: "Thailand", language: "th-TH", currency: "THB", locale: "th-TH", timezone: "Asia/Bangkok" },
  PH: { name: "Philippines", language: "en-PH", currency: "PHP", locale: "en-PH", timezone: "Asia/Manila" },
  AU: { name: "Australia", language: "en-AU", currency: "AUD", locale: "en-AU", timezone: "Australia/Sydney" },
  GB: { name: "United Kingdom", language: "en-GB", currency: "GBP", locale: "en-GB", timezone: "Europe/London" },
  DE: { name: "Germany", language: "de-DE", currency: "EUR", locale: "de-DE", timezone: "Europe/Berlin" },
  FR: { name: "France", language: "fr-FR", currency: "EUR", locale: "fr-FR", timezone: "Europe/Paris" },
  IN: { name: "India", language: "hi-IN", currency: "INR", locale: "en-IN", timezone: "Asia/Kolkata" },
  KR: { name: "South Korea", language: "ko-KR", currency: "KRW", locale: "ko-KR", timezone: "Asia/Seoul" },
  BR: { name: "Brazil", language: "pt-BR", currency: "BRL", locale: "pt-BR", timezone: "America/Sao_Paulo" },
  CA: { name: "Canada", language: "en-CA", currency: "CAD", locale: "en-CA", timezone: "America/Toronto" },
  CN: { name: "China", language: "zh-CN", currency: "CNY", locale: "zh-CN", timezone: "Asia/Shanghai" }
};

let dxExchangeRates = { IDR: 1 };
let dxExchangeRateReady = false;
let dxExchangeRatePromise = null;

const DX_TRANSLATIONS = {
  en: {
    "Beranda":"Home","Produk Digital":"Digital Products","Akun Game":"Game Accounts",
    "Masuk / Daftar":"Sign in / Register","Keluar":"Sign out","Jelajahi Produk":"Explore Products",
    "Lihat Akun Game":"Browse Game Accounts","READY TO LEVEL UP?":"READY TO LEVEL UP?",
    "Temukan berbagai produk digital dan akun game pilihan dengan pengalaman marketplace yang mudah dan nyaman.":"Discover selected digital products and game accounts in one easy marketplace.",
    "Jelajahi berbagai produk digital pilihan dari DX STORE.":"Explore selected digital products from DX STORE.",
    "Jelajahi pilihan akun game yang tersedia.":"Explore available game accounts.",
    "Cari produk atau akun game...":"Search products or game accounts...",
    "Marketplace Akun Game":"Game Account Marketplace","Produk digital akan ditampilkan di sini.":"Digital products will appear here.",
    "Akun game akan ditampilkan di sini.":"Game accounts will appear here.","Memuat produk...":"Loading products...",
    "Memuat akun game...":"Loading game accounts...","Lihat Produk":"View Product","Lihat Akun":"View Account",
    "Sedang Dipesan":"Pending","Habis Terjual":"Sold Out","Sampai jumpa!":"See you again!"
  },
  ms: {
    "Beranda":"Laman Utama","Produk Digital":"Produk Digital","Akun Game":"Akaun Permainan",
    "Masuk / Daftar":"Log masuk / Daftar","Keluar":"Log keluar","Jelajahi Produk":"Terokai Produk",
    "Lihat Akun Game":"Lihat Akaun Permainan","Temukan berbagai produk digital dan akun game pilihan dengan pengalaman marketplace yang mudah dan nyaman.":"Temui produk digital dan akaun permainan pilihan dalam satu pasaran yang mudah digunakan.",
    "Jelajahi berbagai produk digital pilihan dari DX STORE.":"Terokai pelbagai produk digital pilihan daripada DX STORE.",
    "Jelajahi pilihan akun game yang tersedia.":"Terokai pilihan akaun permainan yang tersedia.",
    "Cari produk atau akun game...":"Cari produk atau akaun permainan...",
    "Marketplace Akun Game":"Pasaran Akaun Permainan","Produk digital akan ditampilkan di sini.":"Produk digital akan dipaparkan di sini.",
    "Akun game akan ditampilkan di sini.":"Akaun permainan akan dipaparkan di sini.","Memuat produk...":"Memuatkan produk...",
    "Memuat akun game...":"Memuatkan akaun permainan...","Lihat Produk":"Lihat Produk","Lihat Akun":"Lihat Akaun",
    "Sedang Dipesan":"Dalam Tempahan","Habis Terjual":"Habis Dijual"
  },
  ja: {
    "Beranda":"ホーム","Produk Digital":"デジタル商品","Akun Game":"ゲームアカウント",
    "Masuk / Daftar":"ログイン / 登録","Keluar":"ログアウト","Jelajahi Produk":"商品を見る",
    "Lihat Akun Game":"ゲームアカウントを見る","Marketplace Akun Game":"ゲームアカウントマーケット",
    "Cari produk atau akun game...":"商品またはゲームアカウントを検索...",
    "Jelajahi berbagai produk digital pilihan dari DX STORE.":"DX STOREの厳選デジタル商品をご覧ください。",
    "Jelajahi pilihan akun game yang tersedia.":"利用可能なゲームアカウントをご覧ください。",
    "Lihat Produk":"商品を見る","Lihat Akun":"アカウントを見る","Sedang Dipesan":"予約中","Habis Terjual":"売り切れ"
  },
  de: {"Beranda":"Startseite","Produk Digital":"Digitale Produkte","Akun Game":"Spielkonten","Masuk / Daftar":"Anmelden / Registrieren","Keluar":"Abmelden","Jelajahi Produk":"Produkte entdecken","Lihat Akun Game":"Spielkonten ansehen","Marketplace Akun Game":"Marktplatz für Spielkonten","Cari produk atau akun game...":"Produkte oder Spielkonten suchen...","Lihat Produk":"Produkt ansehen","Lihat Akun":"Konto ansehen","Sedang Dipesan":"Ausstehend","Habis Terjual":"Ausverkauft"},
  fr: {"Beranda":"Accueil","Produk Digital":"Produits numériques","Akun Game":"Comptes de jeu","Masuk / Daftar":"Connexion / Inscription","Keluar":"Déconnexion","Jelajahi Produk":"Explorer les produits","Lihat Akun Game":"Voir les comptes de jeu","Marketplace Akun Game":"Marché des comptes de jeu","Cari produk atau akun game...":"Rechercher des produits ou comptes de jeu...","Lihat Produk":"Voir le produit","Lihat Akun":"Voir le compte","Sedang Dipesan":"En attente","Habis Terjual":"Épuisé"},
  zh: {"Beranda":"首页","Produk Digital":"数字商品","Akun Game":"游戏账号","Masuk / Daftar":"登录 / 注册","Keluar":"退出登录","Jelajahi Produk":"浏览商品","Lihat Akun Game":"浏览游戏账号","Marketplace Akun Game":"游戏账号市场","Cari produk atau akun game...":"搜索商品或游戏账号...","Lihat Produk":"查看商品","Lihat Akun":"查看账号","Sedang Dipesan":"预订中","Habis Terjual":"已售罄"},
  ko: {"Beranda":"홈","Produk Digital":"디지털 상품","Akun Game":"게임 계정","Masuk / Daftar":"로그인 / 가입","Keluar":"로그아웃","Jelajahi Produk":"상품 둘러보기","Lihat Akun Game":"게임 계정 보기","Marketplace Akun Game":"게임 계정 마켓","Cari produk atau akun game...":"상품 또는 게임 계정 검색...","Lihat Produk":"상품 보기","Lihat Akun":"계정 보기","Sedang Dipesan":"예약 중","Habis Terjual":"품절"},
  th: {"Beranda":"หน้าหลัก","Produk Digital":"สินค้าดิจิทัล","Akun Game":"บัญชีเกม","Masuk / Daftar":"เข้าสู่ระบบ / สมัครสมาชิก","Keluar":"ออกจากระบบ","Jelajahi Produk":"เลือกชมสินค้า","Lihat Akun Game":"ดูบัญชีเกม","Marketplace Akun Game":"ตลาดบัญชีเกม","Cari produk atau akun game...":"ค้นหาสินค้าหรือบัญชีเกม...","Lihat Produk":"ดูสินค้า","Lihat Akun":"ดูบัญชี","Sedang Dipesan":"รอดำเนินการ","Habis Terjual":"ขายหมดแล้ว"},
  pt: {"Beranda":"Início","Produk Digital":"Produtos digitais","Akun Game":"Contas de jogos","Masuk / Daftar":"Entrar / Cadastrar","Keluar":"Sair","Jelajahi Produk":"Explorar produtos","Lihat Akun Game":"Ver contas de jogos","Marketplace Akun Game":"Mercado de contas de jogos","Cari produk atau akun game...":"Buscar produtos ou contas de jogos...","Lihat Produk":"Ver produto","Lihat Akun":"Ver conta","Sedang Dipesan":"Pendente","Habis Terjual":"Esgotado"},
  hi: {"Beranda":"होम","Produk Digital":"डिजिटल उत्पाद","Akun Game":"गेम खाते","Masuk / Daftar":"लॉगिन / रजिस्टर","Keluar":"लॉग आउट","Jelajahi Produk":"उत्पाद देखें","Lihat Akun Game":"गेम खाते देखें","Marketplace Akun Game":"गेम अकाउंट मार्केटप्लेस","Cari produk atau akun game...":"उत्पाद या गेम खाता खोजें...","Lihat Produk":"उत्पाद देखें","Lihat Akun":"खाता देखें","Sedang Dipesan":"लंबित","Habis Terjual":"बिक गया"}
};


Object.assign(DX_TRANSLATIONS.en, {
  "Halo,":"Hello,","Semua kebutuhan digitalmu dalam satu tempat.":"All your digital needs in one place.",
  "NEGARA & MATA UANG":"COUNTRY & CURRENCY","Marketplace Digital":"Digital Marketplace",
  "Jelajahi layanan":"Explore services","Produk":"Products","Cari":"Search","Jual Akun":"Sell Account","Akun":"Account",
  "Pengaturan Akun":"Account Settings","Ubah negara dan mata uang melalui pilihan di bagian atas.":"Change your country and currency using the selector above.",
  "Belum ada produk digital.":"No digital products yet.","Belum ada akun game.":"No game accounts yet.",
  "Produk gagal dimuat.":"Could not load products.","Akun game gagal dimuat.":"Could not load game accounts.",
  "Memuat akun game...":"Loading game accounts...","Memuat produk...":"Loading products...",
  "Lanjutkan":"Continue","Tutup":"Close","Deskripsi":"Description","Harga":"Price",
  "Menunggu pembayaran":"Awaiting payment","Menunggu pemeriksaan admin":"Awaiting admin review",
  "Kirim Bukti Pembayaran":"Submit Payment Proof","Buat Pesanan":"Create Order",
  "Membuat pesanan...":"Creating order...","Pesanan Dibuat":"Order Created",
  "Pilih bukti JPG/PNG dengan ukuran maksimal 4 MB.":"Choose a JPG/PNG proof file up to 4 MB.",
  "Bukti diterima. Pesanan belum lunas sampai admin memeriksa dana masuk.":"Proof received. The order is not paid until the admin verifies the incoming payment.",
  "Bayar tepat":"Pay exactly","Tidak berlaku sebagai QRIS dinamis":"This is not a dynamic QRIS payment",
  "Belum punya akun? Daftar":"Don't have an account? Register","Masuk":"Sign in","Daftar":"Register",
  "Memproses...":"Processing...","Keluar...":"Signing out...","Menyimpan...":"Saving...",
  "Belum ada pesanan.":"No orders yet.","Memuat pesanan...":"Loading orders...",
  "Data gagal dimuat:":"Could not load data:","Belum ada data.":"No data yet.",
  "Nama produk":"Product name","Deskripsi produk atau akun":"Product or account description",
  "Harga (Rupiah)":"Price (IDR)","Simpan Produk":"Save Product","Pilih gambar":"Choose image"
});
Object.assign(DX_TRANSLATIONS.ms, {
  "Halo,":"Helo,","Semua kebutuhan digitalmu dalam satu tempat.":"Semua keperluan digital anda di satu tempat.",
  "NEGARA & MATA UANG":"NEGARA & MATA WANG","Marketplace Digital":"Pasaran Digital",
  "Jelajahi layanan":"Terokai perkhidmatan","Produk":"Produk","Cari":"Cari","Jual Akun":"Jual Akaun","Akun":"Akaun",
  "Pengaturan Akun":"Tetapan Akaun","Ubah negara dan mata uang melalui pilihan di bagian atas.":"Tukar negara dan mata wang melalui pilihan di atas.",
  "Belum ada produk digital.":"Belum ada produk digital.","Belum ada akun game.":"Belum ada akaun permainan.",
  "Produk gagal dimuat.":"Produk gagal dimuatkan.","Akun game gagal dimuat.":"Akaun permainan gagal dimuatkan.",
  "Lanjutkan":"Teruskan","Tutup":"Tutup","Deskripsi":"Penerangan","Harga":"Harga",
  "Menunggu pembayaran":"Menunggu pembayaran","Kirim Bukti Pembayaran":"Hantar Bukti Pembayaran",
  "Buat Pesanan":"Buat Tempahan","Memproses...":"Sedang diproses...","Menyimpan...":"Menyimpan..."
});
Object.assign(DX_TRANSLATIONS.ja, {
  "Halo,":"こんにちは、","Semua kebutuhan digitalmu dalam satu tempat.":"デジタルに必要なものをすべてここで。",
  "NEGARA & MATA UANG":"国と言語・通貨","Marketplace Digital":"デジタルマーケット",
  "Jelajahi layanan":"サービスを見る","Produk":"商品","Cari":"検索","Jual Akun":"アカウントを販売","Akun":"アカウント",
  "Pengaturan Akun":"アカウント設定","Belum ada produk digital.":"デジタル商品はまだありません。",
  "Belum ada akun game.":"ゲームアカウントはまだありません。","Lanjutkan":"続行","Tutup":"閉じる",
  "Deskripsi":"説明","Harga":"価格","Menunggu pembayaran":"支払い待ち","Kirim Bukti Pembayaran":"支払い証明を送信",
  "Buat Pesanan":"注文する","Memproses...":"処理中...","Menyimpan...":"保存中..."
});


Object.assign(DX_TRANSLATIONS.de, {
  "Halo,":"Hallo,","Semua kebutuhan digitalmu dalam satu tempat.":"Alle digitalen Bedürfnisse an einem Ort.",
  "NEGARA & MATA UANG":"LAND & WÄHRUNG","Marketplace Digital":"Digitaler Marktplatz","Jelajahi layanan":"Dienste entdecken",
  "Produk":"Produkte","Cari":"Suchen","Jual Akun":"Konto verkaufen","Akun":"Konto",
  "Pengaturan Akun":"Kontoeinstellungen","Ubah negara dan mata uang melalui pilihan di bagian atas.":"Land und Währung über die Auswahl oben ändern.",
  "Belum ada produk digital.":"Noch keine digitalen Produkte.","Belum ada akun game.":"Noch keine Spielkonten.",
  "Produk gagal dimuat.":"Produkte konnten nicht geladen werden.","Akun game gagal dimuat.":"Spielkonten konnten nicht geladen werden.",
  "Lanjutkan":"Weiter","Tutup":"Schließen","Deskripsi":"Beschreibung","Harga":"Preis","Menunggu pembayaran":"Zahlung ausstehend",
  "Menunggu pemeriksaan admin":"Warten auf Admin-Prüfung","Kirim Bukti Pembayaran":"Zahlungsnachweis senden",
  "Buat Pesanan":"Bestellung erstellen","Memproses...":"Wird verarbeitet...","Menyimpan...":"Wird gespeichert...",
  "Belum ada pesanan.":"Noch keine Bestellungen.","Memuat pesanan...":"Bestellungen werden geladen..."
});
Object.assign(DX_TRANSLATIONS.fr, {
  "Halo,":"Bonjour,","Semua kebutuhan digitalmu dalam satu tempat.":"Tous vos besoins numériques au même endroit.",
  "NEGARA & MATA UANG":"PAYS ET DEVISE","Marketplace Digital":"Marché numérique","Jelajahi layanan":"Découvrir les services",
  "Produk":"Produits","Cari":"Rechercher","Jual Akun":"Vendre un compte","Akun":"Compte",
  "Pengaturan Akun":"Paramètres du compte","Ubah negara dan mata uang melalui pilihan di bagian atas.":"Modifiez le pays et la devise avec le sélecteur ci-dessus.",
  "Belum ada produk digital.":"Aucun produit numérique pour le moment.","Belum ada akun game.":"Aucun compte de jeu pour le moment.",
  "Produk gagal dimuat.":"Échec du chargement des produits.","Akun game gagal dimuat.":"Échec du chargement des comptes de jeu.",
  "Lanjutkan":"Continuer","Tutup":"Fermer","Deskripsi":"Description","Harga":"Prix","Menunggu pembayaran":"En attente de paiement",
  "Menunggu pemeriksaan admin":"En attente de vérification","Kirim Bukti Pembayaran":"Envoyer la preuve de paiement",
  "Buat Pesanan":"Créer une commande","Memproses...":"Traitement...","Menyimpan...":"Enregistrement...",
  "Belum ada pesanan.":"Aucune commande pour le moment.","Memuat pesanan...":"Chargement des commandes..."
});
Object.assign(DX_TRANSLATIONS.zh, {
  "Halo,":"你好，","Semua kebutuhan digitalmu dalam satu tempat.":"您的数字需求，一站满足。",
  "NEGARA & MATA UANG":"国家与货币","Marketplace Digital":"数字商品市场","Jelajahi layanan":"探索服务",
  "Produk":"商品","Cari":"搜索","Jual Akun":"出售账号","Akun":"账号",
  "Pengaturan Akun":"账号设置","Ubah negara dan mata uang melalui pilihan di bagian atas.":"使用上方选项更改国家和货币。",
  "Belum ada produk digital.":"暂无数字商品。","Belum ada akun game.":"暂无游戏账号。",
  "Produk gagal dimuat.":"商品加载失败。","Akun game gagal dimuat.":"游戏账号加载失败。",
  "Lanjutkan":"继续","Tutup":"关闭","Deskripsi":"描述","Harga":"价格","Menunggu pembayaran":"等待付款",
  "Menunggu pemeriksaan admin":"等待管理员审核","Kirim Bukti Pembayaran":"提交付款凭证",
  "Buat Pesanan":"创建订单","Memproses...":"处理中...","Menyimpan...":"保存中...",
  "Belum ada pesanan.":"暂无订单。","Memuat pesanan...":"正在加载订单..."
});
Object.assign(DX_TRANSLATIONS.ko, {
  "Halo,":"안녕하세요,","Semua kebutuhan digitalmu dalam satu tempat.":"모든 디지털 서비스를 한곳에서 만나보세요.",
  "NEGARA & MATA UANG":"국가 및 통화","Marketplace Digital":"디지털 마켓플레이스","Jelajahi layanan":"서비스 둘러보기",
  "Produk":"상품","Cari":"검색","Jual Akun":"계정 판매","Akun":"계정",
  "Pengaturan Akun":"계정 설정","Ubah negara dan mata uang melalui pilihan di bagian atas.":"위 선택 메뉴에서 국가와 통화를 변경하세요.",
  "Belum ada produk digital.":"아직 디지털 상품이 없습니다.","Belum ada akun game.":"아직 게임 계정이 없습니다.",
  "Produk gagal dimuat.":"상품을 불러오지 못했습니다.","Akun game gagal dimuat.":"게임 계정을 불러오지 못했습니다.",
  "Lanjutkan":"계속","Tutup":"닫기","Deskripsi":"설명","Harga":"가격","Menunggu pembayaran":"결제 대기 중",
  "Menunggu pemeriksaan admin":"관리자 확인 대기 중","Kirim Bukti Pembayaran":"결제 증빙 제출",
  "Buat Pesanan":"주문하기","Memproses...":"처리 중...","Menyimpan...":"저장 중...",
  "Belum ada pesanan.":"주문이 없습니다.","Memuat pesanan...":"주문 불러오는 중..."
});
Object.assign(DX_TRANSLATIONS.th, {
  "Halo,":"สวัสดี,","Semua kebutuhan digitalmu dalam satu tempat.":"ทุกสิ่งที่คุณต้องการด้านดิจิทัลในที่เดียว",
  "NEGARA & MATA UANG":"ประเทศและสกุลเงิน","Marketplace Digital":"ตลาดสินค้าดิจิทัล","Jelajahi layanan":"สำรวจบริการ",
  "Produk":"สินค้า","Cari":"ค้นหา","Jual Akun":"ขายบัญชี","Akun":"บัญชี",
  "Pengaturan Akun":"ตั้งค่าบัญชี","Ubah negara dan mata uang melalui pilihan di bagian atas.":"เปลี่ยนประเทศและสกุลเงินจากเมนูด้านบน",
  "Belum ada produk digital.":"ยังไม่มีสินค้าดิจิทัล","Belum ada akun game.":"ยังไม่มีบัญชีเกม",
  "Produk gagal dimuat.":"โหลดสินค้าไม่สำเร็จ","Akun game gagal dimuat.":"โหลดบัญชีเกมไม่สำเร็จ",
  "Lanjutkan":"ดำเนินการต่อ","Tutup":"ปิด","Deskripsi":"คำอธิบาย","Harga":"ราคา","Menunggu pembayaran":"รอการชำระเงิน",
  "Menunggu pemeriksaan admin":"รอผู้ดูแลตรวจสอบ","Kirim Bukti Pembayaran":"ส่งหลักฐานการชำระเงิน",
  "Buat Pesanan":"สร้างคำสั่งซื้อ","Memproses...":"กำลังดำเนินการ...","Menyimpan...":"กำลังบันทึก...",
  "Belum ada pesanan.":"ยังไม่มีคำสั่งซื้อ","Memuat pesanan...":"กำลังโหลดคำสั่งซื้อ..."
});
Object.assign(DX_TRANSLATIONS.pt, {
  "Halo,":"Olá,","Semua kebutuhan digitalmu dalam satu tempat.":"Todas as suas necessidades digitais em um só lugar.",
  "NEGARA & MATA UANG":"PAÍS E MOEDA","Marketplace Digital":"Mercado digital","Jelajahi layanan":"Explorar serviços",
  "Produk":"Produtos","Cari":"Pesquisar","Jual Akun":"Vender conta","Akun":"Conta",
  "Pengaturan Akun":"Configurações da conta","Ubah negara dan mata uang melalui pilihan di bagian atas.":"Altere o país e a moeda usando a opção acima.",
  "Belum ada produk digital.":"Ainda não há produtos digitais.","Belum ada akun game.":"Ainda não há contas de jogos.",
  "Produk gagal dimuat.":"Falha ao carregar produtos.","Akun game gagal dimuat.":"Falha ao carregar contas de jogos.",
  "Lanjutkan":"Continuar","Tutup":"Fechar","Deskripsi":"Descrição","Harga":"Preço","Menunggu pembayaran":"Aguardando pagamento",
  "Menunggu pemeriksaan admin":"Aguardando análise do administrador","Kirim Bukti Pembayaran":"Enviar comprovante de pagamento",
  "Buat Pesanan":"Criar pedido","Memproses...":"Processando...","Menyimpan...":"Salvando...",
  "Belum ada pesanan.":"Ainda não há pedidos.","Memuat pesanan...":"Carregando pedidos..."
});
Object.assign(DX_TRANSLATIONS.hi, {
  "Halo,":"नमस्ते,","Semua kebutuhan digitalmu dalam satu tempat.":"आपकी सभी डिजिटल ज़रूरतें एक ही जगह।",
  "NEGARA & MATA UANG":"देश और मुद्रा","Marketplace Digital":"डिजिटल मार्केटप्लेस","Jelajahi layanan":"सेवाएँ देखें",
  "Produk":"उत्पाद","Cari":"खोजें","Jual Akun":"खाता बेचें","Akun":"खाता",
  "Pengaturan Akun":"खाता सेटिंग","Ubah negara dan mata uang melalui pilihan di bagian atas.":"ऊपर दिए विकल्प से देश और मुद्रा बदलें।",
  "Belum ada produk digital.":"अभी कोई डिजिटल उत्पाद नहीं है।","Belum ada akun game.":"अभी कोई गेम खाता नहीं है।",
  "Produk gagal dimuat.":"उत्पाद लोड नहीं हो सके।","Akun game gagal dimuat.":"गेम खाते लोड नहीं हो सके।",
  "Lanjutkan":"जारी रखें","Tutup":"बंद करें","Deskripsi":"विवरण","Harga":"कीमत","Menunggu pembayaran":"भुगतान की प्रतीक्षा",
  "Menunggu pemeriksaan admin":"व्यवस्थापक की जाँच की प्रतीक्षा","Kirim Bukti Pembayaran":"भुगतान प्रमाण भेजें",
  "Buat Pesanan":"ऑर्डर बनाएँ","Memproses...":"प्रक्रिया जारी...","Menyimpan...":"सहेजा जा रहा है...",
  "Belum ada pesanan.":"अभी कोई ऑर्डर नहीं है।","Memuat pesanan...":"ऑर्डर लोड हो रहे हैं..."
});

function getDXCountry() {
  const code = localStorage.getItem("dx-country") || "ID";
  return DX_COUNTRIES[code] ? { code, ...DX_COUNTRIES[code] } : { code: "ID", ...DX_COUNTRIES.ID };
}

function applyDXLanguage() {
  const country = getDXCountry();
  const language = country.language.split("-")[0];
  const dictionary = language === "id" ? {} : (DX_TRANSLATIONS[language] || DX_TRANSLATIONS.en || {});
  const translateTree = root => {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.parentElement?.closest("script,style,noscript,code,pre")) return;
      if (node.__dxOriginalText === undefined) node.__dxOriginalText = node.nodeValue;
      const raw = node.__dxOriginalText;
      const trimmed = raw.trim();
      const translated = dictionary[trimmed];
      const next = translated ? raw.replace(trimmed, translated) : raw;
      if (node.nodeValue !== next) node.nodeValue = next;
    });
    if (root.querySelectorAll) root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(el => {
      ["placeholder","aria-label","title"].forEach(attribute => {
        if (!el.hasAttribute(attribute)) return;
        const key = "dxOriginal" + attribute.replace(/(^|-)([a-z])/g, (_, dash, ch) => ch.toUpperCase());
        if (el.dataset[key] === undefined) el.dataset[key] = el.getAttribute(attribute);
        const original = el.dataset[key];
        const translated = dictionary[original] || original;
        if (el.getAttribute(attribute) !== translated) el.setAttribute(attribute, translated);
      });
    });
  };
  translateTree(document.body);
  const titles = {en:"DX STORE — Digital Marketplace",ms:"DX STORE — Pasaran Digital",ja:"DX STORE — デジタルマーケット",de:"DX STORE — Digitaler Marktplatz",fr:"DX STORE — Marché numérique",zh:"DX STORE — 数字市场",ko:"DX STORE — 디지털 마켓",th:"DX STORE — ตลาดดิจิทัล",pt:"DX STORE — Mercado Digital",hi:"DX STORE — डिजिटल मार्केटप्लेस"};
  const nextTitle = language === "id" ? "DX STORE — Marketplace Digital" : (titles[language] || titles.en);
  if (document.title !== nextTitle) document.title = nextTitle;
  if (!window.dxLanguageObserver && document.body) {
    window.dxLanguageObserver = new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes?.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) translateTree(node.parentElement || document.body);
          else if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
        });
        if (record.type === "characterData" && record.target.parentElement) translateTree(record.target.parentElement);
      });
    });
    window.dxLanguageObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
}
async function loadDXExchangeRates() {
  if (dxExchangeRatePromise) return dxExchangeRatePromise;
  dxExchangeRatePromise = (async () => {
    try {
      const response = await fetch("https://open.er-api.com/v6/latest/IDR", { cache: "no-store" });
      if (!response.ok) throw new Error("Kurs mata uang tidak tersedia");
      const data = await response.json();
      if (data.result !== "success" || !data.rates || !Number.isFinite(data.rates.USD)) throw new Error("Data kurs tidak valid");
      dxExchangeRates = data.rates;
      dxExchangeRateReady = true;
      document.dispatchEvent(new CustomEvent("dx-exchange-rates-ready"));
      return true;
    } catch (error) {
      console.warn("DX STORE: kurs mata uang belum dapat dimuat.", error);
      dxExchangeRatePromise = null;
      return false;
    }
  })();
  return dxExchangeRatePromise;
}

function setDXCountry(code) {
  if (!DX_COUNTRIES[code]) return;
  localStorage.setItem("dx-country", code);
  document.documentElement.lang = DX_COUNTRIES[code].language;
  const selector = $("dxCountry");
  if (selector && selector.value !== code) selector.value = code;
  const dashboardCurrency = $("dxDashboardCurrency");
  if (dashboardCurrency) dashboardCurrency.textContent = DX_COUNTRIES[code].currency + " · " + DX_COUNTRIES[code].name;
  applyDXLanguage();
  document.dispatchEvent(new CustomEvent("dx-country-change", { detail: { code, ...DX_COUNTRIES[code] } }));
  // Katalog tidak boleh bergantung pada layanan kurs eksternal.
  // Muat data segera; jika kurs tersedia, perbarui tampilan harga setelahnya.
  loadProducts();
  loadAccountListings();
  loadDXExchangeRates().then(() => {
    if (dxExchangeRateReady) {
      loadProducts();
      loadAccountListings();
      const amount = $("dxCheckoutAmount");
      if (amount && $("dxCheckoutModal")?.classList.contains("active")) {
        const item = $("dxCheckoutModal").dataset.itemAmount;
        if (item) amount.textContent = formatPrice(Number(item));
      }
    }
  });
}

function formatPrice(value) {
  const country = getDXCountry();
  const baseAmount = Number(value) || 0;
  if (country.currency !== "IDR" && !dxExchangeRateReady) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(baseAmount) + " · kurs memuat";
  }
  const rate = Number(dxExchangeRates[country.currency] || (country.currency === "IDR" ? 1 : 0));
  if (!rate) return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(baseAmount) + " · kurs tidak tersedia";
  const converted = baseAmount * rate;
  return new Intl.NumberFormat(country.locale, {
    style: "currency",
    currency: country.currency,
    maximumFractionDigits: ["IDR","JPY","KRW"].includes(country.currency) ? 0 : 2
  }).format(converted);
}

function formatDXRupiahInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseDXRupiahInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function installDXRupiahInput(input) {
  if (!input || input.dataset.dxRupiahReady === "1") return;
  input.type = "text";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.addEventListener("input", () => {
    const before = input.value;
    const cursor = input.selectionStart ?? before.length;
    const digitsBeforeCursor = before.slice(0, cursor).replace(/\D/g, "").length;
    const digits = before.replace(/\D/g, "");
    const formatted = formatDXRupiahInput(digits);
    input.value = formatted;
    let position = 0;
    let seen = 0;
    while (position < formatted.length && seen < digitsBeforeCursor) {
      if (/\d/.test(formatted[position])) seen++;
      position++;
    }
    input.setSelectionRange(position, position);
  });
  input.value = formatDXRupiahInput(input.value);
  input.dataset.dxRupiahReady = "1";
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
  window.location.href = "login.html";
}

function closeAuth() {
  const modal = $("authModal");

  if (modal) {
    modal.classList.remove("active");
  }
}

let dxActiveView = "home";
if (!window.dxViewNavigationBound) {
  window.dxViewNavigationBound = true;
  document.addEventListener("click", event => {
    const actionButton = event.target.closest("#dxDashboard [data-dx-action]");
    if (actionButton) {
      if (!currentUser) return;
      event.preventDefault();
      event.stopPropagation();
      if (actionButton.dataset.dxAction === "search") {
        showDXView("products");
        setTimeout(() => $("dxMarketplaceSearch")?.focus(), 0);
      } else if (actionButton.dataset.dxAction === "sell-account") {
        showDXView("accounts");
        setTimeout(() => $("dxSellerFormWrap")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
      return;
    }
    const viewButton = event.target.closest("#dxBottomNav [data-dx-view], #dxDashboard [data-dx-view]");
    if (viewButton) {
      if (!currentUser) return;
      event.preventDefault();
      event.stopPropagation();
      showDXView(viewButton.dataset.dxView);
      return;
    }
    const link = event.target.closest('a[href="#home"],a[href="#products"],a[href="#accounts"]');
    if (!link || !currentUser) return;
    event.preventDefault();
    event.stopPropagation();
    const href = link.getAttribute("href");
    showDXView(href === "#products" ? "products" : href === "#accounts" ? "accounts" : "home");
    document.getElementById("dxNavLinks")?.classList.remove("open");
  }, true);
}
function showDXView(view) {
  if (!currentUser || !["home","products","accounts","profile"].includes(view)) return;
  dxActiveView = view;
  const dashboard = $("dxDashboard"), home = $("home"), products = $("products"), accounts = $("accounts");
  const cta = document.querySelector(".dx-cta");
  if (dashboard) dashboard.hidden = !["home","profile"].includes(view);
  if (home) home.hidden = true;
  if (products) products.hidden = !["home", "products"].includes(view);
  if (accounts) accounts.hidden = view !== "accounts";
  if (cta) cta.hidden = true;
  const panel = $("dxProfilePanel"); if (panel) panel.hidden = view !== "profile";
  const adminPanel = $("dxAdminPanel");
  if (adminPanel && !window.dxAdminPanelExpanded) adminPanel.style.display = "none";
  const target = view === "products" ? products : view === "accounts" ? accounts : dashboard;
  if (target) window.scrollTo({ top: 0, behavior: "auto" });
  document.querySelectorAll("#dxBottomNav [data-dx-view]").forEach(el => {
    const active = el.dataset.dxView === view;
    el.classList.toggle("active", active);
    if (active) el.setAttribute("aria-current","page"); else el.removeAttribute("aria-current");
  });
}
function updateDXDashboardVisibility() {
  const main = document.querySelector("main");
  const hero = $("home");
  const cta = document.querySelector(".dx-cta");
  if (!main || !hero) return;
  let dashboard = $("dxDashboard");
  if (!dashboard) {
    dashboard = document.createElement("section");
    dashboard.id = "dxDashboard";
    dashboard.innerHTML = `
      <div class="dx-dana-topline">
        <div><small>DX STORE · DIGITAL WALLET EXPERIENCE</small><h1>Halo, <span id="dxDashboardName">Pengguna</span> 👋</h1><p>Semua kebutuhan digitalmu dalam satu tempat.</p></div>
        <div class="dx-dana-avatar">DX</div>
      </div>
      <div id="dxStoreNoticeBanner" hidden role="status" style="margin:14px 0;padding:14px;border:1px solid #51e5ff55;border-radius:12px;background:#102543;color:#eaf5ff"></div>
      <div class="dx-dana-maincard">
        <div class="dx-dana-cardtop"><span>DX STORE</span><span>●●●●  DX-01</span></div>
        <div class="dx-dana-cardtitle">Marketplace Digital</div>
        <p>Temukan produk digital dan akun game pilihan dengan proses pemesanan yang mudah.</p>
        <div class="dx-dana-cardfoot"><span>NEGARA & MATA UANG</span><strong id="dxDashboardCurrency">IDR · Indonesia</strong></div>
      </div>
      <div class="dx-dana-shortcuts">
        <button type="button" data-dx-view="products"><span>▣</span><strong>Produk</strong></button>
        <button type="button" data-dx-view="accounts"><span>🎮</span><strong>Akun Game</strong></button>
        <button type="button" data-dx-action="search"><span>⌕</span><strong>Cari</strong></button>
        <button type="button" data-dx-action="sell-account"><span>＋</span><strong>Jual Akun</strong></button>
      </div>
      <section id="dxProfilePanel" class="dx-profile-page" hidden>
        <div class="dx-wallet-profile-head">
          <div><small>DX STORE · AKUN SAYA</small><h2>Profil</h2><p>Kelola akun dan aktivitas digitalmu.</p></div>
          <div class="dx-profile-avatar" id="dxProfileAvatar">DX</div>
        </div>
        <article class="dx-wallet-member">
          <div class="dx-wallet-member-top"><span>MEMBER DX STORE</span><span class="dx-profile-verified">AKUN</span></div>
          <strong id="dxProfileName">Pengguna</strong>
          <span id="dxAccountEmail">Akun Anda</span>
          <small id="dxProfileMember">Anggota DX STORE</small>
        </article>
        <div class="dx-wallet-shortcuts">
          <button type="button" data-dx-profile-action="orders"><span>▤</span><strong>Pesanan</strong></button>
          <button type="button" data-dx-profile-action="help"><span>♧</span><strong>Bantuan</strong></button>
          <button type="button" data-dx-profile-action="country"><span>◎</span><strong>Wilayah</strong></button>
          <button type="button" data-dx-profile-action="edit"><span>✎</span><strong>Edit profil</strong></button>
        </div>
        <details class="dx-profile-accordion" id="dxProfileEditAccordion"><summary><span><small>PROFIL</small><strong>Data Profil</strong><em>Nama tampilan dan email akun</em></span><b>⌄</b></summary><article class="dx-profile-card dx-wallet-settings" id="dxProfileEdit">
          <div class="dx-profile-card-head"><div><small>INFORMASI PRIBADI</small><h3>Data Profil</h3></div><span>✦</span></div>
          <label for="dxProfileNameInput">Nama tampilan</label>
          <input id="dxProfileNameInput" type="text" maxlength="40" autocomplete="nickname" placeholder="Masukkan nama tampilan">
          <label for="dxProfileEmailInput">Email akun</label>
          <input id="dxProfileEmailInput" type="email" readonly>
          <button type="button" id="dxSaveProfile" class="dx-profile-primary">Simpan perubahan</button>
          <p id="dxProfileMessage" class="dx-profile-message" role="status" aria-live="polite"></p>
        </article></details>
        <details class="dx-profile-accordion" id="dxProfileSettingsAccordion"><summary><span><small>PREFERENSI</small><strong>Pengaturan Akun</strong><em>Negara, mata uang dan bahasa</em></span><b>⌄</b></summary><article class="dx-profile-card dx-profile-menu">
          <div class="dx-profile-card-head"><div><small>PREFERENSI</small><h3>Pengaturan Akun</h3></div><span>⚙</span></div>
          <button type="button" data-dx-profile-action="country"><span class="dx-profile-menu-icon">◎</span><span><strong>Negara, Mata Uang & Bahasa</strong><small id="dxProfileCountry">Sesuaikan preferensi wilayah</small></span><b>›</b></button>
        </article></details>
        <details class="dx-profile-accordion" id="dxOrderAccordion"><summary><span><small>TRANSAKSI</small><strong>Riwayat Pesanan</strong><em>Lihat status dan detail pesanan</em></span><b>⌄</b></summary>
        <section id="dxOrderHistory" class="dx-profile-card"><div class="dx-profile-card-head"><div><small>TRANSAKSI</small><h3>Riwayat Pesanan</h3></div><button type="button" id="dxRefreshOrders">Muat ulang</button></div><div id="dxOrderHistoryList">Memuat pesanan...</div></section></details>
        <details class="dx-profile-accordion" id="dxHelpAccordion"><summary><span><small>DUKUNGAN</small><strong>Pusat Bantuan & Laporan</strong><em>Kirim laporan dan cek balasan admin</em></span><b>⌄</b></summary>
        <section id="dxHelpCenter" class="dx-profile-card"><div class="dx-profile-card-head"><div><small>DUKUNGAN PELANGGAN</small><h3>Pusat Bantuan &amp; Laporan</h3></div><span>?</span></div>
          <form id="dxSupportForm"><label for="dxSupportCategory">Kategori masalah</label><select id="dxSupportCategory" required><option>Pembayaran</option><option>Pesanan</option><option>Garansi</option><option>Produk</option><option>Akun</option><option>Login</option><option>Lainnya</option></select>
          <label for="dxSupportOrder">Nomor pesanan (opsional)</label><input id="dxSupportOrder" type="text" placeholder="Tempel ID pesanan jika ada">
          <label for="dxSupportSubject">Judul laporan</label><input id="dxSupportSubject" type="text" minlength="4" maxlength="120" required placeholder="Ringkas masalah yang dialami">
          <label for="dxSupportMessage">Ceritakan masalah</label><textarea id="dxSupportMessage" minlength="10" maxlength="4000" rows="4" required placeholder="Jelaskan kronologi dan bantuan yang dibutuhkan"></textarea>
          <label for="dxSupportImage">Lampiran gambar (opsional, JPG/PNG/WEBP maks. 5 MB)</label><input id="dxSupportImage" type="file" accept="image/jpeg,image/png,image/webp">
          <button type="submit" id="dxSupportSubmit" class="dx-profile-primary">Kirim Laporan</button><p id="dxSupportFeedback" role="status" aria-live="polite"></p></form>
          <h4>Laporan Saya</h4><div id="dxMyTickets">Memuat laporan...</div></section></details>
        <section id="dxAdminAccessCard" class="dx-admin-access" hidden><div class="dx-admin-access-icon">⚙</div><div class="dx-admin-access-copy"><small>KHUSUS ADMINISTRATOR</small><strong>Pengaturan Website</strong><p>Kelola tampilan toko, produk, pesanan, pengguna, dan laporan dari satu tempat.</p></div><button type="button" id="dxOpenAdmin" hidden><span>⚙</span> Buka Pengaturan Website <b>›</b></button></section><div class="dx-profile-actions"><button type="button" id="dxAccountLogout">Keluar dari Akun</button></div>
        <p class="dx-profile-version">DX STORE · DIGITAL MARKETPLACE</p>
      </section>
      <div class="dx-dana-sectionhead"><div><small>DX MARKETPLACE</small><h2>Jelajahi layanan</h2></div><span>DX-01</span></div>
    `;
    main.insertBefore(dashboard, hero);
  }
  mountDXMascotVoice();
  const storeBanner = $("dxStoreNoticeBanner");
  if (storeBanner && storeBanner.parentElement !== main) main.insertBefore(storeBanner, dashboard);
  const visible = !!currentUser;
  loadDXStoreAvailability();
  dashboard.hidden = !visible;
  hero.hidden = visible;
  if (cta) cta.hidden = visible;
  const name = currentUser?.user_metadata?.display_name || currentUser?.email?.split("@")[0] || "Pengguna";
  const nameNode = $("dxDashboardName");
  if (nameNode) nameNode.textContent = name;
  const currencyNode = $("dxDashboardCurrency");
  if (currencyNode) currencyNode.textContent = getDXCountry().currency + " · " + getDXCountry().name;
  const accountEmail = $("dxAccountEmail");
  if (accountEmail) accountEmail.textContent = currentUser?.email || "Akun Anda";
  const profileName = currentUser?.user_metadata?.display_name || currentUser?.email?.split("@")[0] || "Pengguna";
  if ($("dxProfileName")) $("dxProfileName").textContent = profileName;
  if ($("dxProfileAvatar")) $("dxProfileAvatar").textContent = profileName.trim().slice(0, 2).toUpperCase() || "DX";
  const avatarUrl = safeImageUrl(currentUser?.user_metadata?.avatar_url);
  const avatarNodes = [$("dxProfileAvatar"), document.querySelector(".dx-dana-avatar")].filter(Boolean);
  avatarNodes.forEach(node => {
    node.style.position = "relative";
    node.style.overflow = "hidden";
    let photo = node.querySelector("img.dx-user-avatar-photo");
    if (avatarUrl) {
      if (!photo) {
        photo = document.createElement("img");
        photo.className = "dx-user-avatar-photo";
        photo.alt = "Foto profil";
        photo.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit";
        node.appendChild(photo);
      }
      if (photo.src !== avatarUrl) photo.src = avatarUrl;
      node.textContent = "";
      node.appendChild(photo);
    } else {
      photo?.remove();
      node.textContent = profileName.trim().slice(0, 2).toUpperCase() || "DX";
    }
  });
  const profileEdit = $("dxProfileEdit");
  if (profileEdit && !$("dxProfilePhotoInput")) {
    const photoBox = document.createElement("div");
    photoBox.id = "dxProfilePhotoControl";
    photoBox.style.cssText = "margin:14px 0;padding:14px;border:1px solid #29466f;border-radius:12px;background:#0b1426";
    photoBox.innerHTML = '<label for="dxProfilePhotoInput">Foto profil (JPG, PNG, WEBP · maks. 5 MB)</label><input id="dxProfilePhotoInput" type="file" accept="image/jpeg,image/png,image/webp" style="display:block;width:100%;margin-top:8px;color:white"><p id="dxProfilePhotoMessage" class="dx-profile-message" role="status" aria-live="polite">Foto akan tampil di profil dan beranda setelah berhasil disimpan.</p>';
    $("dxProfileEmailInput")?.insertAdjacentElement("afterend", photoBox);
    $("dxProfilePhotoInput")?.addEventListener("change", async event => {
      const file = event.target.files?.[0];
      const feedback = $("dxProfilePhotoMessage");
      if (!file) return;
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
        event.target.value = "";
        if (feedback) feedback.textContent = "Pilih JPG, PNG, atau WEBP dengan ukuran maksimal 5 MB.";
        return;
      }
      const uploadButton = $("dxSaveProfile");
      if (uploadButton) uploadButton.disabled = true;
      if (feedback) feedback.textContent = "Mengunggah dan menyimpan foto profil...";
      try {
        if (!currentUser || !dxSupabase) throw new Error("Silakan masuk kembali sebelum mengunggah foto.");
        const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
        const path = currentUser.id + "/profile/" + crypto.randomUUID() + "." + ext;
        const { data: stored, error: uploadError } = await dxSupabase.storage
          .from("marketplace-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const publicUrl = dxSupabase.storage.from("marketplace-images").getPublicUrl(stored.path).data.publicUrl;
        const { data, error } = await dxSupabase.auth.updateUser({ data: { avatar_url: publicUrl } });
        if (error) throw error;
        currentUser = data.user || { ...currentUser, user_metadata: { ...currentUser.user_metadata, avatar_url: publicUrl } };
        if (feedback) feedback.textContent = "Foto profil berhasil disimpan dan sudah diterapkan.";
        event.target.value = "";
        updateDXDashboardVisibility();
      } catch (error) {
        if (feedback) feedback.textContent = "Foto gagal disimpan: " + getDXError(error);
      } finally {
        if (uploadButton) uploadButton.disabled = false;
      }
    });
  }
  if ($("dxProfileNameInput") && document.activeElement !== $("dxProfileNameInput")) $("dxProfileNameInput").value = profileName;
  if ($("dxProfileEmailInput")) $("dxProfileEmailInput").value = currentUser?.email || "";
  if ($("dxProfileMember")) $("dxProfileMember").textContent = currentProfile?.created_at ? "Bergabung " + new Date(currentProfile.created_at).toLocaleDateString(getDXCountry().locale, {day:"numeric",month:"long",year:"numeric"}) : "Anggota DX STORE";
  if ($("dxProfileCountry")) $("dxProfileCountry").textContent = getDXCountry().name + " · " + getDXCountry().currency;
  const saveProfileButton = $("dxSaveProfile");
  if (saveProfileButton && !saveProfileButton.dataset.bound) {
    saveProfileButton.addEventListener("click", async () => {
      const nextName = $("dxProfileNameInput")?.value.trim() || "";
      const message = $("dxProfileMessage");
      if (!nextName) { if (message) message.textContent = "Nama tampilan tidak boleh kosong."; return; }
      saveProfileButton.disabled = true;
      saveProfileButton.textContent = "Menyimpan...";
      try {
        const { data, error } = await dxSupabase.auth.updateUser({ data: { display_name: nextName } });
        if (error) throw error;
        currentUser = data.user || { ...currentUser, user_metadata: { ...currentUser.user_metadata, display_name: nextName } };
        if (message) message.textContent = "Profil berhasil diperbarui.";
        updateDXDashboardVisibility();
      } catch (error) {
        if (message) message.textContent = "Gagal menyimpan: " + getDXError(error);
      } finally {
        saveProfileButton.disabled = false;
        saveProfileButton.textContent = "Simpan perubahan";
      }
    });
    saveProfileButton.dataset.bound = "1";
  }
  document.querySelectorAll("[data-dx-profile-action]").forEach(button => {
    if (button.dataset.bound) return;
    button.addEventListener("click", () => {
      const action = button.dataset.dxProfileAction;
      if (action === "country") { $("dxProfileSettingsAccordion").open = true; $("dxProfileSettingsAccordion")?.scrollIntoView({behavior:"smooth",block:"start"}); $("dxCountry")?.focus(); }
      if (action === "orders") { $("dxOrderAccordion").open = true; $("dxOrderHistory")?.scrollIntoView({behavior:"smooth",block:"start"}); loadDXOrderHistory(); }
      if (action === "help") { $("dxHelpAccordion").open = true; $("dxHelpCenter")?.scrollIntoView({behavior:"smooth",block:"start"}); }
      if (action === "edit") { $("dxProfileEditAccordion").open = true; $("dxProfileEdit")?.scrollIntoView({behavior:"smooth",block:"start"}); }
    });
    button.dataset.bound = "1";
  });
  if($("dxRefreshOrders")&&!$("dxRefreshOrders").dataset.bound){$("dxRefreshOrders").addEventListener("click",loadDXOrderHistory);$("dxRefreshOrders").dataset.bound="1";}
  if($("dxSupportForm")&&!$("dxSupportForm").dataset.bound){$("dxSupportForm").addEventListener("submit",submitDXSupportTicket);$("dxSupportForm").dataset.bound="1";}
  if(currentUser){loadDXOrderHistory();loadDXMyTickets();}
  const accountLogout = $("dxAccountLogout");
  if (accountLogout && !accountLogout.dataset.bound) {
    accountLogout.addEventListener("click", handleDXLogout);
    accountLogout.dataset.bound = "1";
  }
  const accountPanel = $("dxProfilePanel");
  const adminPanel = $("dxAdminPanel");
  if (accountPanel && adminPanel && adminPanel.parentElement !== accountPanel) {
    accountPanel.appendChild(adminPanel);
  }
  const adminAccessButton = $("dxOpenAdmin");
  if (adminAccessButton && !adminAccessButton.dataset.bound) {
    adminAccessButton.addEventListener("click", async () => {
      if (!(await checkDXAdmin())) {
        window.dxAdminPanelExpanded = false;
        if (adminPanel) adminPanel.style.display = "none";
        adminAccessButton.hidden = true;
        const card = $("dxAdminAccessCard");
        if (card) card.hidden = true;
        return;
      }
      window.dxAdminPanelExpanded = !window.dxAdminPanelExpanded;
      if (adminPanel) adminPanel.style.display = window.dxAdminPanelExpanded ? "block" : "none";
      adminAccessButton.innerHTML = window.dxAdminPanelExpanded ? "<span>×</span> Tutup Pengaturan Website <b>⌃</b>" : "<span>⚙</span> Buka Pengaturan Website <b>›</b>";
      if (window.dxAdminPanelExpanded) {
        await Promise.all([loadDXAdminList(), loadDXPaymentOrders(), loadDXStoreSettings(), loadDXAdminTickets(), loadDXAdminOverview(), loadDXAdminUsers()]);
        adminPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    adminAccessButton.dataset.bound = "1";
  }
  let bottom = $("dxBottomNav");
  if (!bottom) {
    bottom = document.createElement("nav");
    bottom.id = "dxBottomNav";
    bottom.setAttribute("aria-label","Navigasi utama");
    bottom.innerHTML = '<button type="button" data-dx-view="home"><span>⌂</span><small>Beranda</small></button><button type="button" data-dx-view="products"><span>▣</span><small>Produk</small></button><button type="button" data-dx-view="accounts"><span>🎮</span><small>Akun Game</small></button><button type="button" data-dx-view="profile"><span>◎</span><small>Akun</small></button>';
    document.body.appendChild(bottom);
  }
  bottom.hidden = !visible;
  if (visible) showDXView(dxActiveView);
  applyDXLanguage();
}

/* STATUS TOMBOL HEADER */

function updateDXHeaderAuth() {
  const actions = document.querySelector(".dx-nav-actions");
  const button = actions?.querySelector(".dx-button");
  if (!actions || !button) return;

  button.textContent = currentUser ? "Akun" : "Masuk / Daftar";

  button.onclick = () => {
    if (currentUser) showDXView("profile");
    else openAuth();
  };

  let countrySelect = $("dxCountry");
  if (currentUser && !countrySelect) {
    countrySelect = document.createElement("select");
    countrySelect.id = "dxCountry";
    countrySelect.setAttribute("aria-label", "Pilih negara");
    countrySelect.title = "Ubah negara";
    countrySelect.style.cssText = "min-height:38px;width:82px;max-width:82px;padding:0 6px;border:1px solid rgba(81,229,255,.45);border-radius:10px;background:#101b32;color:#eaf5ff;font:700 12px Inter,sans-serif";
    const countryFlags = { ID:"🇮🇩", MY:"🇲🇾", SG:"🇸🇬", US:"🇺🇸", JP:"🇯🇵", TH:"🇹🇭", PH:"🇵🇭", AU:"🇦🇺", GB:"🇬🇧", DE:"🇩🇪", FR:"🇫🇷", IN:"🇮🇳", KR:"🇰🇷", BR:"🇧🇷", CA:"🇨🇦", CN:"🇨🇳" };
    Object.entries(DX_COUNTRIES).forEach(([code]) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = (countryFlags[code] || "🌐") + " " + code;
      countrySelect.appendChild(option);
    });
    countrySelect.addEventListener("change", () => setDXCountry(countrySelect.value));
    actions.insertBefore(countrySelect, button);
  }

  if (countrySelect) {
    countrySelect.hidden = !currentUser;
    countrySelect.value = getDXCountry().code;
  }
  updateDXDashboardVisibility();
}

/* =========================================
   DX STORE - BAGIAN 2 DARI 5
   PRODUK DIGITAL DAN MARKETPLACE AKUN GAME
========================================= */


/* POPUP AKTIVITAS DX STORE — tampil hanya jika ada transaksi nyata */
let dxPurchaseToastRows = [];
let dxPurchaseToastIndex = 0;
let dxPurchaseToastTimer = null;
let dxPurchaseToastDismissed = false;

async function loadDXRecentPurchaseActivity() {
  const host = document.getElementById("dxPurchaseActivity");
  if (!host) return;

  let purchases = [];
  if (dxSupabase) {
    const { data, error } = await dxSupabase.rpc("dx_public_recent_purchase_activity", { p_limit: 12 });
    if (error) console.warn("Aktivitas pembelian belum dapat dimuat:", error);
    if (Array.isArray(data)) purchases = data;
  }

  // Jangan tampilkan pesan sambutan, data contoh, atau notifikasi palsu.
  // Area notifikasi benar-benar kosong sampai ada pembelian nyata.
  dxPurchaseToastRows = purchases
    .filter(row => row && row.buyer_name && row.item_name)
    .map(row => ({
      kind: "purchase",
      name: row.buyer_name,
      item: row.item_name,
      time: row.purchased_at
        ? new Date(row.purchased_at).toLocaleString(getDXCountry().locale || "id-ID", { dateStyle: "short", timeStyle: "short" })
        : "Baru saja"
    }));

  if (!dxPurchaseToastRows.length) {
    host.replaceChildren();
    host.hidden = true;
    return;
  }

  if (dxPurchaseToastIndex >= dxPurchaseToastRows.length) dxPurchaseToastIndex = 0;
  if (!dxPurchaseToastDismissed) {
    host.hidden = false;
    renderDXPurchaseToast();
  }

  if (!dxPurchaseToastTimer) {
    dxPurchaseToastTimer = setInterval(() => {
      const currentHost = document.getElementById("dxPurchaseActivity");
      if (!currentHost || currentHost.hidden || dxPurchaseToastDismissed || dxPurchaseToastRows.length < 2) return;
      dxPurchaseToastIndex = (dxPurchaseToastIndex + 1) % dxPurchaseToastRows.length;
      renderDXPurchaseToast();
    }, 4800);
  }
}

function renderDXPurchaseToast() {
  const host = document.getElementById("dxPurchaseActivity");
  const row = dxPurchaseToastRows[dxPurchaseToastIndex];
  if (!host || !row || row.kind !== "purchase" || dxPurchaseToastDismissed) return;

  // Satu kartu diganti dengan kartu berikutnya; tidak pernah menumpuk.
  host.innerHTML = `<div class="dx-toast-card" role="status" aria-live="polite">
    <span class="dx-toast-mark">DX</span>
    <div class="dx-toast-copy">
      <strong>${safeText(row.name)}</strong>
      <p>Baru membeli ${safeText(row.item)}</p>
      <small>${safeText(row.time)} · Pembelian tercatat</small>
    </div>
    <button class="dx-toast-close" type="button" aria-label="Tutup notifikasi">×</button>
  </div>`;
  host.querySelector(".dx-toast-close")?.addEventListener("click", () => {
    dxPurchaseToastDismissed = true;
    host.replaceChildren();
    host.hidden = true;
  });
}


async function fetchDXPublicRows(table) {
  if (!["products", "account_listings"].includes(table)) throw new Error("Tabel katalog tidak valid.");
  let sdkError = null;
  if (dxSupabase) {
    try {
      const { data, error } = await dxSupabase.from(table).select("*").eq("status", "active").order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) return data;
      sdkError = error;
    } catch (error) { sdkError = error; }
  }
  try {
    const response = await fetch(`${DX_CONFIG.supabaseUrl}/rest/v1/${table}?select=*&status=eq.active&order=created_at.desc`, {
      headers: { apikey: DX_CONFIG.supabaseKey, Authorization: `Bearer ${DX_CONFIG.supabaseKey}` },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`REST HTTP ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Format data katalog tidak valid.");
    return rows;
  } catch (restError) {
    console.error("Katalog gagal dimuat melalui SDK dan REST:", sdkError, restError);
    throw restError;
  }
}

async function loadProducts() {
  const grid = $("productGrid");
  if (!grid) return;
  grid.innerHTML = "<p>Memuat produk...</p>";
  try {
    const data = await fetchDXPublicRows("products");
    if (!data.length) { grid.innerHTML = "<p>Belum ada produk digital.</p>"; return; }
    grid.innerHTML = data.map(item => {
      const image = safeImageUrl(item.image_url);
      return `<article class="product-card">
        ${image ? `<img src="${safeText(image)}" alt="${safeText(item.name)}" loading="lazy" onerror="this.alt='Foto produk tidak dapat dimuat';this.removeAttribute('src');this.classList.add('dx-image-error')">` : '<div class="dx-product-image-placeholder">Foto produk belum tersedia</div>'}
        <div class="product-info">
          <h3>${safeText(item.name)}</h3><p>${safeText(item.description || "")}</p>
          <strong>${formatPrice(item.price)}</strong>
          ${Number(item.warranty_days ?? 7) > 0 ? `<p class="dx-product-warranty">🛡️ Garansi ${Number(item.warranty_days ?? 7)} hari</p>` : '<p class="dx-product-warranty">Tanpa garansi</p>'}
          ${item.sale_status === "pending" ? '<span class="dx-stock-status">PENDING — SEDANG DIPESAN</span>' : item.sale_status === "sold_out" ? '<span class="dx-stock-status dx-sold-out">SOLD OUT</span>' : ''}
          <button class="dx-button" type="button" ${item.sale_status !== "available" ? "disabled" : ""} onclick="selectItem('product','${safeText(item.id)}')">${item.sale_status === "pending" ? "Sedang Dipesan" : item.sale_status === "sold_out" ? "Habis Terjual" : "Lihat Produk"}</button>
        </div></article>`;
    }).join("");
    applyDXLanguage();
  } catch (error) {
    grid.innerHTML = "<p>Produk gagal dimuat. Silakan muat ulang halaman.</p>";
    console.error("Gagal memuat produk:", error);
  }
}

async function loadAccountListings() {
  const grid = $("accountGrid");
  if (!grid) return;
  grid.innerHTML = "<p>Memuat akun game...</p>";
  try {
    const data = await fetchDXPublicRows("account_listings");
    if (!data.length) { grid.innerHTML = "<p>Belum ada akun game yang disetujui admin.</p>"; return; }
    grid.innerHTML = data.map(item => {
      const image = safeImageUrl(item.image_url);
      return `<article class="product-card">
        ${image ? `<img src="${safeText(image)}" alt="${safeText(item.title)}" loading="lazy" onerror="this.alt='Foto akun tidak dapat dimuat';this.removeAttribute('src');this.classList.add('dx-image-error')">` : '<div class="dx-product-image-placeholder">Foto akun belum tersedia</div>'}
        <div class="product-info"><h3>${safeText(item.title)}</h3><p>${safeText(item.description || "")}</p>
          <strong>${formatPrice(item.price)}</strong>
          ${item.sale_status === "pending" ? '<span class="dx-stock-status">PENDING — SEDANG DIPESAN</span>' : item.sale_status === "sold_out" ? '<span class="dx-stock-status dx-sold-out">SOLD OUT</span>' : ''}
          <button class="dx-button" type="button" ${item.sale_status !== "available" ? "disabled" : ""} onclick="selectItem('account','${safeText(item.id)}')">${item.sale_status === "pending" ? "Sedang Dipesan" : item.sale_status === "sold_out" ? "Habis Terjual" : "Lihat Akun"}</button>
        </div></article>`;
    }).join("");
    applyDXLanguage();
  } catch (error) {
    grid.innerHTML = "<p>Akun game gagal dimuat. Silakan muat ulang halaman.</p>";
    console.error("Gagal memuat akun:", error);
  }
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
        modal.innerHTML = '<section class="dx-detail-panel" role="dialog" aria-modal="true" aria-labelledby="dxDetailName"><button type="button" class="dx-detail-close" aria-label="Tutup">&times;</button><div id="dxDetailPhoto" class="dx-detail-photo"></div><div class="dx-detail-copy"><span id="dxDetailType" class="dx-detail-label"></span><h2 id="dxDetailName"></h2><p id="dxDetailDescription"></p><strong id="dxDetailPrice" class="dx-detail-price"></strong><div id="dxDetailWarranty" class="dx-detail-warranty"></div><button type="button" id="dxDetailOrder" class="dx-button">Lanjutkan</button></div></section>';
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
      const warrantyBox = modal.querySelector("#dxDetailWarranty");
      if (type === "product") {
        const days = Number(data.warranty_days ?? 7);
        warrantyBox.innerHTML = days > 0
          ? '<strong>🛡️ Garansi resmi DX STORE · ' + days + ' hari</strong><p>' + safeText(data.warranty_terms || "Ajukan klaim melalui Pusat Bantuan dengan ID pesanan.") + '</p>'
          : '<strong>Produk ini tidak memiliki garansi.</strong>';
      } else {
        warrantyBox.innerHTML = "";
      }
      modal.querySelector("#dxDetailPhoto").innerHTML = image ? '<img src="' + safeText(image) + '" alt="' + safeText(name) + '">' : '<span>DX STORE</span>';
      const unavailable = data.status !== "active" || (data.sale_status || "available") !== "available";
      modal.querySelector("#dxDetailOrder").disabled = unavailable;
      modal.querySelector("#dxDetailOrder").textContent = data.sale_status === "pending" ? "PENDING — SEDANG DIPESAN" : data.sale_status === "sold_out" ? "SOLD OUT" : "Lanjutkan";
      modal.querySelector("#dxDetailOrder").onclick = () => {
        if (unavailable) return;
        modal.classList.remove("active");
        if (!currentUser) {
          openAuth();
          showDXMessage("Masuk atau daftar untuk melanjutkan pemesanan.");
          return;
        }
        openDXCheckout(type, data);
      };
      modal.classList.add("active");
    });
}

/* CHECKOUT QRIS MANUAL DX STORE
   Nominal pesanan diambil dari backend; pembeli memasukkannya sendiri
   saat membayar melalui QRIS statis. Bukti diverifikasi admin.
*/
function createDXCheckoutModal() {
  let modal = $("dxCheckoutModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "dxCheckoutModal";
  modal.className = "dx-checkout-overlay";
  modal.innerHTML = `
    <section class="dx-checkout-panel" role="dialog" aria-modal="true" aria-labelledby="dxCheckoutTitle">
      <button type="button" class="dx-checkout-close" aria-label="Tutup">&times;</button>
      <header class="dx-checkout-brand">
        <div class="dx-checkout-logo">DX <span>STORE</span></div>
        <small>GAME TOP UP &amp; DIGITAL PRODUCT</small>
      </header>
      <div class="dx-checkout-banner">
        <span class="dx-checkout-qr-icon">▦</span>
        <div><h2 id="dxCheckoutTitle">Pembayaran QRIS Manual</h2><p>Scan QRIS, lalu masukkan nominal sesuai total pesanan</p></div>
      </div>
      <div class="dx-checkout-main">
        <div class="dx-checkout-qr" id="dxCheckoutQr">
          <div class="dx-checkout-qr-placeholder">QRIS<br>AKAN MUNCUL<br>SETELAH TRANSAKSI DIBUAT</div>
        </div>
        <div class="dx-checkout-details">
          <small>Barang yang dibeli</small>
          <strong id="dxCheckoutItem">-</strong>
          <small>Nominal Pembayaran</small>
          <strong class="dx-checkout-amount" id="dxCheckoutAmount">Rp0</strong>
          <small>Status Pembayaran</small>
          <div class="dx-checkout-status" id="dxCheckoutStatus">Menunggu pembuatan transaksi</div>
          <small>Metode Pembayaran</small>
          <strong id="dxCheckoutExpiry">-</strong>
        </div>
      </div>
      <p class="dx-checkout-note" id="dxCheckoutMessage" aria-live="polite">QRIS DANA Bisnis statis. Masukkan nominal yang tertera saat membayar; admin akan memeriksa pembayaran secara manual.</p>
      <div class="dx-checkout-proof" style="margin:16px 0;display:grid;gap:10px">
        <label for="dxPaymentProof">Unggah bukti pembayaran (JPG/PNG, maks. 4 MB)</label>
        <input id="dxPaymentProof" type="file" accept="image/jpeg,image/png" disabled>
        <button type="button" class="dx-button" id="dxSubmitProof" disabled>Kirim Bukti Pembayaran</button>
      </div>
      <div class="dx-checkout-actions">
        <button type="button" class="dx-button" id="dxCreatePayment">Buat Pesanan</button>
        <button type="button" class="dx-button dx-checkout-secondary" id="dxCheckPayment" disabled>↻ Cek Status Pesanan</button>
      </div>
      <div class="dx-checkout-instructions">
        <strong>Petunjuk Pembayaran</strong>
        <ol>
          <li>Periksa nominal total pesanan yang ditampilkan DX STORE.</li>
          <li>Buka aplikasi pembayaran yang mendukung QRIS.</li>
          <li>Scan QRIS DX STORE dan masukkan nominal tersebut secara manual dengan tepat.</li>
          <li>Unggah bukti pembayaran. Pesanan baru dinyatakan lunas setelah admin memeriksa dana masuk.</li>
        </ol>
      </div>
      <button type="button" class="dx-checkout-close-link">Tutup</button>
    </section>`;

  const style = document.createElement("style");
  style.id = "dxCheckoutStyles";
  style.textContent = `
    .dx-checkout-overlay{position:fixed;inset:0;z-index:1200;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.9);backdrop-filter:blur(12px);overflow:auto}
    .dx-checkout-overlay.active{display:flex}
    .dx-checkout-panel{position:relative;width:min(900px,100%);max-height:94vh;overflow:auto;padding:25px;border:1px solid #278dff;border-radius:24px;background:radial-gradient(circle at 0 0,rgba(20,115,255,.18),transparent 35%),radial-gradient(circle at 100% 20%,rgba(128,45,255,.18),transparent 35%),#071126;color:#f5f7ff;box-shadow:0 0 45px rgba(20,130,255,.18)}
    .dx-checkout-close{position:absolute;top:14px;right:16px;width:38px;height:38px;border:1px solid #38527d;border-radius:12px;background:#111d39;color:#fff;font-size:25px}
    .dx-checkout-brand{display:flex;align-items:center;gap:18px;margin-bottom:22px}
    .dx-checkout-logo{font-size:28px;font-weight:900;font-style:italic;color:#28caff}.dx-checkout-logo span{color:#bd6cff}
    .dx-checkout-brand small{padding-left:18px;border-left:1px solid #7890bd;color:#dce6ff;font-size:12px}
    .dx-checkout-banner{display:flex;align-items:center;gap:18px;padding:18px 22px;border:1px solid #5e6dff;border-radius:17px;background:linear-gradient(105deg,#155eea,#7414db);margin-bottom:25px}
    .dx-checkout-qr-icon{font-size:38px}.dx-checkout-banner h2{font-size:25px;margin:0 0 5px}.dx-checkout-banner p{margin:0;color:#e5eaff;font-size:13px}
    .dx-checkout-main{display:grid;grid-template-columns:minmax(210px,1fr) minmax(220px,1fr);gap:28px;align-items:center}
    .dx-checkout-qr{min-height:260px;display:grid;place-items:center;padding:18px;border:2px dashed #526caa;border-radius:18px;background:#fff;color:#667085;text-align:center}
    .dx-checkout-qr img{width:min(100%,300px);max-height:300px;object-fit:contain}
    .dx-checkout-qr-placeholder{font-size:15px;font-weight:800;line-height:1.8}
    .dx-checkout-details{display:grid;gap:8px}.dx-checkout-details small{color:#9eb1d6;font-size:12px;margin-top:8px}.dx-checkout-details strong{overflow-wrap:anywhere}.dx-checkout-amount{font-size:clamp(30px,5vw,43px);color:#fff}.dx-checkout-status{padding:12px;border:1px solid #eab308;border-radius:12px;color:#facc15;background:rgba(120,75,0,.2);font-weight:700}
    .dx-checkout-note{margin:20px 0;padding:13px;border:1px solid #30466f;border-radius:12px;color:#c4d3ee;font-size:13px;line-height:1.6}
    .dx-checkout-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px}.dx-checkout-actions button{min-height:48px;border:0;border-radius:12px;color:#fff;font-weight:800;background:linear-gradient(100deg,#087eea,#8618d5)}.dx-checkout-actions button:disabled{opacity:.45;cursor:not-allowed}.dx-checkout-actions .dx-checkout-secondary{background:#182747;border:1px solid #46618f}
    .dx-checkout-instructions{margin-top:22px;padding:18px;border:1px solid #344a75;border-radius:14px;color:#cbd8f1;font-size:13px;line-height:1.8}.dx-checkout-instructions strong{color:#36caff}.dx-checkout-instructions ol{padding-left:20px;margin-top:8px}
    .dx-checkout-close-link{display:block;margin:16px auto 0;border:0;background:transparent;color:#9bb7e8}
    @media(max-width:620px){.dx-checkout-panel{padding:18px}.dx-checkout-brand{display:block}.dx-checkout-brand small{display:block;margin-top:7px;padding:0;border:0}.dx-checkout-main{grid-template-columns:1fr}.dx-checkout-qr{min-height:220px}.dx-checkout-actions{grid-template-columns:1fr}.dx-checkout-banner{padding:14px}.dx-checkout-banner h2{font-size:20px}}
  `;
  document.head.appendChild(style);
  document.body.appendChild(modal);

  const close = () => modal.classList.remove("active");
  modal.querySelector(".dx-checkout-close").addEventListener("click", close);
  modal.querySelector(".dx-checkout-close-link").addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  return modal;
}

function openDXCheckout(type, item) {
  const modal = createDXCheckoutModal();
  const itemName = item.name || item.title || "Item DX STORE";
  const amount = Number(item.price);
  modal.dataset.itemType = type;
  modal.dataset.itemId = String(item.id);
  modal.dataset.itemAmount = String(Number(item.price) || 0);
  modal.dataset.orderId = "";
  $("dxCheckoutItem").textContent = itemName;
  $("dxCheckoutAmount").textContent = formatPrice(amount);
  $("dxCheckoutExpiry").textContent = "-";
  $("dxCheckoutStatus").textContent = "Menunggu pembuatan transaksi";
  $("dxCheckoutQr").innerHTML = '<div class="dx-checkout-qr-placeholder">QRIS DANA BISNIS<br>AKAN MUNCUL SETELAH PESANAN DIBUAT</div>';
  $("dxCheckoutMessage").textContent = "Pembayaran QRIS manual. Admin akan memeriksa bukti pembayaran.";
  $("dxCreatePayment").disabled = false;
  $("dxCheckPayment").disabled = true;
  $("dxPaymentProof").value = "";
  $("dxPaymentProof").disabled = true;
  $("dxSubmitProof").disabled = true;
  $("dxSubmitProof").textContent = "Kirim Bukti Pembayaran";
  $("dxCreatePayment").onclick = createDXPayment;
  $("dxCheckPayment").onclick = checkDXPaymentStatus;
  $("dxSubmitProof").onclick = submitDXPaymentProof;
  modal.classList.add("active");
}

async function createDXPayment() {
  const modal = $("dxCheckoutModal");
  const base = DX_CONFIG.paymentApiUrl;
  if (!base) { $("dxCheckoutMessage").textContent = "Server pesanan belum dikonfigurasi."; return; }
  const button = $("dxCreatePayment");
  button.disabled = true;
  button.textContent = "Membuat pesanan...";
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    if (!session?.access_token) throw new Error("Silakan masuk terlebih dahulu.");
    const response = await fetch(new URL("api/payments/create", base + "/"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": DX_CONFIG.supabaseKey, "Authorization": "Bearer " + session.access_token },
      body: JSON.stringify({ itemType: modal.dataset.itemType, itemId: modal.dataset.itemId })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Pesanan gagal dibuat.");
    if (!result.orderId || !Number.isFinite(Number(result.amount))) throw new Error("Data pesanan dari server tidak lengkap.");
    modal.dataset.orderId = result.orderId;
    $("dxCheckoutAmount").textContent = formatPrice(result.amount);
    $("dxCheckoutStatus").textContent = "Menunggu pembayaran";
    $("dxCheckoutQr").innerHTML = '<img src="payment-qris.png" alt="QRIS resmi DANA Bisnis DX STORE">';
    $("dxCheckoutExpiry").textContent = "QRIS statis · pembayaran manual";
    $("dxCheckoutMessage").textContent = "Total pesanan: " + formatPrice(result.amount) + ". Scan QRIS statis DX STORE, masukkan nominal ini secara manual, lalu unggah bukti pembayaran. Admin akan memeriksa pembayaran sebelum pesanan dinyatakan lunas.";
    $("dxPaymentProof").disabled = false;
    $("dxSubmitProof").disabled = false;
    $("dxCheckPayment").disabled = false;
    button.disabled = true;
    button.textContent = "Pesanan Dibuat";
    window.dispatchEvent(new CustomEvent("dx:order-update", { detail: { status: "pending" } }));
  } catch (error) {
    $("dxCheckoutMessage").textContent = getDXError(error);
    button.disabled = false;
    button.textContent = "Buat Pesanan";
  }
}

async function submitDXPaymentProof() {
  const modal = $("dxCheckoutModal");
  const file = $("dxPaymentProof")?.files?.[0];
  const orderId = modal.dataset.orderId;
  if (!orderId) { $("dxCheckoutMessage").textContent = "Buat pesanan terlebih dahulu."; return; }
  if (!file || !["image/jpeg", "image/png"].includes(file.type) || file.size > 4 * 1024 * 1024) {
    $("dxCheckoutMessage").textContent = "Pilih bukti JPG/PNG dengan ukuran maksimal 4 MB.";
    return;
  }
  const button = $("dxSubmitProof");
  button.disabled = true; button.textContent = "Mengirim bukti...";
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    if (!session?.access_token) throw new Error("Sesi login berakhir. Silakan masuk kembali.");
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = currentUser.id + "/" + orderId + "." + ext;
    const upload = await dxSupabase.storage.from("payment-proofs").upload(path, file, { upsert: true, contentType: file.type });
    if (upload.error) throw upload.error;
    const response = await fetch(new URL("api/payments/submit-proof", DX_CONFIG.paymentApiUrl + "/"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": DX_CONFIG.supabaseKey, "Authorization": "Bearer " + session.access_token },
      body: JSON.stringify({ orderId, proofPath: path })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Bukti pembayaran gagal dikirim.");
    $("dxCheckoutStatus").textContent = "Menunggu pemeriksaan admin";
    $("dxCheckoutMessage").textContent = "Bukti diterima. Pesanan belum lunas sampai admin memeriksa dana masuk.";
    $("dxPaymentProof").disabled = true;
    window.dispatchEvent(new CustomEvent("dx:order-update", { detail: { status: "proof" } }));
  } catch (error) {
    $("dxCheckoutMessage").textContent = getDXError(error);
    button.disabled = false;
  } finally {
    button.textContent = button.disabled ? "Bukti Terkirim" : "Kirim Bukti Pembayaran";
  }
}

async function checkDXPaymentStatus() {
  const modal = $("dxCheckoutModal");
  const base = DX_CONFIG.paymentApiUrl;
  if (!base || !modal.dataset.orderId) return;
  const button = $("dxCheckPayment");
  button.disabled = true; button.textContent = "Memeriksa...";
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    const response = await fetch(new URL("api/payments/status?orderId=" + encodeURIComponent(modal.dataset.orderId), base + "/"), {
      headers: { "apikey": DX_CONFIG.supabaseKey, "Authorization": "Bearer " + session?.access_token }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Status pesanan gagal diperiksa.");
    const labels = { pending: "Menunggu pembayaran", review: "Menunggu pemeriksaan admin", paid: "LUNAS", rejected: "Bukti ditolak" };
    $("dxCheckoutStatus").textContent = labels[result.status] || result.status;
    window.dispatchEvent(new CustomEvent("dx:order-update", { detail: { status: result.status } }));
    $("dxCheckoutMessage").textContent = result.status === "paid"
      ? "Pembayaran telah diverifikasi oleh admin."
      : result.status === "rejected"
        ? "Bukti pembayaran ditolak. Hubungi admin DX STORE."
        : "Status terbaru: " + $("dxCheckoutStatus").textContent;
  } catch (error) { $("dxCheckoutMessage").textContent = getDXError(error); }
  finally { button.disabled = false; button.textContent = "↻ Cek Status Pesanan"; }
}

function subscribeDXProductUpdates() {
  if (!dxSupabase || window.__dxProductRealtimeChannel) return;

  window.__dxProductRealtimeChannel = dxSupabase
    .channel("dx-public-product-catalog")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products" },
      () => loadProducts()
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn("Pembaruan katalog realtime belum tersambung:", status);
      }
    });
}

async function loadDXStore() {
  subscribeDXProductUpdates();
  await Promise.all([
    loadProducts(),
    loadAccountListings()
  ]);
}



/* DX ACCOUNT SERVICES */
async function loadDXOrderHistory(){
 const host=$("dxOrderHistoryList");if(!host||!dxSupabase||!currentUser)return;
 host.textContent="Memuat pesanan...";
 const {data,error}=await dxSupabase.from("orders").select("id,item_name,total_amount,status,created_at").eq("buyer_id",currentUser.id).order("created_at",{ascending:false}).limit(50);
 if(error){host.textContent="Riwayat gagal dimuat: "+getDXError(error);return;}
 if(!data?.length){host.textContent="Belum ada pesanan.";return;}
 host.innerHTML=data.map(o=>`<article class="dx-ticket-card"><b>${safeText(o.item_name||"Pesanan DX STORE")}</b><p>No. ${safeText(o.id)}</p><p>${formatPrice(o.total_amount)} · ${safeText(o.status)}</p><small>${new Date(o.created_at).toLocaleString(getDXCountry().locale||"id-ID")}</small></article>`).join("");
}
async function submitDXSupportTicket(event){
 event.preventDefault();if(!currentUser||!dxSupabase)return;
 const btn=$("dxSupportSubmit"),feedback=$("dxSupportFeedback"),order=$("dxSupportOrder").value.trim();
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(order&&!uuid.test(order)){feedback.textContent="ID pesanan tidak valid.";return;}
 const category=$("dxSupportCategory").value;
 if(category==="Garansi"){
  if(!order){feedback.textContent="ID pesanan wajib diisi untuk klaim garansi.";return;}
  const {data:purchase,error:purchaseError}=await dxSupabase.from("orders").select("id,item_type,item_id,status,created_at").eq("id",order).eq("buyer_id",currentUser.id).maybeSingle();
  if(purchaseError||!purchase){feedback.textContent="Pesanan tidak ditemukan pada akun ini.";return;}
  if(purchase.status!=="paid"||purchase.item_type!=="product"||!purchase.item_id){feedback.textContent="Garansi hanya untuk produk resmi DX STORE yang sudah dibayar.";return;}
  const {data:product,error:productError}=await dxSupabase.from("products").select("warranty_days").eq("id",purchase.item_id).maybeSingle();
  if(productError||!product||Number(product.warranty_days??7)<=0){feedback.textContent="Produk ini tidak memiliki garansi.";return;}
  const expiresAt=new Date(purchase.created_at).getTime()+Number(product.warranty_days??7)*86400000;
  if(Date.now()>expiresAt){feedback.textContent="Masa garansi pesanan ini sudah berakhir.";return;}
 }
 btn.disabled=true;
 try{
  const image=$("dxSupportImage")?.files?.[0];let imagePath=null;
  if(image){
   if(!["image/jpeg","image/png","image/webp"].includes(image.type)||image.size>5*1024*1024)throw new Error("Lampiran harus JPG, PNG, atau WEBP maksimal 5 MB.");
   const ext=image.type==="image/jpeg"?"jpg":image.type==="image/png"?"png":"webp";
   imagePath=currentUser.id+"/"+crypto.randomUUID()+"."+ext;
   const {error:uploadError}=await dxSupabase.storage.from("support-attachments").upload(imagePath,image,{contentType:image.type,upsert:false});
   if(uploadError)throw uploadError;
  }
  const payload={user_id:currentUser.id,category:$("dxSupportCategory").value,subject:$("dxSupportSubject").value.trim(),message:$("dxSupportMessage").value.trim(),order_id:order||null,image_path:imagePath};
  const {data,error}=await dxSupabase.from("support_tickets").insert(payload).select("id").single();
  if(error){if(imagePath)await dxSupabase.storage.from("support-attachments").remove([imagePath]);throw error;}
  $("dxSupportForm").reset();feedback.textContent="Laporan terkirim. Nomor tiket: "+data.id;await loadDXMyTickets();
 }catch(e){feedback.textContent="Gagal mengirim laporan: "+getDXError(e);}
 finally{btn.disabled=false;}
}
async function loadDXMyTickets(){
 const host=$("dxMyTickets");if(!host||!currentUser||!dxSupabase)return;
 host.textContent="Memuat laporan...";
 const {data,error}=await dxSupabase.from("support_tickets").select("id,category,subject,message,status,admin_reply,image_path,created_at").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(30);
 if(error){host.textContent="Laporan gagal dimuat: "+getDXError(error);return;}
 const cards=await Promise.all((data||[]).map(async t=>{let imageLink="";if(t.image_path){const {data:signed}=await dxSupabase.storage.from("support-attachments").createSignedUrl(t.image_path,300);if(signed?.signedUrl)imageLink=`<p><a href="${safeText(signed.signedUrl)}" target="_blank" rel="noopener">Lihat lampiran</a></p>`;}return `<article class="dx-ticket-card"><b>${safeText(t.subject)}</b><p>${safeText(t.category)} · ${safeText(t.status)}</p><small>No. tiket: ${safeText(t.id)}</small><p>${safeText(t.message)}</p>${imageLink}${t.admin_reply?`<p><b>Balasan admin:</b> ${safeText(t.admin_reply)}</p>`:"<p>Menunggu balasan admin.</p>"}</article>`;}));host.innerHTML=cards.join("")||"Belum ada laporan.";
}
async function loadDXAdminTickets(){
 const host=$("dxAdminTickets");if(!host||!currentUser||!(await checkDXAdmin()))return;
 host.textContent="Memuat laporan...";
 const {data,error}=await dxSupabase.from("support_tickets").select("id,user_id,order_id,category,subject,message,status,admin_reply,image_path,created_at").order("created_at",{ascending:false}).limit(100);
 if(error){host.textContent="Gagal memuat laporan: "+getDXError(error);return;}
 const cards=await Promise.all((data||[]).map(async t=>{let imageLink="";if(t.image_path){const {data:signed}=await dxSupabase.storage.from("support-attachments").createSignedUrl(t.image_path,300);if(signed?.signedUrl)imageLink=`<p><a href="${safeText(signed.signedUrl)}" target="_blank" rel="noopener">Lihat lampiran</a></p>`;}return `<article class="dx-ticket-card"><b>${safeText(t.subject)}</b><p>${safeText(t.category)} · ${safeText(t.status)}</p><small>${safeText(t.user_id)} · ${new Date(t.created_at).toLocaleString("id-ID")}</small>${t.order_id?`<p>Pesanan: ${safeText(t.order_id)}</p>`:""}<p>${safeText(t.message)}</p>${imageLink}<label>Balasan admin</label><textarea id="dxReply-${safeText(t.id)}" rows="3" maxlength="4000">${safeText(t.admin_reply||"")}</textarea><label>Status</label><select id="dxTicketStatus-${safeText(t.id)}"><option ${t.status==="Menunggu"?"selected":""}>Menunggu</option><option ${t.status==="Sedang Ditangani"?"selected":""}>Sedang Ditangani</option><option ${t.status==="Menunggu Informasi Pengguna"?"selected":""}>Menunggu Informasi Pengguna</option><option ${t.status==="Selesai"?"selected":""}>Selesai</option><option ${t.status==="Ditolak"?"selected":""}>Ditolak</option></select><button type="button" data-dx-ticket-save="${safeText(t.id)}">Simpan Balasan &amp; Status</button></article>`;}));host.innerHTML=cards.join("")||"Belum ada laporan.";
}
async function updateDXAdminTicket(id){
 if(!currentUser||!(await checkDXAdmin()))return;
 const patch={admin_reply:$("dxReply-"+id)?.value.trim()||null,status:$("dxTicketStatus-"+id)?.value,updated_at:new Date().toISOString()};
 const {error}=await dxSupabase.from("support_tickets").update(patch).eq("id",id);if(error){alert(getDXError(error));return;}await loadDXAdminTickets();
}
async function loadDXStoreSettings(){
 if(!currentUser||!(await checkDXAdmin()))return;
 const {data,error}=await dxSupabase.from("store_settings").select("*").eq("id",true).single();
 if(error){$("dxStoreStatus").textContent=getDXError(error);return;}
 $("dxStoreOpen").checked=data.is_open;$("dxStoreMaintenance").checked=data.maintenance_mode;$("dxStoreOpening").value=String(data.opening_time).slice(0,5);$("dxStoreClosing").value=String(data.closing_time).slice(0,5);$("dxStoreTimezone").value=data.timezone||"Asia/Jakarta";$("dxStoreNotice").value=data.notice||"";
 $("dxStoreStatus").textContent=(data.is_open&&!data.maintenance_mode?"Toko menerima pesanan.":"Pesanan sedang ditutup.")+" Jadwal "+String(data.opening_time).slice(0,5)+"–"+String(data.closing_time).slice(0,5)+" "+data.timezone;
}
async function saveDXStoreSettings(event){
 event.preventDefault();if(!currentUser||!(await checkDXAdmin()))return;
 const btn=$("dxStoreSave"),feedback=$("dxStoreFeedback");btn.disabled=true;
 try{const patch={is_open:$("dxStoreOpen").checked,maintenance_mode:$("dxStoreMaintenance").checked,opening_time:$("dxStoreOpening").value,closing_time:$("dxStoreClosing").value,timezone:$("dxStoreTimezone").value,notice:$("dxStoreNotice").value.trim()||null,updated_by:currentUser.id,updated_at:new Date().toISOString()};
 const {error}=await dxSupabase.from("store_settings").update(patch).eq("id",true);if(error)throw error;feedback.textContent="Pengaturan tersimpan.";await loadDXStoreSettings();await loadDXStoreAvailability();
 }catch(e){feedback.textContent="Gagal menyimpan: "+getDXError(e);}finally{btn.disabled=false;}
}
async function loadDXStoreAvailability(){
 const banner=$("dxStoreNoticeBanner");if(!banner||!dxSupabase)return;
 const {data,error}=await dxSupabase.from("store_settings").select("is_open,maintenance_mode,opening_time,closing_time,timezone,notice").eq("id",true).maybeSingle();if(error||!data){banner.hidden=true;return;}
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:data.timezone||"Asia/Jakarta",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());const now=Number(parts.find(p=>p.type==="hour")?.value||0)*60+Number(parts.find(p=>p.type==="minute")?.value||0);const [oh,om]=String(data.opening_time).slice(0,5).split(":").map(Number);const [ch,cm]=String(data.closing_time).slice(0,5).split(":").map(Number);const open=oh*60+om,close=ch*60+cm;const inHours=open<=close?now>=open&&now<close:now>=open||now<close;const active=data.is_open&&!data.maintenance_mode&&inHours;banner.hidden=false;banner.textContent=(data.notice?data.notice+" · ":"")+(active?"Toko menerima pesanan.":"Toko sedang tidak menerima pesanan.")+" Jam operasional "+String(data.opening_time).slice(0,5)+"–"+String(data.closing_time).slice(0,5)+" ("+data.timezone+").";
}
async function loadDXAdminOverview(){
 const host=$("dxAdminOverview");if(!host||!currentUser||!(await checkDXAdmin()))return;
 const tables=[["profiles","Pengguna"],["orders","Pesanan"],["products","Produk"],["support_tickets","Laporan"]];
 const counts=await Promise.all(tables.map(async([table,label])=>{const {count,error}=await dxSupabase.from(table).select("*",{count:"exact",head:true});return {label,count,error};}));
 host.innerHTML=counts.map(x=>`<span class="dx-admin-stat"><b>${x.error?"—":x.count}</b><small>${x.label}</small></span>`).join("");
}
async function loadDXAdminUsers(){
 const host=$("dxAdminUsers");if(!host||!currentUser||!(await checkDXAdmin()))return;
 const {data,error}=await dxSupabase.from("profiles").select("id,display_name,role,created_at").order("created_at",{ascending:false}).limit(100);
 if(error){host.textContent=getDXError(error);return;}
 host.innerHTML=(data||[]).map(u=>`<article class="dx-ticket-card"><b>${safeText(u.display_name||"Pengguna")}</b><p>${safeText(u.role)}</p><small>${safeText(u.id)}</small></article>`).join("")||"Belum ada pengguna.";
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
    if (currentProfile) currentProfile.role = "user";
    return false;
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

/* Obsolete duplicate removed: setupDXAuthSwitch */

/* PROSES LOGIN DAN REGISTRASI */

async /* Obsolete duplicate removed: handleAuthSubmit */

/* PERBARUI STATUS LOGIN */

async /* Obsolete duplicate removed: refreshDXUser */



/* DX-01 VOICE ASSISTANT */
const DX_MASCOT_LINES = {
  ID: {welcome:"Halo! Aku DX-01, maskot resmi DX STORE. Selamat datang! Aku siap membantu kamu menjelajahi produk dan akun game.",help:"Kamu bisa menjelajahi Produk Digital atau Akun Game dari navigasi. Buka menu Akun untuk pengaturan akun. Jika perlu bantuan, hubungi pusat bantuan DX STORE.",order:"Pesananmu berhasil dibuat. Silakan lanjutkan pembayaran dan kirim bukti pembayaran. Pesanan menunggu pemeriksaan admin.",proof:"Bukti pembayaran berhasil dikirim dan sedang menunggu pemeriksaan admin.",paid:"Pembayaranmu telah diverifikasi. Terima kasih telah menggunakan DX STORE.",rejected:"Bukti pembayaran belum dapat diterima. Silakan periksa keterangan pada pesanan atau hubungi admin.",unknown:"Aku belum memahami pertanyaan itu. Coba tanyakan tentang cara mencari produk, membuat pesanan, pembayaran, atau pengaturan akun."},
  MY: {welcome:"Helo! Saya DX-01, maskot rasmi DX STORE. Selamat datang! Saya sedia membantu anda meneroka produk dan akaun permainan.",help:"Anda boleh meneroka Produk Digital atau Akaun Permainan melalui navigasi. Buka menu Akaun untuk tetapan akaun. Untuk bantuan, hubungi pusat bantuan DX STORE.",order:"Tempahan anda berjaya dibuat. Sila teruskan pembayaran dan hantar bukti pembayaran. Tempahan sedang menunggu semakan admin.",proof:"Bukti pembayaran berjaya dihantar dan sedang menunggu semakan admin.",paid:"Pembayaran anda telah disahkan. Terima kasih kerana menggunakan DX STORE.",rejected:"Bukti pembayaran belum dapat diterima. Sila semak maklumat tempahan atau hubungi admin.",unknown:"Saya belum memahami soalan itu. Cuba tanya tentang produk, tempahan, pembayaran atau tetapan akaun."},
  JP: {welcome:"こんにちは！DX STOREの公式マスコット、DX-01です。ご来店ありがとうございます。商品やゲームアカウント探しをお手伝いします。",help:"ナビゲーションからデジタル商品またはゲームアカウントをご覧ください。アカウントメニューから設定を開けます。",order:"注文が作成されました。お支払いのうえ、支払い証明を送信してください。管理者の確認待ちです。",proof:"支払い証明が送信されました。管理者による確認をお待ちください。",paid:"お支払いが確認されました。DX STOREをご利用いただきありがとうございます。",rejected:"支払い証明を確認できませんでした。注文情報をご確認ください。",unknown:"商品、注文、支払い、アカウント設定について質問してください。"},
  TH: {welcome:"สวัสดี! ฉันคือ DX-01 มาสคอตของ DX STORE ยินดีต้อนรับ ฉันพร้อมช่วยคุณค้นหาสินค้าและบัญชีเกม",help:"เลือกสินค้าดิจิทัลหรือบัญชีเกมจากเมนู และเปิดเมนูบัญชีเพื่อดูการตั้งค่า",order:"สร้างคำสั่งซื้อแล้ว กรุณาชำระเงินและส่งหลักฐานการชำระเงินเพื่อรอผู้ดูแลตรวจสอบ",proof:"ส่งหลักฐานการชำระเงินแล้ว กำลังรอผู้ดูแลตรวจสอบ",paid:"ยืนยันการชำระเงินแล้ว ขอบคุณที่ใช้ DX STORE",rejected:"ยังไม่สามารถยืนยันหลักฐานการชำระเงินได้ กรุณาตรวจสอบคำสั่งซื้อ",unknown:"ลองถามเกี่ยวกับสินค้า คำสั่งซื้อ การชำระเงิน หรือการตั้งค่าบัญชี"},
  DE: {welcome:"Hallo! Ich bin DX-01, das offizielle Maskottchen von DX STORE. Willkommen! Ich helfe dir, digitale Produkte und Spielkonten zu finden.",help:"Wähle Digitale Produkte oder Spielkonten in der Navigation. Unter Konto findest du deine Kontoeinstellungen und Hilfe.",order:"Deine Bestellung wurde erstellt. Bitte bezahle und sende deinen Zahlungsnachweis. Die Bestellung wartet auf die Prüfung durch den Administrator.",proof:"Dein Zahlungsnachweis wurde gesendet und wartet auf die Prüfung.",paid:"Deine Zahlung wurde bestätigt. Vielen Dank für deinen Einkauf bei DX STORE.",rejected:"Der Zahlungsnachweis konnte nicht bestätigt werden. Bitte prüfe deine Bestelldaten oder kontaktiere den Administrator.",unknown:"Frage mich nach Produkten, Bestellungen, Zahlungen oder Kontoeinstellungen."},
  FR: {welcome:"Bonjour ! Je suis DX-01, la mascotte officielle de DX STORE. Bienvenue ! Je peux vous aider à découvrir les produits numériques et les comptes de jeux.",help:"Choisissez Produits numériques ou Comptes de jeux dans la navigation. Le menu Compte contient les paramètres et l'aide.",order:"Votre commande a été créée. Veuillez effectuer le paiement et envoyer votre justificatif. La commande attend la vérification de l'administrateur.",proof:"Votre justificatif de paiement a été envoyé et attend sa vérification.",paid:"Votre paiement a été vérifié. Merci d'utiliser DX STORE.",rejected:"Le justificatif de paiement n'a pas pu être accepté. Veuillez vérifier votre commande ou contacter l'administrateur.",unknown:"Posez-moi une question sur les produits, les commandes, les paiements ou les paramètres du compte."},
  IN: {welcome:"नमस्ते! मैं DX STORE का आधिकारिक मास्कॉट DX-01 हूँ। स्वागत है! मैं डिजिटल उत्पाद और गेम खाते खोजने में आपकी मदद कर सकता हूँ।",help:"नेविगेशन से डिजिटल उत्पाद या गेम खाते चुनें। खाता मेनू में खाते की सेटिंग और सहायता उपलब्ध है।",order:"आपका ऑर्डर बन गया है। कृपया भुगतान करें और भुगतान का प्रमाण भेजें। ऑर्डर एडमिन की जाँच की प्रतीक्षा में है।",proof:"आपका भुगतान प्रमाण भेज दिया गया है और एडमिन की जाँच की प्रतीक्षा में है।",paid:"आपका भुगतान सत्यापित हो गया है। DX STORE का उपयोग करने के लिए धन्यवाद।",rejected:"भुगतान प्रमाण स्वीकार नहीं किया जा सका। कृपया ऑर्डर की जानकारी जाँचें या एडमिन से संपर्क करें।",unknown:"उत्पाद, ऑर्डर, भुगतान या खाता सेटिंग के बारे में पूछें।"},
  KR: {welcome:"안녕하세요! 저는 DX STORE의 공식 마스코트 DX-01입니다. 환영합니다! 디지털 상품과 게임 계정을 찾도록 도와드릴게요.",help:"메뉴에서 디지털 상품 또는 게임 계정을 선택하세요. 계정 메뉴에서 설정과 도움말을 확인할 수 있습니다.",order:"주문이 생성되었습니다. 결제를 완료하고 결제 증빙을 제출해 주세요. 관리자 확인을 기다리고 있습니다.",proof:"결제 증빙이 제출되었으며 관리자 확인을 기다리고 있습니다.",paid:"결제가 확인되었습니다. DX STORE를 이용해 주셔서 감사합니다.",rejected:"결제 증빙을 확인할 수 없습니다. 주문 정보를 확인하거나 관리자에게 문의해 주세요.",unknown:"상품, 주문, 결제 또는 계정 설정에 관해 질문해 주세요."},
  BR: {welcome:"Olá! Sou DX-01, o mascote oficial da DX STORE. Boas-vindas! Posso ajudar você a encontrar produtos digitais e contas de jogos.",help:"Escolha Produtos Digitais ou Contas de Jogos na navegação. Abra Conta para acessar as configurações e a ajuda.",order:"Seu pedido foi criado. Faça o pagamento e envie o comprovante. O pedido aguarda a análise do administrador.",proof:"Seu comprovante foi enviado e aguarda a análise do administrador.",paid:"Seu pagamento foi confirmado. Obrigado por usar a DX STORE.",rejected:"Não foi possível aceitar o comprovante. Verifique os dados do pedido ou fale com o administrador.",unknown:"Pergunte sobre produtos, pedidos, pagamentos ou configurações da conta."},
  SG: {welcome:"Hello! I'm DX-01, the official DX STORE mascot. Welcome! I can help you explore digital products and game accounts.",help:"Browse Digital Products or Game Accounts from the navigation. Open Account for settings and support.",order:"Your order has been created. Please complete payment and submit your payment proof. It is waiting for admin review.",proof:"Your payment proof was submitted and is waiting for admin review.",paid:"Your payment has been verified. Thank you for using DX STORE.",rejected:"Your payment proof could not be accepted. Please review your order or contact the admin.",unknown:"Ask me about products, orders, payments, or account settings."},
  US: {welcome:"Hello! I'm DX-01, the official DX STORE mascot. Welcome! I can help you explore digital products and game accounts.",help:"Browse Digital Products or Game Accounts from the navigation. Open Account for settings and support.",order:"Your order has been created. Please complete payment and submit your payment proof. It is waiting for admin review.",proof:"Your payment proof was submitted and is waiting for admin review.",paid:"Your payment has been verified. Thank you for using DX STORE.",rejected:"Your payment proof could not be accepted. Please review your order or contact the admin.",unknown:"Ask me about products, orders, payments, or account settings."},
  PH: {welcome:"Hello! I'm DX-01, the official DX STORE mascot. Welcome! I can help you explore digital products and game accounts.",help:"Browse Digital Products or Game Accounts from the navigation. Open Account for settings and support.",order:"Your order has been created. Please complete payment and submit your payment proof. It is waiting for admin review.",proof:"Your payment proof was submitted and is waiting for admin review.",paid:"Your payment has been verified. Thank you for using DX STORE.",rejected:"Your payment proof could not be accepted. Please review your order or contact the admin.",unknown:"Ask me about products, orders, payments, or account settings."},
  AU: {welcome:"Hello! I'm DX-01, the official DX STORE mascot. Welcome! I can help you explore digital products and game accounts.",help:"Browse Digital Products or Game Accounts from the navigation. Open Account for settings and support.",order:"Your order has been created. Please complete payment and submit your payment proof. It is waiting for admin review.",proof:"Your payment proof was submitted and is waiting for admin review.",paid:"Your payment has been verified. Thank you for using DX STORE.",rejected:"Your payment proof could not be accepted. Please review your order or contact the admin.",unknown:"Ask me about products, orders, payments, or account settings."},
  GB: {welcome:"Hello! I'm DX-01, the official DX STORE mascot. Welcome! I can help you explore digital products and game accounts.",help:"Browse Digital Products or Game Accounts from the navigation. Open Account for settings and support.",order:"Your order has been created. Please complete payment and submit your payment proof. It is waiting for admin review.",proof:"Your payment proof was submitted and is waiting for admin review.",paid:"Your payment has been verified. Thank you for using DX STORE.",rejected:"Your payment proof could not be accepted. Please review your order or contact the admin.",unknown:"Ask me about products, orders, payments, or account settings."},
  CA: {welcome:"Hello! I'm DX-01, the official DX STORE mascot. Welcome! I can help you explore digital products and game accounts.",help:"Browse Digital Products or Game Accounts from the navigation. Open Account for settings and support.",order:"Your order has been created. Please complete payment and submit your payment proof. It is waiting for admin review.",proof:"Your payment proof was submitted and is waiting for admin review.",paid:"Your payment has been verified. Thank you for using DX STORE.",rejected:"Your payment proof could not be accepted. Please review your order or contact the admin.",unknown:"Ask me about products, orders, payments, or account settings."},
  CN: {welcome:"你好！我是DX STORE的官方吉祥物DX-01。欢迎来到DX STORE，我可以帮助你浏览商品和游戏账号。",help:"请从导航中选择数字商品或游戏账号。打开账户菜单可以查看账户设置。",order:"订单已创建。请完成付款并提交付款凭证，订单正在等待管理员审核。",proof:"付款凭证已提交，正在等待管理员审核。",paid:"付款已确认。感谢使用DX STORE。",rejected:"付款凭证暂未通过，请检查订单信息。",unknown:"你可以询问商品、订单、付款或账户设置。"}
};
const DX_MASCOT_LANG = {ID:"id-ID",MY:"ms-MY",SG:"en-SG",US:"en-US",JP:"ja-JP",TH:"th-TH",PH:"en-PH",AU:"en-AU",GB:"en-GB",DE:"de-DE",FR:"fr-FR",IN:"hi-IN",KR:"ko-KR",BR:"pt-BR",CA:"en-CA",CN:"zh-CN"};
function getDXMascotLine(type) {
  const code = getDXCountry().code;
  const fallback = {
    welcome:"Hello! I'm DX-01, the official DX STORE mascot. Welcome! I can help you explore digital products and game accounts.",
    help:"Browse Digital Products or Game Accounts from the navigation. Open Account for account settings. Contact DX STORE support if you need help.",
    order:"Your order has been created. Please complete payment and submit your payment proof. The order is waiting for admin review.",
    proof:"Your payment proof was submitted and is waiting for admin review.",
    paid:"Your payment has been verified. Thank you for using DX STORE.",
    rejected:"Your payment proof could not be accepted. Please review your order details or contact the admin.",
    unknown:"I didn't understand that question. Ask me about products, orders, payments, or account settings."
  };
  const translated = DX_MASCOT_LINES[code] || {};
  return translated[type] || fallback[type] || fallback.unknown;
}
function showDXMascotMessage(type, customMessage) {
  const message = customMessage || getDXMascotLine(type);
  let bubble = document.getElementById("dxMascotSpeechBubble");
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.id = "dxMascotSpeechBubble";
    bubble.setAttribute("role", "status");
    bubble.setAttribute("aria-live", "polite");
    bubble.style.cssText = "position:fixed;z-index:700;right:16px;bottom:112px;display:flex;align-items:center;gap:11px;width:min(360px,calc(100vw - 32px));min-height:104px;padding:10px 13px;border:1px solid #51e5ff88;border-radius:16px;background:rgba(10,20,42,.92);backdrop-filter:blur(12px);box-shadow:0 8px 28px #0007;color:#f4f8ff;font:500 13px/1.55 Inter,sans-serif";
    const avatar = document.createElement("img");
    avatar.src = "./39976-removebg-preview.png";
    avatar.alt = "Maskot DX-01";
    avatar.style.cssText = "display:block;flex:0 0 76px;width:76px;height:84px;object-fit:contain;object-position:center;filter:drop-shadow(0 0 10px #26cfff88)";
    avatar.onerror = () => { avatar.style.display = "none"; };
    const content = document.createElement("div");
    content.style.cssText = "min-width:0;flex:1";
    const name = document.createElement("div");
    name.textContent = "DX-01";
    name.style.cssText = "margin-bottom:4px;color:#65eaff;font-size:11px;font-weight:900;letter-spacing:1.2px";
    const words = document.createElement("div");
    words.id = "dxMascotSpeechText";
    words.style.cssText = "font-size:13px;line-height:1.5;color:#f4f8ff";
    content.append(name, words);
    bubble.append(avatar, content);
    document.body.appendChild(bubble);
  }
  const words = bubble.querySelector("#dxMascotSpeechText");
  if (words) words.textContent = message;
  bubble.hidden = false;
  clearTimeout(window.dxMascotBubbleTimer);
  window.dxMascotBubbleTimer = setTimeout(() => { bubble.hidden = true; }, 7000);
}
function answerDXMascotQuestion(question) {
  const q = String(question || "").toLocaleLowerCase();
  let answer = getDXMascotLine("unknown");
  if (/produk|barang|digital|game|akun|cari|lihat|browse|product|account/.test(q)) answer = getDXMascotLine("help");
  else if (/pesan|order|beli|buat|checkout|reserv/.test(q)) answer = getDXMascotLine("order");
  else if (/bayar|pembayaran|qris|transfer|payment/.test(q)) answer = getDXMascotLine("proof");
  else if (/lunas|verifikasi|verified|paid/.test(q)) answer = getDXMascotLine("paid");
  else if (/akun|profil|negara|mata uang|bahasa|setting|pengaturan/.test(q)) answer = getDXMascotLine("help");
  showDXMascotMessage("answer", answer);
}
function mountDXMascotVoice() {
  // Maskot tetap menampilkan pesan teks; fitur audio dan tombol suara dihapus.
  localStorage.removeItem("dx-mascot-voice");
  if (!document.documentElement.dataset.dxMascotTextBound) {
    let welcomed = false;
    const welcome = () => {
      if (welcomed) return;
      welcomed = true;
      showDXMascotMessage("welcome");
    };
    document.addEventListener("pointerdown", welcome, { once: true, capture: true, passive: true });
    document.addEventListener("keydown", welcome, { once: true, capture: true });
    window.addEventListener("dx:order-update", event => {
      const status = event.detail?.status;
      const type = status === "paid" || status === "completed" ? "paid" : status === "rejected" ? "rejected" : status === "proof" ? "proof" : "order";
      showDXMascotMessage(type);
    });
    document.documentElement.dataset.dxMascotTextBound = "1";
  }
}
window.dxMascotSpeak = (message) => showDXMascotMessage("answer", String(message || ""));

/* SALAM PERPISAHAN MASKOT DX-01 */
function showDXMascotFarewell() {
  const country = getDXCountry();
  const messages = {
    ID:"Sampai jumpa! Terima kasih sudah berkunjung ke DX STORE. Semoga harimu menyenangkan!",
    MY:"Jumpa lagi! Terima kasih kerana mengunjungi DX STORE. Semoga hari anda menyenangkan!",
    JP:"またお会いしましょう！DX STOREをご利用いただき、ありがとうございます。",
    TH:"แล้วพบกันใหม่นะ! ขอบคุณที่แวะมา DX STORE",
    DE:"Bis zum nächsten Mal! Danke für deinen Besuch bei DX STORE.",
    FR:"À bientôt ! Merci de votre visite sur DX STORE.",
    BR:"Até a próxima! Obrigado por visitar a DX STORE.",
    CN:"再见！感谢您访问 DX STORE。"
  };
  const message = messages[country.code] || "See you next time! Thanks for visiting DX STORE.";
  let bubble = document.getElementById("dxMascotFarewell");
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.id = "dxMascotFarewell";
    bubble.setAttribute("role","status");
    bubble.style.cssText = "position:fixed;z-index:99999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,calc(100vw - 32px));padding:22px 24px;border:1px solid #51e5ff99;border-radius:18px;background:linear-gradient(145deg,#13284a,#171333);box-shadow:0 18px 70px #000b,0 0 28px #278fff55;color:#f4f8ff;text-align:center;font:600 15px/1.65 Inter,sans-serif";
    document.body.appendChild(bubble);
  }
  bubble.textContent = "DX-01 · " + message;
  return new Promise(resolve => setTimeout(() => { bubble.remove(); resolve(); }, 1800));
}

/* KELUAR DARI AKUN */

async /* Obsolete duplicate removed: handleDXLogout */

/* NAVIGASI */

/* Obsolete duplicate removed: initDXNavigation */

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
  panel.style.margin = "24px 0 0";
  panel.dataset.dxAdminPanel = "1";
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

      <div id="dxProductWarrantyWrap" style="margin-bottom:12px;">
        <label for="dxWarrantyDays">Masa garansi produk DX STORE (hari, 0 = tanpa garansi)</label>
        <input id="dxWarrantyDays" type="number" min="0" max="3650" step="1" value="7" required>
        <label for="dxWarrantyTerms">Ketentuan garansi</label>
        <textarea id="dxWarrantyTerms" rows="3" maxlength="2000">Garansi berlaku untuk kendala pada produk sesuai ketentuan DX STORE. Ajukan melalui Pusat Bantuan dengan ID pesanan.</textarea>
      </div>

      <div style="margin-bottom:12px;">
        <label for="dxImageFile">Foto produk (JPG, PNG, WEBP · maks. 5 MB)</label>
        <input id="dxImageFile" type="file" accept="image/jpeg,image/png,image/webp">
        <div id="dxImagePreview" style="display:none;margin-top:10px;">
          <img id="dxImagePreviewImg" alt="Pratinjau foto" style="width:100%;max-width:240px;max-height:170px;object-fit:cover;border-radius:12px;border:1px solid #345276;">
        </div>
        <input id="dxImage" type="url" placeholder="URL gambar alternatif (opsional)" aria-label="URL gambar alternatif" style="margin-top:8px;">
        <small style="display:block;color:#9aa9c4;margin-top:5px;">Foto dari perangkat akan diunggah otomatis saat data disimpan.</small>
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
    <hr style="border-color:#263c60;margin:25px 0;">
    <h3>Pesanan &amp; Verifikasi Pembayaran QRIS</h3>
    <button type="button" id="dxRefreshPaymentOrders">Muat Ulang Pesanan</button>
    <div id="dxPaymentOrders">Memuat pesanan...</div>
    <hr style="border-color:#263c60;margin:25px 0;"><h3>Operasional Toko</h3><div id="dxStoreStatus">Memuat pengaturan toko...</div>
    <form id="dxStoreSettingsForm">
      <label><input id="dxStoreOpen" type="checkbox" style="display:inline-block;width:auto;"> Toko menerima pesanan</label>
      <label><input id="dxStoreMaintenance" type="checkbox" style="display:inline-block;width:auto;"> Mode pemeliharaan</label>
      <label for="dxStoreOpening">Jam buka</label><input id="dxStoreOpening" type="time" value="08:00" required>
      <label for="dxStoreClosing">Jam tutup</label><input id="dxStoreClosing" type="time" value="22:00" required>
      <label for="dxStoreTimezone">Zona waktu</label><select id="dxStoreTimezone"><option value="Asia/Jakarta">WIB · Jakarta</option><option value="Asia/Kuala_Lumpur">Malaysia</option><option value="Asia/Singapore">Singapore</option><option value="Asia/Tokyo">Japan</option><option value="UTC">UTC</option></select>
      <label for="dxStoreNotice">Pengumuman toko</label><input id="dxStoreNotice" maxlength="240" placeholder="Pengumuman untuk pengunjung">
      <button type="submit" id="dxStoreSave">Simpan Pengaturan Toko</button><p id="dxStoreFeedback" role="status"></p>
    </form>
    <hr style="border-color:#263c60;margin:25px 0;"><h3>Pusat Laporan Pengguna</h3><button type="button" id="dxRefreshTickets">Muat Ulang Laporan</button><div id="dxAdminTickets">Memuat laporan...</div>
    <hr style="border-color:#263c60;margin:25px 0;"><h3>Ringkasan Admin</h3><div id="dxAdminOverview">Memuat statistik...</div><h3>Daftar Pengguna</h3><div id="dxAdminUsers">Memuat pengguna...</div>
  `;

  const accountPanel = $("dxProfilePanel");
  if (accountPanel) accountPanel.appendChild(panel);
  else main.appendChild(panel);
  installDXRupiahInput($("dxPrice"));

  const adminAccessButton = $("dxOpenAdmin");
  const adminAccessCard = $("dxAdminAccessCard");
  if (adminAccessCard) adminAccessCard.hidden = currentProfile?.role !== "admin";
  if (adminAccessButton) {
    adminAccessButton.hidden = false;
    if (!adminAccessButton.dataset.bound) {
      adminAccessButton.addEventListener("click", () => {
        window.dxAdminPanelExpanded = !window.dxAdminPanelExpanded;
        panel.style.display = window.dxAdminPanelExpanded ? "block" : "none";
        adminAccessButton.textContent = window.dxAdminPanelExpanded ? "Tutup Kelola Website" : "Kelola Website";
        if (window.dxAdminPanelExpanded) {
          loadDXAdminList(); loadDXPaymentOrders(); loadDXStoreSettings(); loadDXAdminTickets(); loadDXAdminOverview(); loadDXAdminUsers();
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
      adminAccessButton.dataset.bound = "1";
    }
  }

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

  $("dxRefreshPaymentOrders").addEventListener("click", loadDXPaymentOrders);
  $("dxRefreshTickets")?.addEventListener("click", loadDXAdminTickets);
  $("dxStoreSettingsForm")?.addEventListener("submit", saveDXStoreSettings);
  $("dxAdminTickets")?.addEventListener("click", event => { const b=event.target.closest("[data-dx-ticket-save]"); if(b) updateDXAdminTicket(b.dataset.dxTicketSave); });
  $("dxPaymentOrders").addEventListener("click", event => {
    const button = event.target.closest("[data-dx-order][data-dx-decision]");
    if (button) reviewDXPayment(button.dataset.dxOrder, button.dataset.dxDecision);
  });
  $("dxImageFile")?.addEventListener("change", () => {
    const file = $("dxImageFile").files?.[0];
    const preview = $("dxImagePreview");
    const previewImage = $("dxImagePreviewImg");
    if (!file || !preview || !previewImage) {
      if (preview) preview.style.display = "none";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      $("dxImageFile").value = "";
      preview.style.display = "none";
      showDXAdminMessage("Foto harus JPG, PNG, atau WEBP dengan ukuran maksimal 5 MB.");
      return;
    }
    if (previewImage.dataset.objectUrl) URL.revokeObjectURL(previewImage.dataset.objectUrl);
    previewImage.dataset.objectUrl = URL.createObjectURL(file);
    previewImage.src = previewImage.dataset.objectUrl;
    preview.style.display = "block";
  });
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
  const warrantyWrap = $("dxProductWarrantyWrap");
  if (warrantyWrap) warrantyWrap.style.display = isAccount ? "none" : "block";

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
  if ($("dxImagePreview")) $("dxImagePreview").style.display = "none";
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
        ${dxAdminType === "products" ? `<p>Garansi DX STORE: <strong>${Number(item.warranty_days ?? 7) > 0 ? Number(item.warranty_days ?? 7) + " hari" : "Tidak tersedia"}</strong></p>` : ""}
        <p>Status moderasi: <strong>${safeText(item.status || (dxAdminType === "products" ? "active" : "pending"))}</strong></p>
        <p>Status penjualan: <strong>${safeText(item.sale_status || "available")}</strong></p>
        ${item.sale_status && item.sale_status !== "available" ? '<button type="button" onclick="setDXSaleStatus(\'' + dxAdminType + '\', \'' + safeText(item.id) + '\', \'available\')">Aktifkan Kembali / Tersedia</button>' : ""}

        ${item.status === "pending"
          ? `<button type="button" onclick="reviewDXListing('${dxAdminType}', '${safeText(item.id)}', 'active')">Setujui / Terbitkan</button>
             <button type="button" onclick="reviewDXListing('${dxAdminType}', '${safeText(item.id)}', 'rejected')">Tolak</button>`
          : ""}

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

async function loadDXPaymentOrders() {
  const container = $("dxPaymentOrders");
  if (!container || !currentUser || !(await checkDXAdmin())) return;
  container.textContent = "Memuat pesanan...";
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    const response = await fetch(new URL("api/admin/orders", DX_CONFIG.paymentApiUrl + "/"), {
      headers: { "apikey": DX_CONFIG.supabaseKey, "Authorization": "Bearer " + session?.access_token }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Pesanan gagal dimuat.");
    if (!result.orders?.length) { container.textContent = "Belum ada pesanan."; return; }
    container.innerHTML = result.orders.map(order => `
      <article>
        <h4>${safeText(order.item_name)} — ${safeText(order.order_id)}</h4>
        <p>Nominal: <strong>${formatPrice(order.amount)}</strong></p>
        <p>Status: <strong>${safeText(order.status)}</strong></p>
        <p>Dibuat: ${new Date(order.created_at).toLocaleString("id-ID")}</p>
        ${order.proof_url ? `<p><a href="${safeText(order.proof_url)}" target="_blank" rel="noopener">Lihat bukti pembayaran</a></p>` : "<p>Belum ada bukti pembayaran.</p>"}
        ${order.status === "review" ? `
          <button type="button" data-dx-order="${safeText(order.order_id)}" data-dx-decision="paid">Setujui — sudah cek dana masuk</button>
          <button type="button" data-dx-order="${safeText(order.order_id)}" data-dx-decision="rejected">Tolak bukti</button>
        ` : order.status === "pending" ? `
          <button type="button" data-dx-order="${safeText(order.order_id)}" data-dx-decision="rejected">Batalkan pesanan / lepaskan barang</button>
        ` : ""}
      </article>
    `).join("");
  } catch (error) { container.textContent = getDXError(error); }
}

async function reviewDXPayment(orderId, status) {
  if (!currentUser || !(await checkDXAdmin())) { alert("Akses admin diperlukan."); return; }
  const message = status === "paid"
    ? "Pastikan dana benar-benar sudah masuk ke DANA Bisnis sebelum menyetujui. Lanjutkan?"
    : "Tolak bukti pembayaran ini?";
  if (!confirm(message)) return;
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    const response = await fetch(new URL("api/admin/orders/" + encodeURIComponent(orderId), DX_CONFIG.paymentApiUrl + "/"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session?.access_token },
      body: JSON.stringify({ status })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Status pesanan gagal diperbarui.");
    await loadDXPaymentOrders();
  } catch (error) { alert(getDXError(error)); }
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
  const price = parseDXRupiahInput($("dxPrice").value);
  let imageUrl = $("dxImage").value.trim();
  const imageFile = $("dxImageFile")?.files?.[0] || null;

  if (imageFile && (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024)) {
    showDXAdminMessage("Foto harus JPG, PNG, atau WEBP dengan ukuran maksimal 5 MB.");
    return;
  }

  if (!name || !Number.isFinite(price) || price <= 0) {
    showDXAdminMessage("Nama harus diisi dan harga harus lebih dari Rp0.");
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
    const warrantyDays = Number($("dxWarrantyDays")?.value);
    if (!Number.isInteger(warrantyDays) || warrantyDays < 0 || warrantyDays > 3650) {
      showDXAdminMessage("Masa garansi harus 0 sampai 3650 hari.");
      return;
    }
    payload.name = name;
    payload.warranty_days = warrantyDays;
    payload.warranty_terms = $("dxWarrantyTerms")?.value.trim() || "Ajukan klaim melalui Pusat Bantuan dengan ID pesanan.";
  }

  const saveButton = $("dxSaveButton");
  saveButton.disabled = true;
  saveButton.textContent = "Menyimpan...";

  try {
    if (imageFile) {
      const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[imageFile.type];
      const objectPath = currentUser.id + "/admin/" + crypto.randomUUID() + "." + extension;
      const { error: uploadError } = await dxSupabase.storage
        .from("marketplace-images")
        .upload(objectPath, imageFile, { contentType: imageFile.type, cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data: publicData } = dxSupabase.storage.from("marketplace-images").getPublicUrl(objectPath);
      imageUrl = publicData?.publicUrl || "";
      if (!imageUrl) throw new Error("URL foto tidak berhasil dibuat.");
      $("dxImage").value = imageUrl;
      // Simpan URL hasil upload terbaru ke payload sebelum INSERT/UPDATE.
      payload.image_url = imageUrl;
    }

    let result;

    if (editId) {
      result = await dxSupabase
        .from(dxAdminType)
        .update(payload)
        .eq("id", editId);
    } else {
      // Semua produk wajib memiliki pemilik; akun pengguna tetap menunggu moderasi.
      payload.seller_id = currentUser.id;
      if (isAccount) {
        payload.status = "pending";
      } else {
        // Produk digital yang dibuat admin langsung aktif.
        payload.status = "active";
      }

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

/* VERIFIKASI AKUN GAME OLEH ADMIN */

async function reviewDXListing(table, id, status) {
  if (!currentUser || !(await checkDXAdmin())) {
    alert("Akses ditolak. Khusus administrator.");
    return;
  }

  if (!["products", "account_listings"].includes(table)) return;
  if (!["active", "rejected"].includes(status)) return;

  const label = status === "active" ? "menyetujui dan menerbitkan" : "menolak";
  const itemLabel = table === "products" ? "produk digital" : "akun game";
  if (!confirm("Yakin ingin " + label + " " + itemLabel + " ini?")) return;

  const { error } = await dxSupabase
    .from(table)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    alert("Gagal memverifikasi: " + getDXError(error));
    return;
  }

  showDXAdminMessage(status === "active"
    ? itemLabel + " berhasil disetujui dan diterbitkan."
    : "Pengajuan " + itemLabel + " ditolak.");
  await loadDXAdminList();
  await loadDXStore();
}

async function setDXSaleStatus(table, id, status) {
  if (!currentUser || !(await checkDXAdmin())) { alert("Akses admin diperlukan."); return; }
  if (!["products", "account_listings"].includes(table) || status !== "available") return;
  if (!confirm("Aktifkan kembali barang ini agar bisa dipesan?")) return;
  const { error } = await dxSupabase.from(table)
    .update({ sale_status: "available", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { alert("Gagal mengubah status: " + getDXError(error)); return; }
  await loadDXAdminList();
  await loadDXStore();
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
  $("dxPrice").value = formatDXRupiahInput(data.price);
  $("dxImage").value = data.image_url || "";

  if (dxAdminType === "account_listings") {
    $("dxGame").value = data.game || "";
  } else {
    $("dxWarrantyDays").value = String(data.warranty_days ?? 7);
    $("dxWarrantyTerms").value = data.warranty_terms || "";
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

    const adminPanel = $("dxAdminPanel");
    const adminButton = $("dxOpenAdmin");
    const adminCard = $("dxAdminAccessCard");

    if (isAdmin) {
      createDXAdminPanel();
      window.dxAdminPanelExpanded = false;
      if (adminPanel) adminPanel.style.display = "none";
      if (adminButton) adminButton.hidden = false;
      if (adminCard) adminCard.hidden = false;
      await loadDXAdminList();
    } else {
      window.dxAdminPanelExpanded = false;
      if (adminPanel) adminPanel.style.display = "none";
      if (adminButton) adminButton.hidden = true;
      if (adminCard) adminCard.hidden = true;
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

  const panel = $("dxAdminPanel");
  const adminButton = $("dxOpenAdmin");
  const adminCard = $("dxAdminAccessCard");

  if (isAdmin) {
    createDXAdminPanel();
    window.dxAdminPanelExpanded = false;
    if (panel) panel.style.display = "none";
    if (adminButton) adminButton.hidden = false;
    if (adminCard) adminCard.hidden = false;
    await loadDXAdminList();
  } else {
    window.dxAdminPanelExpanded = false;
    if (panel) panel.style.display = "none";
    if (adminButton) adminButton.hidden = true;
    if (adminCard) adminCard.hidden = true;
  }
}

/* KELUAR */

async function handleDXLogout() {
  if (!dxSupabase || window.dxLogoutInProgress) return;
  window.dxLogoutInProgress = true;

  const logoutButton = document.querySelector(".dx-nav-actions .dx-button");
  if (logoutButton) {
    logoutButton.disabled = true;
    logoutButton.textContent = "Keluar...";
  }

  try {
    const { error } = await dxSupabase.auth.signOut();
    if (error) throw error;

    currentUser = null;
    currentProfile = null;

    const panel = $("dxAdminPanel");
    if (panel) panel.style.display = "none";

    updateDXHeaderAuth();

    // Salam perpisahan DX-01 ditampilkan dan dibacakan sebelum kembali ke login.
    if (typeof showDXMascotFarewell === "function") {
      await showDXMascotFarewell();
    }

    window.location.replace("login.html");
  } catch (error) {
    window.dxLogoutInProgress = false;
    if (logoutButton) {
      logoutButton.disabled = false;
      logoutButton.textContent = "Keluar";
    }
    alert("Gagal keluar: " + getDXError(error));
  }
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
    console.error("Supabase JS SDK tidak tersedia; katalog memakai REST API publik.");
    loadProducts();
    loadAccountListings();
    return;
  }

  setupDXAuthSwitch();
  mountDXMascotVoice();
  const countrySelect = $("dxCountry");
  if (countrySelect) {
    countrySelect.value = getDXCountry().code;
    countrySelect.addEventListener("change", () => setDXCountry(countrySelect.value));
  }
  setDXCountry(getDXCountry().code);
  // Tampilkan produk dan akun meskipun API kurs sedang gagal/tidak tersedia.
  loadProducts();
  loadAccountListings();
  loadDXExchangeRates().then(() => {
    if (dxExchangeRateReady) { loadProducts(); loadAccountListings(); }
  });
  applyDXLanguage();
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
  await loadDXRecentPurchaseActivity();
  if (!window.dxPurchaseActivityRefresh) window.dxPurchaseActivityRefresh = setInterval(loadDXRecentPurchaseActivity, 60000);

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
