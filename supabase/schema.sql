-- SATAK.IO - Banco Supabase
-- Execute este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  barcode text not null,
  barcode_image text,
  name text not null,
  brand text default '',
  category text not null default 'Categoria padrão',
  expiration_date timestamptz not null,
  in_brigade boolean not null default false,
  batch text,
  added_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discard_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid,
  product_name text not null,
  product_brand text default '',
  product_category text default '',
  product_barcode text default '',
  quantity integer not null default 1 check (quantity > 0),
  reason text not null check (reason in ('Validade', 'Avaria', 'Não informado')),
  discarded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  store_name text not null default 'Minha loja',
  team_name text not null default 'Equipe',
  alert_critical integer not null default 5,
  alert_high integer not null default 10,
  alert_medium integer not null default 15,
  alert_low integer not null default 30,
  brigade_auto_suggest integer not null default 30,
  notification_time text not null default '08:00',
  updated_at timestamptz not null default now()
);

create index if not exists products_user_expiration_idx on public.products(user_id, expiration_date);
create index if not exists products_user_barcode_idx on public.products(user_id, barcode);
create index if not exists discards_user_date_idx on public.discard_records(user_id, discarded_at);

alter table public.products enable row level security;
alter table public.discard_records enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can read own products" on public.products
  for select using (auth.uid() = user_id);
create policy "Users can insert own products" on public.products
  for insert with check (auth.uid() = user_id);
create policy "Users can update own products" on public.products
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own products" on public.products
  for delete using (auth.uid() = user_id);

create policy "Users can read own discards" on public.discard_records
  for select using (auth.uid() = user_id);
create policy "Users can insert own discards" on public.discard_records
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own discards" on public.discard_records
  for delete using (auth.uid() = user_id);

create policy "Users can read own settings" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch_updated_at on public.user_settings;
create trigger settings_touch_updated_at
before update on public.user_settings
for each row execute function public.touch_updated_at();
