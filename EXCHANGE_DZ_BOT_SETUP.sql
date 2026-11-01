-- EXCHANGE DZ Telegram Admin: settings table
-- Run once in Supabase SQL Editor. Existing orders and admin_users tables are untouched.

create table if not exists public.exchange_settings (
  id boolean primary key default true check (id = true),
  usdt_rate numeric(12,2) not null default 240 check (usdt_rate > 0),
  orders_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.exchange_settings (id, usdt_rate, orders_enabled)
values (true, 240, true)
on conflict (id) do nothing;

-- Keep this table private. The Telegram server function will access it using
-- SUPABASE_SERVICE_ROLE_KEY stored only in Vercel Environment Variables.
alter table public.exchange_settings enable row level security;
revoke all on table public.exchange_settings from anon, authenticated;
grant all on table public.exchange_settings to service_role;


-- Public website reads only these two safe settings through this function.
create or replace function public.get_public_exchange_settings()
returns table (usdt_rate numeric, orders_enabled boolean)
language sql
stable
security definer
set search_path = public
as $$
  select usdt_rate, orders_enabled
  from public.exchange_settings
  where id = true
  limit 1;
$$;
revoke all on function public.get_public_exchange_settings() from public;
grant execute on function public.get_public_exchange_settings() to anon, authenticated;
