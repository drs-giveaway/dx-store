
/*
  DX STORE - Supabase Configuration
  Gunakan publishable key, bukan secret/service_role key.
*/

window.DX_CONFIG = {
  supabaseUrl: "https://jevjydmlnkmkipzbmtqw.supabase.co",

  supabaseKey: "sb_publishable_qYzr-r6cQwQhfbrbChk3oA_6KQL46xh",

  // Supabase Edge Function untuk API pesanan manual QRIS.
  paymentApiUrl: "https://jevjydmlnkmkipzbmtqw.supabase.co/functions/v1/dx-payments"
};
