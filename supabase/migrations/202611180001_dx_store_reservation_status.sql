-- DX STORE: public catalog visibility for reserved and sold-out items.
-- Existing policies remain in place; these additive SELECT policies allow badges
-- to be shown while checkout remains protected by the Edge Function.

drop policy if exists "DX public catalog item statuses" on public.products;
create policy "DX public catalog item statuses"
on public.products
for select
to anon, authenticated
using (status in ('active', 'reserved', 'sold_out'));

drop policy if exists "DX public account catalog item statuses" on public.account_listings;
create policy "DX public account catalog item statuses"
on public.account_listings
for select
to anon, authenticated
using (status in ('active', 'reserved', 'sold_out'));
