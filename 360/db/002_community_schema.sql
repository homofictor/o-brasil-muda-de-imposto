-- Comunidade da Reforma Tributária
-- Leitura pública, participação apenas para usuários autenticados.

create extension if not exists pgcrypto;

create table if not exists public.community_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  role text not null default 'member' check (role in ('member','moderator','admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.community_profiles(user_id) on delete cascade,
  category text not null check (category in ('geral','ibs-cbs','simples','split-payment','credito','precos-margens','capital-de-giro','documentos-fiscais','setorial')),
  title text not null check (char_length(title) between 8 and 180),
  body text not null check (char_length(body) between 20 and 6000),
  status text not null default 'published' check (status in ('published','under_review','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.community_topics(id) on delete cascade,
  user_id uuid not null references public.community_profiles(user_id) on delete cascade,
  body text not null check (char_length(body) between 2 and 4000),
  status text not null default 'published' check (status in ('published','under_review','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_reports (
  id bigserial primary key,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references public.community_topics(id) on delete cascade,
  reply_id uuid references public.community_replies(id) on delete cascade,
  reason text not null check (char_length(reason) between 4 and 500),
  created_at timestamptz not null default now(),
  check ((topic_id is not null and reply_id is null) or (topic_id is null and reply_id is not null))
);

create index if not exists community_topics_activity_idx on public.community_topics(last_activity_at desc);
create index if not exists community_topics_category_idx on public.community_topics(category,last_activity_at desc);
create index if not exists community_replies_topic_idx on public.community_replies(topic_id,created_at asc);
create index if not exists community_reports_created_idx on public.community_reports(created_at desc);

create or replace function public.community_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.community_touch_topic_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.community_topics
  set last_activity_at = now()
  where id = new.topic_id;
  return new;
end;
$$;

drop trigger if exists community_profiles_touch on public.community_profiles;
create trigger community_profiles_touch
before update on public.community_profiles
for each row execute function public.community_touch_updated_at();

drop trigger if exists community_topics_touch on public.community_topics;
create trigger community_topics_touch
before update on public.community_topics
for each row execute function public.community_touch_updated_at();

drop trigger if exists community_replies_touch on public.community_replies;
create trigger community_replies_touch
before update on public.community_replies
for each row execute function public.community_touch_updated_at();

drop trigger if exists community_replies_activity on public.community_replies;
create trigger community_replies_activity
after insert on public.community_replies
for each row execute function public.community_touch_topic_activity();

alter table public.community_profiles enable row level security;
alter table public.community_topics enable row level security;
alter table public.community_replies enable row level security;
alter table public.community_reports enable row level security;

grant select on public.community_profiles to anon, authenticated;
grant insert, update on public.community_profiles to authenticated;

grant select on public.community_topics to anon, authenticated;
grant insert, update, delete on public.community_topics to authenticated;

grant select on public.community_replies to anon, authenticated;
grant insert, update, delete on public.community_replies to authenticated;

grant insert on public.community_reports to authenticated;
grant usage, select on sequence public.community_reports_id_seq to authenticated;

drop policy if exists "community_profiles_public_read" on public.community_profiles;
create policy "community_profiles_public_read"
on public.community_profiles for select
to anon, authenticated
using (is_active = true);

drop policy if exists "community_profiles_insert_own" on public.community_profiles;
create policy "community_profiles_insert_own"
on public.community_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id and role = 'member');

drop policy if exists "community_profiles_update_own" on public.community_profiles;
create policy "community_profiles_update_own"
on public.community_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and role = 'member');

drop policy if exists "community_topics_public_read" on public.community_topics;
create policy "community_topics_public_read"
on public.community_topics for select
to anon, authenticated
using (status = 'published' or (select auth.uid()) = user_id);

drop policy if exists "community_topics_insert_own" on public.community_topics;
create policy "community_topics_insert_own"
on public.community_topics for insert
to authenticated
with check ((select auth.uid()) = user_id and status = 'published');

drop policy if exists "community_topics_update_own" on public.community_topics;
create policy "community_topics_update_own"
on public.community_topics for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and status = 'published');

drop policy if exists "community_topics_delete_own" on public.community_topics;
create policy "community_topics_delete_own"
on public.community_topics for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "community_replies_public_read" on public.community_replies;
create policy "community_replies_public_read"
on public.community_replies for select
to anon, authenticated
using (status = 'published' or (select auth.uid()) = user_id);

drop policy if exists "community_replies_insert_own" on public.community_replies;
create policy "community_replies_insert_own"
on public.community_replies for insert
to authenticated
with check ((select auth.uid()) = user_id and status = 'published');

drop policy if exists "community_replies_update_own" on public.community_replies;
create policy "community_replies_update_own"
on public.community_replies for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and status = 'published');

drop policy if exists "community_replies_delete_own" on public.community_replies;
create policy "community_replies_delete_own"
on public.community_replies for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "community_reports_insert_own" on public.community_reports;
create policy "community_reports_insert_own"
on public.community_reports for insert
to authenticated
with check ((select auth.uid()) = reporter_user_id);
