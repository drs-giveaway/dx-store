-- DX STORE manual QRIS support.
-- Keep the existing order columns and historical statuses intact.
alter table public.orders
  add column if not exists item_type text,
  add column if not exists item_id uuid,
  add column if not exists item_name text,
  add column if not exists proof_path text;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in (
    'pending',
    'paid',
    'processing',
    'completed',
    'cancelled',
    'disputed',
    'review',
    'rejected'
  ));

alter table public.orders
  drop constraint if exists orders_item_type_check;

alter table public.orders
  add constraint orders_item_type_check
  check (item_type is null or item_type in ('product', 'account'));

create index if not exists orders_status_created_at_idx
  on public.orders(status, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  4194304,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set public = false,
    file_size_limit = 4194304,
    allowed_mime_types = array['image/jpeg', 'image/png'];

drop policy if exists "Buyer uploads own payment proof" on storage.objects;
create policy "Buyer uploads own payment proof"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Buyer updates own payment proof" on storage.objects;
create policy "Buyer updates own payment proof"
on storage.objects
for update to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Buyer reads own payment proof" on storage.objects;
create policy "Buyer reads own payment proof"
on storage.objects
for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);
