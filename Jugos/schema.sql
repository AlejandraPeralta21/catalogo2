-- Semana 3 - Backend Supabase y aislamiento multi-tenant por proyecto
-- Ejecutar en el SQL Editor solo después de revisar y respaldar el proyecto Supabase.
-- Supabase Auth administra las contraseñas; nunca se guardan en texto plano.

create table if not exists public.cuentas (
  id bigint generated always as identity primary key,
  proyecto text not null check (proyecto in ('catalogo_quimfa','catalogo_educan','catalogo_snoopy','catalogo_allin','frutiva_juices')),
  user_id uuid not null references auth.users(id) on delete cascade,
  usuario text not null,
  rol text not null check (rol in ('cliente','encargado','admin')),
  creado_en timestamptz not null default now(),
  unique (proyecto, user_id), unique (proyecto, usuario)
);

create table if not exists public.pedidos (
  id bigint generated always as identity primary key,
  proyecto text not null check (proyecto in ('catalogo_quimfa','catalogo_educan','catalogo_snoopy','catalogo_allin','frutiva_juices')),
  cliente text not null check (char_length(cliente) between 3 and 120),
  celular text not null check (celular ~ '^[0-9+ -]{7,20}$'),
  correo text not null,
  modalidad text not null check (modalidad in ('tienda','domicilio')),
  direccion text not null default '',
  forma_pago text not null default 'contra_entrega',
  monto_total numeric(10,2) not null check (monto_total >= 0),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  estado text not null default 'pendiente' check (estado in ('pendiente','confirmado','preparando','listo','entregado','cancelado')),
  creado_en timestamptz not null default now()
);

create table if not exists public.reservas (
  id bigint generated always as identity primary key,
  proyecto text not null check (proyecto in ('catalogo_quimfa','catalogo_educan','catalogo_snoopy','catalogo_allin','frutiva_juices')),
  cliente text not null, detalle_sala text not null,
  fecha_reserva date not null default current_date, horario text,
  duracion_horas integer not null default 1 check (duracion_horas between 1 and 24),
  estado text not null default 'pendiente' check (estado in ('pendiente','confirmada','cancelada')),
  creado_en timestamptz not null default now()
);

create table if not exists public.productos_extra (
  id bigint generated always as identity primary key,
  proyecto text not null check (proyecto in ('catalogo_quimfa','catalogo_educan','catalogo_snoopy','catalogo_allin','frutiva_juices')),
  nombre text not null, categoria text not null,
  precio numeric(10,2) not null check (precio >= 0), imagen text,
  activo boolean not null default true, creado_en timestamptz not null default now()
);

create table if not exists public.consultas (
  id bigint generated always as identity primary key,
  proyecto text not null check (proyecto in ('catalogo_quimfa','catalogo_educan','catalogo_snoopy','catalogo_allin','frutiva_juices')),
  cliente text not null, mensaje text not null check (char_length(mensaje) between 1 and 2000),
  respuesta text, estado text not null default 'pendiente' check (estado in ('pendiente','respondida','cerrada')),
  creado_en timestamptz not null default now()
);

create table if not exists public.promociones (
  id bigint generated always as identity primary key,
  proyecto text not null unique check (proyecto in ('catalogo_quimfa','catalogo_educan','catalogo_snoopy','catalogo_allin','frutiva_juices')),
  titulo text not null, descripcion text not null,
  precio numeric(10,2) not null check (precio >= 0),
  duracion_minutos integer not null default 15 check (duracion_minutos between 1 and 1440),
  expira_en timestamptz not null, activa boolean not null default true,
  actualizada_por uuid references auth.users(id), actualizada_en timestamptz not null default now()
);

create table if not exists public.actividad_clientes (
  id bigint generated always as identity primary key,
  proyecto text not null check (proyecto in ('catalogo_quimfa','catalogo_educan','catalogo_snoopy','catalogo_allin','frutiva_juices')),
  cliente uuid references auth.users(id) on delete set null,
  accion text not null, detalle text not null, creado_en timestamptz not null default now()
);

create or replace function public.es_personal(p_proyecto text, p_roles text[] default array['encargado','admin'])
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.cuentas c where c.user_id = auth.uid() and c.proyecto = p_proyecto and c.rol = any(p_roles));
$$;
revoke all on function public.es_personal(text, text[]) from public;
grant execute on function public.es_personal(text, text[]) to anon, authenticated;

