-- DX STORE: allow authenticated sellers to submit their own account listings for admin review.
-- This does not grant sellers permission to publish or approve listings.
drop policy if exists "Sellers can submit own account listings" on public.account_listings;
create policy "Sellers can submit own account listings"
on public.account_listings
for insert
to authenticated
with check (
  seller_id = (select auth.uid())
  and status = 'pending'
);
