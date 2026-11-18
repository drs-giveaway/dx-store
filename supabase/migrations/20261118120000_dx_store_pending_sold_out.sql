-- DX STORE: separate listing moderation from sale availability.
-- PENDING reserves a listing; SOLD OUT is permanent until an admin reactivates it.
alter table public.products
  add column if not exists sale_status text not null default 'available';
alter table public.account_listings
  add column if not exists sale_status text not null default 'available';

alter table public.products drop constraint if exists products_sale_status_check;
alter table public.products add constraint products_sale_status_check
  check (sale_status in ('available', 'pending', 'sold_out'));
alter table public.account_listings drop constraint if exists account_listings_sale_status_check;
alter table public.account_listings add constraint account_listings_sale_status_check
  check (sale_status in ('available', 'pending', 'sold_out'));

drop policy if exists "DX public catalog item statuses" on public.products;
create policy "DX public catalog item statuses"
on public.products for select to anon, authenticated
using (status = 'active');

drop policy if exists "DX public account catalog item statuses" on public.account_listings;
create policy "DX public account catalog item statuses"
on public.account_listings for select to anon, authenticated
using (status = 'active');

create or replace function public.dx_create_order_with_reservation(
  p_user_id uuid, p_item_type text, p_item_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_price bigint;
  v_status text;
  v_sale_status text;
  v_order_id text;
  v_id uuid;
begin
  if p_item_type = 'product' then
    select name, price, status, sale_status
      into v_name, v_price, v_status, v_sale_status
      from public.products where id = p_item_id for update;
    if not found or v_status <> 'active' or v_sale_status <> 'available' then
      raise exception 'DX_ITEM_UNAVAILABLE';
    end if;
    update public.products set sale_status = 'pending' where id = p_item_id;
  elsif p_item_type = 'account' then
    select title, price, status, sale_status
      into v_name, v_price, v_status, v_sale_status
      from public.account_listings where id = p_item_id for update;
    if not found or v_status <> 'active' or v_sale_status <> 'available' then
      raise exception 'DX_ITEM_UNAVAILABLE';
    end if;
    update public.account_listings set sale_status = 'pending' where id = p_item_id;
  else
    raise exception 'DX_ITEM_UNAVAILABLE';
  end if;

  v_order_id := 'DX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into public.orders (user_id, order_id, item_type, item_id, item_name, amount, status)
  values (p_user_id, v_order_id, p_item_type, p_item_id, v_name, v_price, 'pending')
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'order_id', v_order_id, 'amount', v_price, 'status', 'pending');
end;
$$;

create or replace function public.dx_review_order_and_listing(
  p_order_id uuid, p_decision text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_sale_status text;
  v_new_status text;
begin
  if p_decision not in ('paid', 'rejected') then
    raise exception 'DX_ORDER_UNAVAILABLE';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'DX_ORDER_UNAVAILABLE'; end if;

  if p_decision = 'paid' and v_order.status <> 'review' then
    raise exception 'DX_ORDER_UNAVAILABLE';
  end if;
  if p_decision = 'rejected' and v_order.status not in ('pending', 'review') then
    raise exception 'DX_ORDER_UNAVAILABLE';
  end if;

  if v_order.item_type = 'product' then
    select sale_status into v_sale_status from public.products where id = v_order.item_id for update;
    if not found or v_sale_status <> 'pending' then raise exception 'DX_ORDER_UNAVAILABLE'; end if;
    update public.products set sale_status = case when p_decision = 'paid' then 'sold_out' else 'available' end
      where id = v_order.item_id;
  elsif v_order.item_type = 'account' then
    select sale_status into v_sale_status from public.account_listings where id = v_order.item_id for update;
    if not found or v_sale_status <> 'pending' then raise exception 'DX_ORDER_UNAVAILABLE'; end if;
    update public.account_listings set sale_status = case when p_decision = 'paid' then 'sold_out' else 'available' end
      where id = v_order.item_id;
  else
    raise exception 'DX_ORDER_UNAVAILABLE';
  end if;

  v_new_status := p_decision;
  update public.orders set status = v_new_status, updated_at = now()
    where id = p_order_id;
  return jsonb_build_object('id', p_order_id, 'status', v_new_status);
end;
$$;

revoke all on function public.dx_create_order_with_reservation(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.dx_review_order_and_listing(uuid, text) from public, anon, authenticated;
grant execute on function public.dx_create_order_with_reservation(uuid, text, uuid) to service_role;
grant execute on function public.dx_review_order_and_listing(uuid, text) to service_role;