alter table public.cuentas enable row level security;
alter table public.pedidos enable row level security;
alter table public.reservas enable row level security;
alter table public.productos_extra enable row level security;
alter table public.consultas enable row level security;
alter table public.promociones enable row level security;
alter table public.actividad_clientes enable row level security;

-- Elimina las políticas permisivas del ejemplo anterior y reduce privilegios acumulados.
drop policy if exists acceso_cuentas_anon on public.cuentas;
drop policy if exists acceso_pedidos_anon on public.pedidos;
drop policy if exists acceso_reservas_anon on public.reservas;
drop policy if exists acceso_productos_anon on public.productos_extra;
drop policy if exists acceso_consultas_anon on public.consultas;
drop policy if exists acceso_promociones_anon on public.promociones;
drop policy if exists acceso_actividad_anon on public.actividad_clientes;
revoke all on public.cuentas, public.pedidos, public.reservas, public.productos_extra, public.consultas, public.promociones, public.actividad_clientes from anon, authenticated;

drop policy if exists cuentas_admin_select on public.cuentas;
create policy cuentas_admin_select on public.cuentas for select to authenticated using (public.es_personal(proyecto, array['admin']));
drop policy if exists cuentas_self_select on public.cuentas;
create policy cuentas_self_select on public.cuentas for select to authenticated using (user_id = auth.uid());

drop policy if exists pedidos_public_insert on public.pedidos;
create policy pedidos_public_insert on public.pedidos for insert to anon, authenticated with check (proyecto = 'frutiva_juices');
drop policy if exists pedidos_staff_select on public.pedidos;
create policy pedidos_staff_select on public.pedidos for select to authenticated using (public.es_personal(proyecto));
drop policy if exists pedidos_staff_update on public.pedidos;
create policy pedidos_staff_update on public.pedidos for update to authenticated using (public.es_personal(proyecto)) with check (public.es_personal(proyecto));

drop policy if exists reservas_public_insert on public.reservas;
create policy reservas_public_insert on public.reservas for insert to anon, authenticated with check (proyecto = 'frutiva_juices');
drop policy if exists reservas_staff_select on public.reservas;
create policy reservas_staff_select on public.reservas for select to authenticated using (public.es_personal(proyecto));
drop policy if exists reservas_staff_update on public.reservas;
create policy reservas_staff_update on public.reservas for update to authenticated using (public.es_personal(proyecto)) with check (public.es_personal(proyecto));

drop policy if exists productos_public_select on public.productos_extra;
create policy productos_public_select on public.productos_extra for select to anon, authenticated using ((activo and proyecto = 'frutiva_juices') or public.es_personal(proyecto));
drop policy if exists productos_staff_write on public.productos_extra;
create policy productos_staff_write on public.productos_extra for all to authenticated using (public.es_personal(proyecto)) with check (public.es_personal(proyecto));

drop policy if exists consultas_public_insert on public.consultas;
create policy consultas_public_insert on public.consultas for insert to anon, authenticated with check (proyecto = 'frutiva_juices');
drop policy if exists consultas_staff_manage on public.consultas;
create policy consultas_staff_manage on public.consultas for all to authenticated using (public.es_personal(proyecto)) with check (public.es_personal(proyecto));

drop policy if exists promociones_public_select on public.promociones;
create policy promociones_public_select on public.promociones for select to anon, authenticated using ((activa and expira_en > now() and proyecto = 'frutiva_juices') or public.es_personal(proyecto));
drop policy if exists promociones_staff_write on public.promociones;
create policy promociones_staff_write on public.promociones for all to authenticated using (public.es_personal(proyecto)) with check (public.es_personal(proyecto));

drop policy if exists actividad_admin_read on public.actividad_clientes;
create policy actividad_admin_read on public.actividad_clientes for select to authenticated using (public.es_personal(proyecto, array['admin']));

grant select on public.productos_extra, public.promociones to anon, authenticated;
grant insert on public.pedidos, public.reservas, public.consultas to anon, authenticated;
grant select, update on public.pedidos, public.reservas to authenticated;
grant select, insert, update, delete on public.productos_extra, public.promociones, public.consultas to authenticated;
grant select on public.cuentas, public.actividad_clientes to authenticated;
