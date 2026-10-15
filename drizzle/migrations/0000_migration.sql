
create extension if not exists pgcrypto with schema extensions;

-- ===== Roles =====
create type public.app_role as enum ('superadmin','organizador','rrpp','puerta','comprador');
create type public.event_status as enum ('borrador','en_revision','programado','publicado','venta_activa','pausado','agotado','finalizado','suspendido','cancelado','archivado');
create type public.order_status as enum ('pendiente','procesando','pagada','fallida','expirada','reembolsada_parcial','reembolsada');
create type public.ticket_status as enum ('pendiente','valida','utilizada','anulada','reembolsada','bloqueada','transferida');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  dni text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'superadmin'));
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'superadmin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());

-- signup: profile + roles. First user becomes superadmin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.email)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'comprador') on conflict do nothing;
  if not exists (select 1 from public.user_roles where role = 'superadmin') then
    insert into public.user_roles (user_id, role) values (new.id, 'superadmin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ===== Events =====
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text,
  description text,
  cover_url text,
  gallery text[] not null default '{}',
  organizer_name text,
  organizer_id uuid,
  venue text,
  address text,
  city text not null default 'San Juan',
  province text not null default 'San Juan',
  starts_at timestamptz not null,
  ends_at timestamptz,
  doors_open_at timestamptz,
  age_min int,
  entry_conditions text,
  purchase_policy text,
  refund_policy text,
  status public.event_status not null default 'borrador',
  publish_at timestamptz,
  sales_paused boolean not null default false,
  featured boolean not null default false,
  service_fee_pct numeric(5,2) not null default 10,
  replaced_by uuid references public.events(id),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.events to anon;
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "public events" on public.events for select to anon, authenticated
  using (status in ('publicado','venta_activa','pausado','agotado','finalizado'));
create policy "admin events" on public.events for all to authenticated
  using (public.has_role(auth.uid(),'superadmin')) with check (public.has_role(auth.uid(),'superadmin'));

create table public.event_staff (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null,
  role public.app_role not null default 'puerta',
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
grant select, insert, update, delete on public.event_staff to authenticated;
grant all on public.event_staff to service_role;
alter table public.event_staff enable row level security;
create policy "staff own" on public.event_staff for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'superadmin'));
create policy "staff admin" on public.event_staff for all to authenticated using (public.has_role(auth.uid(),'superadmin')) with check (public.has_role(auth.uid(),'superadmin'));

create table public.ticket_categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  benefits text,
  restrictions text,
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'ARS',
  capacity int not null default 0 check (capacity >= 0),
  sold int not null default 0,
  reserved int not null default 0,
  sale_start timestamptz,
  sale_end timestamptz,
  max_per_order int not null default 10 check (max_per_order > 0),
  visibility text not null default 'publica' check (visibility in ('publica','privada')),
  status text not null default 'activa' check (status in ('activa','pausada','oculta','agotada')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.ticket_categories to anon;
grant select, insert, update, delete on public.ticket_categories to authenticated;
grant all on public.ticket_categories to service_role;
alter table public.ticket_categories enable row level security;
create policy "public categories" on public.ticket_categories for select to anon, authenticated
  using (visibility = 'publica' and status <> 'oculta' and exists (select 1 from public.events e where e.id = event_id and e.status in ('publicado','venta_activa','pausado','agotado','finalizado')));
create policy "admin categories" on public.ticket_categories for all to authenticated
  using (public.has_role(auth.uid(),'superadmin')) with check (public.has_role(auth.uid(),'superadmin'));

-- ===== RRPP =====
create table public.rrpp (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  code text not null unique,
  commission_pct numeric(5,2) not null default 5,
  sales_goal int,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.rrpp to authenticated;
grant all on public.rrpp to service_role;
alter table public.rrpp enable row level security;
create policy "rrpp self" on public.rrpp for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'superadmin'));
create policy "rrpp admin" on public.rrpp for all to authenticated using (public.has_role(auth.uid(),'superadmin')) with check (public.has_role(auth.uid(),'superadmin'));

