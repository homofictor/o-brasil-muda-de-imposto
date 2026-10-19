alter table public.community_topics add column if not exists source_url text;
alter table public.community_topics drop constraint if exists community_topics_source_url_check;
alter table public.community_topics add constraint community_topics_source_url_check check (source_url is null or source_url ~ '^https?://');
