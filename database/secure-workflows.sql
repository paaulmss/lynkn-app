-- Deployment script: review against the live schema before applying.
-- Run as the database owner, in one transaction. The application calls these RPCs
-- only with its server-side service_role/secret key. No SECURITY DEFINER functions.
begin;

-- The existing trigger is also invoked from RPCs with an empty search_path.
-- Qualify every relation so it remains compatible without widening privileges.
create or replace function public.check_post_participation_limit()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_count integer; v_max integer;
begin
  select count(*) into v_count from public.participations
    where post_id = NEW.post_id and status = 'accepted';
  select max_particip into v_max from public.posts where id = NEW.post_id;
  update public.posts set is_chat_active = (v_count >= v_max) where id = NEW.post_id;
  return NEW;
end;
$$;
revoke all on function public.check_post_participation_limit() from public, anon, authenticated;
grant execute on function public.check_post_participation_limit() to service_role;

create unique index if not exists lynkn_users_email_key on public.users(lower(email));
create unique index if not exists lynkn_users_username_key on public.users(lower(username));
create unique index if not exists lynkn_users_google_key on public.users(google_id) where google_id is not null;
create unique index if not exists lynkn_users_supabase_key on public.users(supabase_auth_id) where supabase_auth_id is not null;
create unique index if not exists lynkn_participations_post_user_key on public.participations(post_id, user_id);