create table public.rrpp_payouts (
  id uuid primary key default gen_random_uuid(),
  rrpp_id uuid not null references public.rrpp(id) on delete cascade,
  amount numeric(12,2) not null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert on public.rrpp_payouts to authenticated;
grant all on public.rrpp_payouts to service_role;
alter table public.rrpp_payouts enable row level security;
create policy "payout read" on public.rrpp_payouts for select to authenticated using (public.has_role(auth.uid(),'superadmin') or exists (select 1 from public.rrpp r where r.id = rrpp_id and r.user_id = auth.uid()));
create policy "payout admin" on public.rrpp_payouts for insert to authenticated with check (public.has_role(auth.uid(),'superadmin'));

-- ===== Orders =====
create sequence public.order_number_seq start 100001;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('EGR-' || nextval('public.order_number_seq')::text),
  buyer_id uuid not null,
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text,
  buyer_dni text,
  event_id uuid not null references public.events(id),
  status public.order_status not null default 'pendiente',
  subtotal numeric(12,2) not null default 0,
  fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'ARS',
  rrpp_id uuid references public.rrpp(id),
  rrpp_commission numeric(12,2) not null default 0,
  terms_accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  paid_at timestamptz,
  payment_provider text,
  mp_preference_id text,
  mp_payment_id text,
  refunded_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders read" on public.orders for select to authenticated using (buyer_id = auth.uid() or public.has_role(auth.uid(),'superadmin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  category_id uuid not null references public.ticket_categories(id),
  category_name text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "items read" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or public.has_role(auth.uid(),'superadmin'))));

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  provider text not null,
  provider_payment_id text not null,
  status text not null,
  amount numeric(12,2) not null,
  fee_amount numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null default 0,
  currency text not null default 'ARS',
  raw jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
grant select on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "payments admin" on public.payments for select to authenticated using (public.has_role(auth.uid(),'superadmin'));

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  event_id uuid not null references public.events(id),
  category_id uuid not null references public.ticket_categories(id),
  category_name text not null,
  qr_token text not null unique,
  backup_code text not null unique,
  status public.ticket_status not null default 'valida',
  holder_name text,
  issued_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid
);
grant select on public.tickets to authenticated;
grant all on public.tickets to service_role;
alter table public.tickets enable row level security;
create policy "tickets read" on public.tickets for select to authenticated using (public.has_role(auth.uid(),'superadmin') or exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id),
  event_id uuid not null references public.events(id),
  operator_id uuid not null,
  result text not null check (result in ('valido','invalido','revision')),
  reason text not null,
  code_tail text,
  scanned_at timestamptz not null default now()
);
grant select on public.scans to authenticated;
grant all on public.scans to service_role;
alter table public.scans enable row level security;
create policy "scans read" on public.scans for select to authenticated using (operator_id = auth.uid() or public.has_role(auth.uid(),'superadmin'));

create table public.event_costs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  concept text not null,
  amount numeric(12,2) not null default 0,
  is_projection boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.event_costs to authenticated;
grant all on public.event_costs to service_role;
alter table public.event_costs enable row level security;
create policy "costs admin" on public.event_costs for all to authenticated using (public.has_role(auth.uid(),'superadmin')) with check (public.has_role(auth.uid(),'superadmin'));

