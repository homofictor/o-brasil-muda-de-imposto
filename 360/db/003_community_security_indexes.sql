-- Ajustes de segurança e desempenho da Comunidade da Reforma

revoke all on function public.community_touch_topic_activity() from public, anon, authenticated;
grant execute on function public.community_touch_topic_activity() to service_role;

create index if not exists community_topics_user_idx on public.community_topics(user_id);
create index if not exists community_replies_user_idx on public.community_replies(user_id);
create index if not exists community_reports_reporter_idx on public.community_reports(reporter_user_id);
create index if not exists community_reports_topic_idx on public.community_reports(topic_id);
create index if not exists community_reports_reply_idx on public.community_reports(reply_id);
