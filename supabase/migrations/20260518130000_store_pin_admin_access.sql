-- SATAK.IO - Supabase migration
-- Modelo: PIN de 6 dígitos + loja 1..80.
-- Admin pode entrar em qualquer loja e cadastrar operadores.
-- Ative Anonymous Sign-ins em Authentication > Providers > Anonymous.

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Operador',
  role text not null default 'operator' check (role in ('admin', 'operator')),
  pin_salt text not null,
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  store_number integer not null unique check (store_number between 1 and 80),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_store_access (
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (app_user_id, store_id)
);

create table if not exists public.app_sessions (
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  role text not null check (role in ('admin', 'operator')),
  created_at timestamptz not null default now(),
  primary key (auth_user_id, store_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
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
  store_id uuid not null references public.stores(id) on delete cascade,
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

create table if not exists public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
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

create index if not exists stores_number_idx on public.stores(store_number);
create index if not exists products_store_expiration_idx on public.products(store_id, expiration_date);
create index if not exists products_store_barcode_idx on public.products(store_id, barcode);
create index if not exists discards_store_date_idx on public.discard_records(store_id, discarded_at);
create index if not exists app_sessions_auth_idx on public.app_sessions(auth_user_id);

alter table public.app_users enable row level security;
alter table public.stores enable row level security;
alter table public.user_store_access enable row level security;
alter table public.app_sessions enable row level security;
alter table public.products enable row level security;
alter table public.discard_records enable row level security;
alter table public.store_settings enable row level security;

create or replace function public.satak_pin_hash(input_pin text, input_salt text)
returns text
language sql
immutable
as $$
  select encode(digest(input_pin || input_salt, 'sha256'), 'hex')
$$;

create or replace function public.current_store_session(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_sessions s
    where s.store_id = target_store_id
      and s.auth_user_id = auth.uid()
  );
$$;

create or replace function public.current_admin_session()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_sessions s
    where s.auth_user_id = auth.uid()
      and s.role = 'admin'
  );
$$;

create policy "Admin can read app users" on public.app_users for select using (public.current_admin_session());
create policy "Sessions can read stores" on public.stores for select using (public.current_store_session(id) or public.current_admin_session());
create policy "Sessions can read own sessions" on public.app_sessions for select using (auth_user_id = auth.uid() or public.current_admin_session());
create policy "Admin can read user store access" on public.user_store_access for select using (public.current_admin_session());

create policy "Read store products" on public.products for select using (public.current_store_session(store_id));
create policy "Insert store products" on public.products for insert with check (public.current_store_session(store_id));
create policy "Update store products" on public.products for update using (public.current_store_session(store_id)) with check (public.current_store_session(store_id));
create policy "Delete store products" on public.products for delete using (public.current_store_session(store_id));

create policy "Read store discards" on public.discard_records for select using (public.current_store_session(store_id));
create policy "Insert store discards" on public.discard_records for insert with check (public.current_store_session(store_id));
create policy "Delete store discards" on public.discard_records for delete using (public.current_store_session(store_id));

create policy "Read store settings" on public.store_settings for select using (public.current_store_session(store_id));
create policy "Insert store settings" on public.store_settings for insert with check (public.current_store_session(store_id));
create policy "Update store settings" on public.store_settings for update using (public.current_store_session(store_id)) with check (public.current_store_session(store_id));

insert into public.stores(store_number, name)
select n, 'Loja ' || n::text from generate_series(1, 80) as n
on conflict (store_number) do nothing;