create or replace function public.lynkn_participation(
  p_action text, p_actor_id bigint, p_post_id bigint default null,
  p_participation_id bigint default null, p_status text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_post public.posts%rowtype;
  v_part public.participations%rowtype;
  v_actor public.users%rowtype;
  v_count bigint;
  v_name text;
  v_old_status text;
  v_type text;
begin
  select * into v_actor from public.users where id = p_actor_id;
  if not found then raise exception using errcode = '42501', message = 'ACCOUNT_UNAVAILABLE'; end if;
  if p_action is null or p_action not in ('join','set','cancel') then raise exception using errcode = '22023', message = 'INVALID_ACTION'; end if;
  if p_action <> 'join' then
    select post_id into p_post_id from public.participations where id = p_participation_id;
    if not found then raise exception using errcode = 'P0002', message = 'PARTICIPATION_NOT_FOUND'; end if;
  end if;
  -- All membership changes lock the parent post first, then its participation.
  select * into v_post from public.posts where id = p_post_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'POST_NOT_FOUND'; end if;
  select count(*) into v_count from public.participations
    where post_id = p_post_id and status = 'accepted' and user_id <> v_post.user_id;

  if p_action = 'join' then
    if v_actor.role is distinct from 'admin' and v_actor.status_verif is distinct from 'approved' then
      raise exception using errcode = '42501', message = 'VERIFICATION_REQUIRED';
    end if;
    if not coalesce(v_post.is_visible, false) then raise exception using errcode = 'P0002', message = 'POST_NOT_FOUND'; end if;
    if v_post.user_id = p_actor_id then raise exception using errcode = '22023', message = 'OWNER_ALREADY_JOINED'; end if;
    select * into v_part from public.participations where post_id = p_post_id and user_id = p_actor_id for update;
    if found then return to_jsonb(v_part); end if;
    if coalesce(v_post.max_particip, 0) > 0 and v_count >= coalesce(v_post.max_particip, 0) then
      raise exception using errcode = '23514', message = 'EVENT_FULL';
    end if;
    v_part.status := case when coalesce(v_post.max_particip, 0) = 0 then 'accepted' else 'pending' end;
    insert into public.participations(post_id, user_id, status)
      values(p_post_id, p_actor_id, v_part.status)
      returning * into v_part;
    if v_part.status = 'pending' then
      insert into public.notifications(user_id, sender_id, post_id, type, is_read) values
        (v_post.user_id, p_actor_id, p_post_id, 'join_request', false),
        (p_actor_id, v_post.user_id, p_post_id, 'info_pending', false);
    else
      v_type := 'accepted';
      insert into public.notifications(user_id, sender_id, post_id, type, is_read)
        values(v_post.user_id, p_actor_id, p_post_id, 'accepted', false);
    end if;
  else
    select * into v_part from public.participations where id = p_participation_id for update;
    if not found then raise exception using errcode = 'P0002', message = 'PARTICIPATION_NOT_FOUND'; end if;
    if v_part.user_id = v_post.user_id then raise exception using errcode = '22023', message = 'OWNER_CANNOT_LEAVE'; end if;
    v_old_status := v_part.status;
    if p_action = 'cancel' then
      if v_part.user_id <> p_actor_id and v_actor.role is distinct from 'admin' then
        raise exception using errcode = '42501', message = 'PARTICIPATION_FORBIDDEN';
      end if;
      delete from public.participations where id = v_part.id;
      if v_old_status = 'accepted' then v_type := 'member_left'; end if;
    else
      if v_post.user_id is distinct from p_actor_id and v_actor.role is distinct from 'admin' then
        raise exception using errcode = '42501', message = 'OWNER_REQUIRED';
      end if;
      if p_status is null or p_status not in ('accepted','rejected') then
        raise exception using errcode = '22023', message = 'INVALID_STATUS';
      end if;
      if v_old_status = p_status then return to_jsonb(v_part); end if;
      if p_status = 'accepted' and coalesce(v_post.max_particip, 0) > 0 and v_count >= coalesce(v_post.max_particip, 0) then
        raise exception using errcode = '23514', message = 'EVENT_FULL';
      end if;
      v_part.status := p_status;
      update public.participations set status = v_part.status where id = v_part.id returning * into v_part;
      v_type := case when p_status = 'accepted' then 'accepted' when v_old_status = 'accepted' then 'kicked' else 'rejected' end;
      insert into public.notifications(user_id, sender_id, post_id, type, is_read)
        values(v_part.user_id, v_post.user_id, p_post_id, v_type, false);
      delete from public.notifications where user_id = v_post.user_id and sender_id = v_part.user_id
        and post_id = p_post_id and type = 'join_request';
    end if;
  end if;

  if v_type in ('accepted','kicked','member_left') then
    select username into v_name from public.users where id = v_part.user_id;
    insert into public.messages(post_id, sender_id, content, type) values(
      p_post_id, v_part.user_id,
      (case v_type when 'accepted' then 'SYS_USER_JOINED:' when 'kicked' then 'SYS_USER_KICKED:' else 'SYS_USER_LEFT:' end) || coalesce(v_name, ''),
      'system');
  end if;
  update public.posts set current_particip = (
    select count(*) from public.participations where post_id = p_post_id and status = 'accepted' and user_id <> v_post.user_id
  ), is_chat_active = true where id = p_post_id;
  return case when p_action = 'cancel' then '{"success":true}'::jsonb else to_jsonb(v_part) end;
end;
$$;

create or replace function public.lynkn_create_post(p_actor_id bigint, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_post public.posts%rowtype;
begin
  if not exists(select 1 from public.users where id = p_actor_id and (role = 'admin' or status_verif = 'approved')) then
    raise exception using errcode = '42501', message = 'VERIFICATION_REQUIRED';
  end if;
  insert into public.posts(title, description, image_url, user_id, lat, lng, max_particip,
    current_particip, category, event_date, status, is_visible, moderation_status)
  values(p_payload->>'title', p_payload->>'description', p_payload->>'image_url', p_actor_id,
    (p_payload->>'lat')::double precision, (p_payload->>'lng')::double precision,
    coalesce((p_payload->>'max_particip')::integer, 0), 0, p_payload->>'category',
    coalesce((p_payload->>'event_date')::timestamptz, now()), 'active', true, 'approved')
  returning * into v_post;
  insert into public.participations(post_id, user_id, status) values(v_post.id, p_actor_id, 'accepted');
  update public.posts set current_particip = 0 where id = v_post.id returning * into v_post;
  return to_jsonb(v_post);
end;
$$;

create or replace function public.lynkn_delete_post(p_post_id bigint, p_actor_id bigint)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_owner bigint;
begin
  select user_id into v_owner from public.posts where id = p_post_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'POST_NOT_FOUND'; end if;
  if not exists(select 1 from public.users where id = p_actor_id and (id = v_owner or role = 'admin')) then
    raise exception using errcode = '42501', message = 'OWNER_REQUIRED';
  end if;
  insert into public.notifications(user_id, sender_id, post_id, type, is_read)
    select distinct user_id, p_actor_id, null::bigint, 'post_deleted', false from public.participations
    where post_id = p_post_id and user_id <> v_owner;
  delete from public.notifications where post_id = p_post_id;
  delete from public.messages where post_id = p_post_id;
  delete from public.post_reports where post_id = p_post_id;
  delete from public.post_favorites where post_id = p_post_id;
  delete from public.participations where post_id = p_post_id;
  delete from public.posts where id = p_post_id;
  return '{"success":true}'::jsonb;
end;
$$;

create or replace function public.lynkn_delete_account(p_user_id bigint)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_post_id bigint; v_part_id bigint;
begin
  if not exists(select 1 from public.users where id = p_user_id) then
    raise exception using errcode = 'P0002', message = 'ACCOUNT_NOT_FOUND';
  end if;
  -- Stabilize all affected posts in ID order before deleting participations.
  perform id from public.posts where user_id = p_user_id or id in (
    select post_id from public.participations where user_id = p_user_id
  ) order by id for update;
  for v_post_id in select id from public.posts where user_id = p_user_id order by id loop
    perform public.lynkn_delete_post(v_post_id, p_user_id);
  end loop;
  for v_part_id in select id from public.participations where user_id = p_user_id order by post_id loop
    perform public.lynkn_participation('cancel', p_user_id, null, v_part_id, null);
  end loop;
  delete from public.messages where sender_id = p_user_id;
  delete from public.notifications where user_id = p_user_id or sender_id = p_user_id;
  delete from public.post_reports where reporter_id = p_user_id;
  delete from public.post_favorites where user_id = p_user_id;
  delete from public.user_follows where follower_id = p_user_id or following_id = p_user_id;
  if to_regclass('public.chats') is not null then
    execute 'delete from public.chats where user_id = $1' using p_user_id;
  end if;
  delete from public.users where id = p_user_id;
  return '{"success":true}'::jsonb;
end;
$$;

revoke all on function public.lynkn_participation(text,bigint,bigint,bigint,text) from public, anon, authenticated;
revoke all on function public.lynkn_create_post(bigint,jsonb) from public, anon, authenticated;
revoke all on function public.lynkn_delete_post(bigint,bigint) from public, anon, authenticated;
revoke all on function public.lynkn_delete_account(bigint) from public, anon, authenticated;
grant execute on function public.lynkn_participation(text,bigint,bigint,bigint,text) to service_role;
grant execute on function public.lynkn_create_post(bigint,jsonb) to service_role;
grant execute on function public.lynkn_delete_post(bigint,bigint) to service_role;
grant execute on function public.lynkn_delete_account(bigint) to service_role;

-- The browser now accesses application data through NestJS. Publishable keys
-- must not permit direct writes or reading hashes/selfies through the Data API.
do $$
declare v_table text; v_function regprocedure;
begin
  foreach v_table in array array['users','posts','participations','messages','notifications',
    'post_reports','post_favorites','user_follows','event_categories'] loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format('revoke all on table public.%I from public, anon, authenticated', v_table);
    execute format('grant select, insert, update, delete on table public.%I to service_role', v_table);
  end loop;
  for v_function in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('increment_participant','decrement_participant') loop
    execute format('revoke all on function %s from public, anon, authenticated', v_function);
  end loop;
end;
$$;
grant usage, select on all sequences in schema public to service_role;
notify pgrst, 'reload schema';
commit;
