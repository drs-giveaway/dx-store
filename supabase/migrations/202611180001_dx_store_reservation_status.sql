-- Superseded compatibility migration. Sale state is stored in sale_status,
-- never in the moderation status column. See 20261118120000_dx_store_pending_sold_out.sql.
drop policy if exists "DX public catalog item statuses" on public.products;
create policy "DX public catalog item statuses"
on public.products for select to anon, authenticated
using (status = 'active');

drop policy if exists "DX public account catalog item statuses" on public.account_listings;
create policy "DX public account catalog item statuses"
on public.account_listings for select to anon, authenticated
using (status = 'active');
