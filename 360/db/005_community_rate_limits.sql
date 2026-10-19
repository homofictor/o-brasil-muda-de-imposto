-- Limites básicos anti-spam para a Comunidade da Reforma

create or replace function public.community_limit_topic_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.community_topics
    where user_id = new.user_id
      and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'Limite temporário de novas discussões atingido. Tente novamente mais tarde.';
  end if;
  return new;
end;
$$;

create or replace function public.community_limit_reply_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.community_replies
    where user_id = new.user_id
      and created_at > now() - interval '1 hour'
  ) >= 30 then
    raise exception 'Limite temporário de respostas atingido. Tente novamente mais tarde.';
  end if;
  return new;
end;
$$;

create or replace function public.community_limit_report_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.community_reports
    where reporter_user_id = new.reporter_user_id
      and created_at > now() - interval '24 hours'
  ) >= 20 then
    raise exception 'Limite temporário de reportes atingido.';
  end if;

  if new.topic_id is not null and exists (
    select 1 from public.community_reports
    where reporter_user_id = new.reporter_user_id
      and topic_id = new.topic_id
      and created_at > now() - interval '24 hours'
  ) then
    raise exception 'Este tópico já foi reportado recentemente por esta conta.';
  end if;

  if new.reply_id is not null and exists (
    select 1 from public.community_reports
    where reporter_user_id = new.reporter_user_id
      and reply_id = new.reply_id
      and created_at > now() - interval '24 hours'
  ) then
    raise exception 'Esta resposta já foi reportada recentemente por esta conta.';
  end if;

  return new;
end;
$$;

drop trigger if exists community_topic_rate_limit on public.community_topics;
create trigger community_topic_rate_limit
before insert on public.community_topics
for each row execute function public.community_limit_topic_rate();

drop trigger if exists community_reply_rate_limit on public.community_replies;
create trigger community_reply_rate_limit
before insert on public.community_replies
for each row execute function public.community_limit_reply_rate();

drop trigger if exists community_report_rate_limit on public.community_reports;
create trigger community_report_rate_limit
before insert on public.community_reports
for each row execute function public.community_limit_report_rate();

revoke all on function public.community_limit_topic_rate() from public, anon, authenticated;
revoke all on function public.community_limit_reply_rate() from public, anon, authenticated;
revoke all on function public.community_limit_report_rate() from public, anon, authenticated;
grant execute on function public.community_limit_topic_rate() to service_role;
grant execute on function public.community_limit_reply_rate() to service_role;
grant execute on function public.community_limit_report_rate() to service_role;
