create role anon; create role authenticated; create role service_role bypassrls;
create table public.users(id bigint primary key, username text not null unique, email text, google_id text, supabase_auth_id uuid, role text not null default 'user', status_verif text not null default 'approved');
create table public.posts(
 id bigserial primary key, user_id bigint references users(id), title text, description text, image_url text,
 lat double precision, lng double precision, max_particip integer not null default 0, current_particip integer not null default 0,
 category text, event_date timestamptz, status text, is_visible boolean default true, moderation_status text, is_chat_active boolean default false
);
create table public.participations(id bigserial primary key, post_id bigint references posts(id), user_id bigint references users(id), status text);
create table public.messages(id bigserial primary key, post_id bigint references posts(id), sender_id bigint references users(id), content text, type text, sent_at timestamptz default now());
create table public.notifications(id bigserial primary key, user_id bigint references users(id), sender_id bigint references users(id), post_id bigint references posts(id), type text, is_read boolean, created_at timestamptz default now());
create table public.post_reports(id bigserial primary key, post_id bigint references posts(id), reporter_id bigint references users(id));
create table public.post_favorites(id bigserial primary key, post_id bigint references posts(id), user_id bigint references users(id));
create table public.user_follows(id bigserial primary key, follower_id bigint references users(id), following_id bigint references users(id));
create table public.event_categories(slug text primary key);
-- Reproduce the legacy hosted trigger: the deployment must replace its body
-- with schema-qualified references before RPCs call it under search_path=''.
create function public.check_post_participation_limit() returns trigger language plpgsql as $$
begin
  update posts set is_chat_active = false where id = NEW.post_id;
  return NEW;
end;
$$;
create trigger tr_check_participation_limit after insert or update of status
on public.participations for each row execute function public.check_post_participation_limit();