create table public.audit_log (
  id bigserial primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "audit admin" on public.audit_log for select to authenticated using (public.has_role(auth.uid(),'superadmin'));

create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor_id, action, entity, entity_id, before, after)
  values (auth.uid(), lower(tg_op), tg_table_name,
    coalesce((case when tg_op='DELETE' then old.id else new.id end)::text, null),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
create trigger audit_events after insert or update or delete on public.events for each row execute function public.audit_trigger();
create trigger audit_categories after insert or update or delete on public.ticket_categories for each row execute function public.audit_trigger();
create trigger audit_rrpp after insert or update or delete on public.rrpp for each row execute function public.audit_trigger();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger touch_events before update on public.events for each row execute function public.touch_updated_at();
create trigger touch_orders before update on public.orders for each row execute function public.touch_updated_at();

-- ===== Business functions =====
create or replace function public.expire_pending_orders()
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0; r record;
begin
  for r in select id from public.orders where status = 'pendiente' and expires_at < now() for update skip locked loop
    update public.ticket_categories c set reserved = greatest(0, c.reserved - i.quantity)
      from public.order_items i where i.order_id = r.id and c.id = i.category_id;
    update public.orders set status = 'expirada' where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.create_order(p_event_id uuid, p_items jsonb, p_buyer jsonb, p_rrpp_code text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_event public.events%rowtype;
  v_item jsonb; v_cat public.ticket_categories%rowtype;
  v_qty int; v_sub numeric := 0; v_fee numeric; v_order uuid; v_rrpp uuid; v_total_qty int := 0;
begin
  if v_uid is null then raise exception 'Necesitás iniciar sesión para comprar'; end if;
  perform public.expire_pending_orders();
  select * into v_event from public.events where id = p_event_id;
  if not found then raise exception 'Evento inexistente'; end if;
  if v_event.status not in ('publicado','venta_activa') or v_event.sales_paused then raise exception 'La venta de este evento no está habilitada'; end if;
  if coalesce(trim(p_buyer->>'name'),'') = '' or coalesce(trim(p_buyer->>'email'),'') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Datos del comprador incompletos'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Seleccioná al menos una entrada'; end if;
  if p_rrpp_code is not null and p_rrpp_code <> '' then
    select id into v_rrpp from public.rrpp where upper(code) = upper(p_rrpp_code) and active;
  end if;

  insert into public.orders (buyer_id, buyer_name, buyer_email, buyer_phone, buyer_dni, event_id, rrpp_id, terms_accepted_at)
  values (v_uid, trim(p_buyer->>'name'), lower(trim(p_buyer->>'email')), p_buyer->>'phone', p_buyer->>'dni', p_event_id, v_rrpp, now())
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then continue; end if;
    select * into v_cat from public.ticket_categories where id = (v_item->>'category_id')::uuid and event_id = p_event_id for update;
    if not found then raise exception 'Categoría inválida'; end if;
    if v_cat.status <> 'activa' then raise exception 'La categoría % no está a la venta', v_cat.name; end if;
    if v_cat.sale_start is not null and now() < v_cat.sale_start then raise exception 'La venta de % todavía no comenzó', v_cat.name; end if;
    if v_cat.sale_end is not null and now() > v_cat.sale_end then raise exception 'La venta de % finalizó', v_cat.name; end if;
    if v_qty > v_cat.max_per_order then raise exception 'Máximo % entradas de % por orden', v_cat.max_per_order, v_cat.name; end if;
    if v_cat.capacity - v_cat.sold - v_cat.reserved < v_qty then raise exception 'No hay cupo suficiente en %', v_cat.name; end if;
    update public.ticket_categories set reserved = reserved + v_qty where id = v_cat.id;
    insert into public.order_items (order_id, category_id, category_name, quantity, unit_price) values (v_order, v_cat.id, v_cat.name, v_qty, v_cat.price);
    v_sub := v_sub + v_cat.price * v_qty;
    v_total_qty := v_total_qty + v_qty;
  end loop;
  if v_total_qty = 0 then raise exception 'Seleccioná al menos una entrada'; end if;
  v_fee := round(v_sub * v_event.service_fee_pct / 100, 2);
  update public.orders set subtotal = v_sub, fee = v_fee, total = v_sub + v_fee where id = v_order;
  return v_order;
end $$;
revoke all on function public.create_order(uuid, jsonb, jsonb, text) from public, anon;
grant execute on function public.create_order(uuid, jsonb, jsonb, text) to authenticated;

-- Confirm a verified payment (service role only). Idempotent.
create or replace function public.confirm_order_paid(p_order_id uuid, p_provider text, p_payment_id text, p_amount numeric, p_fee numeric, p_raw jsonb, p_actor uuid default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_order public.orders%rowtype; i record; k int; v_comm numeric := 0; v_pct numeric;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'orden inexistente'); end if;
  insert into public.payments (order_id, provider, provider_payment_id, status, amount, fee_amount, net_amount, raw, created_by)
  values (p_order_id, p_provider, p_payment_id, 'approved', p_amount, coalesce(p_fee,0), p_amount - coalesce(p_fee,0), p_raw, p_actor)
  on conflict (provider, provider_payment_id) do nothing;
  if v_order.status = 'pagada' then return jsonb_build_object('ok', true, 'already', true); end if;
  if round(p_amount, 2) <> round(v_order.total, 2) then
    return jsonb_build_object('ok', false, 'error', 'importe no coincide');
  end if;
  if v_order.status = 'expirada' then
    -- re-check stock when a late payment arrives
    for i in select * from public.order_items where order_id = p_order_id loop
      if (select capacity - sold - reserved from public.ticket_categories where id = i.category_id for update) < i.quantity then
        update public.orders set status = 'procesando' where id = p_order_id;
        return jsonb_build_object('ok', false, 'error', 'pago tardío sin cupo: requiere revisión/reembolso');
      end if;
      update public.ticket_categories set reserved = reserved + i.quantity where id = i.category_id;
    end loop;
  elsif v_order.status not in ('pendiente','procesando','fallida') then
    return jsonb_build_object('ok', false, 'error', 'estado no confirmable');
  end if;
  for i in select * from public.order_items where order_id = p_order_id loop
    update public.ticket_categories set reserved = greatest(0, reserved - i.quantity), sold = sold + i.quantity where id = i.category_id;
    for k in 1..i.quantity loop
      insert into public.tickets (order_id, event_id, category_id, category_name, qr_token, backup_code, holder_name)
      values (p_order_id, v_order.event_id, i.category_id, i.category_name,
        encode(extensions.gen_random_bytes(24), 'hex'),
        upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 10)),
        v_order.buyer_name);
    end loop;
  end loop;
  if v_order.rrpp_id is not null then
    select commission_pct into v_pct from public.rrpp where id = v_order.rrpp_id;
    v_comm := round(v_order.subtotal * coalesce(v_pct,0) / 100, 2);
  end if;
  update public.orders set status = 'pagada', paid_at = now(), payment_provider = p_provider,
    mp_payment_id = case when p_provider = 'mercadopago' then p_payment_id else mp_payment_id end,
    rrpp_commission = v_comm where id = p_order_id;
  insert into public.audit_log (actor_id, action, entity, entity_id, after) values (p_actor, 'pago_confirmado', 'orders', p_order_id::text, jsonb_build_object('provider', p_provider, 'payment_id', p_payment_id, 'amount', p_amount));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.confirm_order_paid(uuid, text, text, numeric, numeric, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.confirm_order_paid(uuid, text, text, numeric, numeric, jsonb, uuid) to service_role;

-- Refund (admin, after provider verification) — voids tickets, releases stock, adjusts commission
create or replace function public.mark_order_refunded(p_order_id uuid, p_amount numeric, p_actor uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype; i record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.status <> 'pagada' then return jsonb_build_object('ok', false, 'error', 'Solo órdenes pagadas'); end if;
  for i in select * from public.order_items where order_id = p_order_id loop
    update public.ticket_categories set sold = greatest(0, sold - i.quantity) where id = i.category_id;
  end loop;
  update public.tickets set status = 'reembolsada' where order_id = p_order_id and status in ('valida','pendiente');
  update public.orders set status = case when p_amount < total then 'reembolsada_parcial'::order_status else 'reembolsada'::order_status end,
    refunded_amount = p_amount, rrpp_commission = 0 where id = p_order_id;
  insert into public.audit_log (actor_id, action, entity, entity_id, after) values (p_actor, 'reembolso', 'orders', p_order_id::text, jsonb_build_object('amount', p_amount));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.mark_order_refunded(uuid, numeric, uuid) from public, anon, authenticated;
grant execute on function public.mark_order_refunded(uuid, numeric, uuid) to service_role;

-- Atomic access validation
create or replace function public.scan_ticket(p_event_id uuid, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); t public.tickets%rowtype; v_status order_status; v_code text := trim(p_code);
  v_result text; v_reason text; v_first timestamptz;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  if not (public.has_role(v_uid,'superadmin') or exists (select 1 from public.event_staff where event_id = p_event_id and user_id = v_uid)) then
    raise exception 'No tenés permiso para controlar este evento';
  end if;
  select * into t from public.tickets where qr_token = lower(v_code) or backup_code = upper(v_code) for update;
  if not found then
    v_result := 'invalido'; v_reason := 'Código inexistente';
  else
    select status into v_status from public.orders where id = t.order_id;
    if t.event_id <> p_event_id then v_result := 'invalido'; v_reason := 'La entrada pertenece a otro evento';
    elsif v_status <> 'pagada' then v_result := 'invalido'; v_reason := 'La orden no está pagada';
    elsif t.status = 'utilizada' then v_result := 'invalido'; v_reason := 'Entrada ya utilizada'; v_first := t.used_at;
    elsif t.status in ('anulada','reembolsada','bloqueada','transferida') then v_result := 'invalido'; v_reason := 'Entrada ' || t.status::text;
    elsif t.status <> 'valida' then v_result := 'revision'; v_reason := 'Estado requiere revisión';
    else
      update public.tickets set status = 'utilizada', used_at = now(), used_by = v_uid where id = t.id;
      v_result := 'valido'; v_reason := 'Acceso autorizado';
    end if;
  end if;
  insert into public.scans (ticket_id, event_id, operator_id, result, reason, code_tail)
  values (t.id, p_event_id, v_uid, v_result, v_reason, right(v_code, 4));
  return jsonb_build_object('result', v_result, 'reason', v_reason, 'category', t.category_name, 'holder', t.holder_name, 'first_used_at', v_first, 'backup_code', t.backup_code);
end $$;
revoke all on function public.scan_ticket(uuid, text) from public, anon;
grant execute on function public.scan_ticket(uuid, text) to authenticated;

create or replace function public.duplicate_event(p_event_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_new uuid; e public.events%rowtype;
begin
  if not public.has_role(auth.uid(),'superadmin') then raise exception 'Sin permiso'; end if;
  select * into e from public.events where id = p_event_id;
  insert into public.events (slug, name, short_description, description, cover_url, gallery, organizer_name, organizer_id, venue, address, city, province, starts_at, ends_at, doors_open_at, age_min, entry_conditions, purchase_policy, refund_policy, status, service_fee_pct, created_by)
  values (e.slug || '-copia-' || substr(gen_random_uuid()::text,1,6), e.name || ' (copia)', e.short_description, e.description, e.cover_url, e.gallery, e.organizer_name, e.organizer_id, e.venue, e.address, e.city, e.province, e.starts_at, e.ends_at, e.doors_open_at, e.age_min, e.entry_conditions, e.purchase_policy, e.refund_policy, 'borrador', e.service_fee_pct, auth.uid())
  returning id into v_new;
  insert into public.ticket_categories (event_id, name, description, benefits, restrictions, price, currency, capacity, sale_start, sale_end, max_per_order, visibility, status, sort_order)
  select v_new, name, description, benefits, restrictions, price, currency, capacity, sale_start, sale_end, max_per_order, visibility, status, sort_order from public.ticket_categories where event_id = p_event_id;
  return v_new;
end $$;
grant execute on function public.duplicate_event(uuid) to authenticated;

create or replace function public.event_impact(p_event_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public.has_role(auth.uid(),'superadmin') then null else jsonb_build_object(
    'tickets_sold', (select count(*) from public.tickets where event_id = p_event_id and status in ('valida','utilizada')),
    'pending_orders', (select count(*) from public.orders where event_id = p_event_id and status = 'pendiente'),
    'paid_orders', (select count(*) from public.orders where event_id = p_event_id and status = 'pagada'),
    'buyers', (select count(distinct buyer_email) from public.orders where event_id = p_event_id and status = 'pagada')
  ) end
$$;
grant execute on function public.event_impact(uuid) to authenticated;

create or replace function public.admin_dashboard(p_from timestamptz default null, p_to timestamptz default null, p_event uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.has_role(auth.uid(),'superadmin') then raise exception 'Sin permiso'; end if;
  with o as (
    select * from public.orders where (p_event is null or event_id = p_event)
      and (p_from is null or created_at >= p_from) and (p_to is null or created_at < p_to)
  )
  select jsonb_build_object(
    'active_events', (select count(*) from public.events where status in ('publicado','venta_activa') and (p_event is null or id = p_event)),
    'upcoming_events', (select count(*) from public.events where starts_at > now() and status not in ('cancelado','archivado','borrador') and (p_event is null or id = p_event)),
    'tickets_sold', (select coalesce(sum(sold),0) from public.ticket_categories where p_event is null or event_id = p_event),
    'tickets_available', (select coalesce(sum(capacity - sold - reserved),0) from public.ticket_categories where p_event is null or event_id = p_event),
    'pending_orders', (select count(*) from o where status = 'pendiente'),
    'paid_orders', (select count(*) from o where status = 'pagada'),
    'gross', (select coalesce(sum(total),0) from o where status in ('pagada','reembolsada_parcial','reembolsada')),
    'fees', (select coalesce(sum(fee),0) from o where status in ('pagada','reembolsada_parcial')),
    'rrpp_commissions', (select coalesce(sum(rrpp_commission),0) from o where status = 'pagada'),
    'refunds', (select coalesce(sum(refunded_amount),0) from o),
    'provider_fees', (select coalesce(sum(p.fee_amount),0) from public.payments p join o on o.id = p.order_id),
    'net_credited', (select coalesce(sum(p.net_amount),0) from public.payments p join o on o.id = p.order_id where p.provider = 'mercadopago'),
    'access_count', (select count(*) from public.scans where result = 'valido' and (p_event is null or event_id = p_event)),
    'daily', (select coalesce(jsonb_agg(d order by d->>'day'),'[]'::jsonb) from (
       select jsonb_build_object('day', to_char(date_trunc('day', paid_at at time zone 'America/Argentina/San_Juan'),'YYYY-MM-DD'), 'total', sum(total), 'orders', count(*)) d
       from o where status = 'pagada' and paid_at is not null group by 1) x)
  ) into r;
  return r;
end $$;
grant execute on function public.admin_dashboard(timestamptz, timestamptz, uuid) to authenticated;

create or replace function public.admin_set_role(p_email text, p_role public.app_role, p_grant boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.has_role(auth.uid(),'superadmin') then raise exception 'Sin permiso'; end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'No existe un usuario con ese correo'); end if;
  if p_grant then insert into public.user_roles (user_id, role) values (v_user, p_role) on conflict do nothing;
  else
    if p_role = 'superadmin' and v_user = auth.uid() then return jsonb_build_object('ok', false, 'error', 'No podés quitarte tu propio rol de superadmin'); end if;
    delete from public.user_roles where user_id = v_user and role = p_role;
  end if;
  insert into public.audit_log (actor_id, action, entity, entity_id, after) values (auth.uid(), case when p_grant then 'rol_asignado' else 'rol_quitado' end, 'user_roles', v_user::text, jsonb_build_object('role', p_role));
  return jsonb_build_object('ok', true, 'user_id', v_user);
end $$;
grant execute on function public.admin_set_role(text, public.app_role, boolean) to authenticated;

create or replace function public.admin_list_users()
returns table (user_id uuid, email text, full_name text, roles text[], created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'superadmin') then raise exception 'Sin permiso'; end if;
  return query select p.id, p.email, p.full_name, coalesce(array_agg(r.role::text) filter (where r.role is not null), '{}'), p.created_at
    from public.profiles p left join public.user_roles r on r.user_id = p.id group by p.id order by p.created_at desc;
end $$;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_assign_staff(p_event_id uuid, p_email text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.has_role(auth.uid(),'superadmin') then raise exception 'Sin permiso'; end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'No existe un usuario con ese correo'); end if;
  insert into public.event_staff (event_id, user_id) values (p_event_id, v_user) on conflict do nothing;
  insert into public.user_roles (user_id, role) values (v_user, 'puerta') on conflict do nothing;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.admin_assign_staff(uuid, text) to authenticated;

create or replace function public.rrpp_my_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'name', r.name, 'code', r.code, 'commission_pct', r.commission_pct, 'sales_goal', r.sales_goal, 'active', r.active,
    'paid_orders', (select count(*) from public.orders o where o.rrpp_id = r.id and o.status = 'pagada'),
    'tickets', (select coalesce(sum(i.quantity),0) from public.orders o join public.order_items i on i.order_id = o.id where o.rrpp_id = r.id and o.status = 'pagada'),
    'sales', (select coalesce(sum(o.subtotal),0) from public.orders o where o.rrpp_id = r.id and o.status = 'pagada'),
    'commission', (select coalesce(sum(o.rrpp_commission),0) from public.orders o where o.rrpp_id = r.id and o.status = 'pagada'),
    'paid_out', (select coalesce(sum(p.amount),0) from public.rrpp_payouts p where p.rrpp_id = r.id)
  )), '[]'::jsonb) from public.rrpp r where r.user_id = auth.uid() or public.has_role(auth.uid(),'superadmin')
$$;
grant execute on function public.rrpp_my_stats() to authenticated;

create or replace function public.admin_link_rrpp_user(p_rrpp_id uuid, p_email text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.has_role(auth.uid(),'superadmin') then raise exception 'Sin permiso'; end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'No existe un usuario con ese correo'); end if;
  update public.rrpp set user_id = v_user where id = p_rrpp_id;
  insert into public.user_roles (user_id, role) values (v_user, 'rrpp') on conflict do nothing;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.admin_link_rrpp_user(uuid, text) to authenticated;

-- ===== Seed demo events =====
insert into public.events (id, slug, name, short_description, description, cover_url, organizer_name, venue, address, starts_at, ends_at, age_min, entry_conditions, refund_policy, status, featured) values
('11111111-1111-4111-8111-111111111111','fiesta-egresados-2026-san-juan','Fiesta de Egresados 2026','La noche más esperada de la promo 2026.','Una producción completa con DJs en vivo, pantallas LED, cotillón y fotógrafos. Pensada para egresados y egresadas de toda la provincia.','/images/event-egresados.jpg','EGRESANTOS Producciones','Estadio Aldo Cantoni','Av. Ignacio de la Roza 1500, Capital','2026-12-05 23:00:00-03','2026-12-06 06:00:00-03',17,'Ingreso con DNI físico. Prohibido el ingreso de bebidas.','Devoluciones hasta 10 días antes del evento, descontando cargos de servicio.','venta_activa',true),
('22222222-2222-4222-8222-222222222222','festival-cuyo-sonoro','Festival Cuyo Sonoro','Dos escenarios, doce bandas, una noche.','Festival al aire libre con artistas nacionales y regionales. Patio gastronómico y zona de descanso.','/images/event-festival.jpg','Cuyo Sonoro','Autódromo El Zonda','Ruta 12, Rivadavia','2026-11-21 18:00:00-03','2026-11-22 04:00:00-03',16,'Menores de 18 acompañados por un adulto.','No se realizan devoluciones salvo cancelación del evento.','venta_activa',true),
('33333333-3333-4333-8333-333333333333','noche-de-gala-promo','Noche de Gala Promo 26','Cena show y fiesta para egresados.','Cena de tres pasos, show en vivo y fiesta hasta el amanecer.','/images/event-gala.jpg','EGRESANTOS Producciones','Centro de Convenciones Barrena Guzmán','Av. Paula A. de Sarmiento 2000','2026-12-12 21:30:00-03','2026-12-13 05:00:00-03',17,'Vestimenta formal. DNI obligatorio.','Devoluciones hasta 15 días antes del evento.','publicado',true);

insert into public.ticket_categories (event_id, name, description, benefits, price, capacity, max_per_order, sort_order) values
('11111111-1111-4111-8111-111111111111','Early Bird','Primera tanda, cupo limitado.','Ingreso general',18000,300,6,1),
('11111111-1111-4111-8111-111111111111','General','Acceso general al evento.','Ingreso general',25000,1500,10,2),
('11111111-1111-4111-8111-111111111111','General VIP','Sector VIP con barra exclusiva.','Barra VIP, ingreso preferencial',42000,300,6,3),
('22222222-2222-4222-8222-222222222222','Preventa','Precio especial de lanzamiento.','Acceso a ambos escenarios',15000,800,8,1),
('22222222-2222-4222-8222-222222222222','General','Acceso a ambos escenarios.','Acceso a ambos escenarios',22000,3000,10,2),
('22222222-2222-4222-8222-222222222222','Premium','Plataforma elevada y sanitarios exclusivos.','Plataforma, baños exclusivos, merch',38000,250,4,3),
('33333333-3333-4333-8333-333333333333','Cena + Fiesta','Incluye cena de tres pasos.','Cena y fiesta',55000,400,10,1),
('33333333-3333-4333-8333-333333333333','Solo Fiesta','Ingreso desde las 01:00.','Fiesta',28000,600,10,2);
