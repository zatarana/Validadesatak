-- SATAK.IO - funções de login e administração por PIN.

create or replace function public.login_store(input_pin text, input_store_number integer)
returns table(store_id uuid, store_name text, store_number integer, app_user_id uuid, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  found_user public.app_users%rowtype;
  found_store public.stores%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sessão não iniciada.';
  end if;

  if input_pin !~ '^[0-9]{6}$' then
    raise exception 'PIN inválido. Use 6 números.';
  end if;

  if input_store_number < 1 or input_store_number > 80 then
    raise exception 'Número de loja inválido. Use de 1 até 80.';
  end if;

  select * into found_user
  from public.app_users u
  where u.active = true
    and u.pin_hash = public.satak_pin_hash(input_pin, u.pin_salt)
  limit 1;

  if found_user.id is null then
    raise exception 'PIN inválido.';
  end if;

  select * into found_store
  from public.stores s
  where s.store_number = input_store_number
  limit 1;

  if found_store.id is null then
    raise exception 'Loja não encontrada.';
  end if;

  if found_user.role <> 'admin' and not exists (
    select 1 from public.user_store_access a
    where a.app_user_id = found_user.id
      and a.store_id = found_store.id
  ) then
    raise exception 'Usuário não vinculado a esta loja.';
  end if;

  insert into public.app_sessions(auth_user_id, app_user_id, store_id, role)
  values (auth.uid(), found_user.id, found_store.id, found_user.role)
  on conflict (auth_user_id, store_id) do update set
    app_user_id = excluded.app_user_id,
    role = excluded.role,
    created_at = now();

  insert into public.store_settings(store_id, store_name)
  values (found_store.id, found_store.name)
  on conflict (store_id) do nothing;

  return query select found_store.id, found_store.name, found_store.store_number, found_user.id, found_user.role;
end;
$$;

grant execute on function public.login_store(text, integer) to authenticated;

create or replace function public.bootstrap_admin(input_pin text, input_store_number integer)
returns table(store_id uuid, store_name text, store_number integer, app_user_id uuid, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_exists boolean;
  new_salt text;
  new_admin_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sessão não iniciada.';
  end if;

  if input_pin !~ '^[0-9]{6}$' then
    raise exception 'PIN inválido. Use 6 números.';
  end if;

  select exists(select 1 from public.app_users where role = 'admin') into admin_exists;

  if not admin_exists then
    new_salt := encode(gen_random_bytes(12), 'hex');
    insert into public.app_users(name, role, pin_salt, pin_hash, active)
    values ('Administrador', 'admin', new_salt, public.satak_pin_hash(input_pin, new_salt), true)
    returning id into new_admin_id;
  end if;

  return query select * from public.login_store(input_pin, input_store_number);
end;
$$;

grant execute on function public.bootstrap_admin(text, integer) to authenticated;

create or replace function public.admin_create_operator(input_name text, input_pin text, input_store_numbers integer[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_user_id uuid;
  new_salt text;
  target_store public.stores%rowtype;
  store_number_item integer;
begin
  if not public.current_admin_session() then
    raise exception 'Apenas admin pode criar usuários.';
  end if;

  if input_pin !~ '^[0-9]{6}$' then
    raise exception 'PIN inválido. Use 6 números.';
  end if;

  new_salt := encode(gen_random_bytes(12), 'hex');

  insert into public.app_users(name, role, pin_salt, pin_hash, active)
  values (coalesce(nullif(trim(input_name), ''), 'Operador'), 'operator', new_salt, public.satak_pin_hash(input_pin, new_salt), true)
  returning id into new_user_id;

  foreach store_number_item in array input_store_numbers loop
    if store_number_item between 1 and 80 then
      select * into target_store from public.stores where store_number = store_number_item;
      if target_store.id is not null then
        insert into public.user_store_access(app_user_id, store_id)
        values (new_user_id, target_store.id)
        on conflict do nothing;
      end if;
    end if;
  end loop;

  return new_user_id;
end;
$$;

grant execute on function public.admin_create_operator(text, text, integer[]) to authenticated;

create or replace function public.admin_list_operators()
returns table(id uuid, name text, active boolean, stores integer[])
language sql
security definer
set search_path = public
as $$
  select
    u.id,
    u.name,
    u.active,
    coalesce(array_agg(s.store_number order by s.store_number) filter (where s.store_number is not null), '{}') as stores
  from public.app_users u
  left join public.user_store_access a on a.app_user_id = u.id
  left join public.stores s on s.id = a.store_id
  where public.current_admin_session()
    and u.role = 'operator'
  group by u.id, u.name, u.active
  order by u.name;
$$;

grant execute on function public.admin_list_operators() to authenticated;

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists app_users_touch_updated_at on public.app_users;
create trigger app_users_touch_updated_at before update on public.app_users for each row execute function public.touch_updated_at();

drop trigger if exists stores_touch_updated_at on public.stores;
create trigger stores_touch_updated_at before update on public.stores for each row execute function public.touch_updated_at();

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at before update on public.products for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch_updated_at on public.store_settings;
create trigger settings_touch_updated_at before update on public.store_settings for each row execute function public.touch_updated_at();
