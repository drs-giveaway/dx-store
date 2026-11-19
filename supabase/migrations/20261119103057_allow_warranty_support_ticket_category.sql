-- Allow warranty claims in the support ticket category.
ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_category_check;

ALTER TABLE public.support_tickets
  ADD CONSTRAINT support_tickets_category_check
  CHECK (
    category = ANY (
      ARRAY['Pembayaran', 'Pesanan', 'Garansi', 'Produk', 'Akun', 'Login', 'Lainnya']::text[]
    )
  );
