create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id text not null unique,
  item_type text not null check (item_type in ('product', 'account')),
  item_id uuid not null,
  item_name text not null,
  amount bigint not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'failed')),
  midtrans_transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);

create index if not exists orders_order_id_idx
  on public.orders (order_id);

alter table public.orders enable row level security;

-- Browser clients cannot read or change payment orders directly.
-- Only the trusted backend uses the Supabase service-role key.
