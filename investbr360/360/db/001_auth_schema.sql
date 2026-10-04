-- Plataforma 360: autenticação e persistência por usuário
-- Aplicar em um projeto Supabase. auth.users é mantida pelo Supabase Auth.

create table if not exists public.platform360_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  auth_provider text,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.platform360_user_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_key text not null,
  state_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id,state_key)
);

create table if not exists public.platform360_consents (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  policy_version text not null,
  accepted boolean not null,
  accepted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists platform360_profiles_email_idx on public.platform360_profiles(email);
create index if not exists platform360_consents_user_idx on public.platform360_consents(user_id,accepted_at desc);

alter table public.platform360_profiles enable row level security;
alter table public.platform360_user_state enable row level security;
alter table public.platform360_consents enable row level security;

drop policy if exists "profiles_select_own" on public.platform360_profiles;
create policy "profiles_select_own" on public.platform360_profiles for select using (auth.uid()=id);
drop policy if exists "profiles_insert_own" on public.platform360_profiles;
create policy "profiles_insert_own" on public.platform360_profiles for insert with check (auth.uid()=id);
drop policy if exists "profiles_update_own" on public.platform360_profiles;
create policy "profiles_update_own" on public.platform360_profiles for update using (auth.uid()=id) with check (auth.uid()=id);

drop policy if exists "state_select_own" on public.platform360_user_state;
create policy "state_select_own" on public.platform360_user_state for select using (auth.uid()=user_id);
drop policy if exists "state_insert_own" on public.platform360_user_state;
create policy "state_insert_own" on public.platform360_user_state for insert with check (auth.uid()=user_id);
drop policy if exists "state_update_own" on public.platform360_user_state;
create policy "state_update_own" on public.platform360_user_state for update using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "state_delete_own" on public.platform360_user_state;
create policy "state_delete_own" on public.platform360_user_state for delete using (auth.uid()=user_id);

drop policy if exists "consents_select_own" on public.platform360_consents;
create policy "consents_select_own" on public.platform360_consents for select using (auth.uid()=user_id);
drop policy if exists "consents_insert_own" on public.platform360_consents;
create policy "consents_insert_own" on public.platform360_consents for insert with check (auth.uid()=user_id);

create or replace function public.platform360_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists platform360_profiles_touch on public.platform360_profiles;
create trigger platform360_profiles_touch before update on public.platform360_profiles for each row execute function public.platform360_touch_updated_at();
drop trigger if exists platform360_state_touch on public.platform360_user_state;
create trigger platform360_state_touch before update on public.platform360_user_state for each row execute function public.platform360_touch_updated_at();
