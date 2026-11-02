-- Explicit search_path and backend-only execution for two legacy counter RPCs.
-- No extension is dropped or moved; application data is unchanged.
begin;
create or replace function public.increment_participant(row_id integer)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.posts set current_particip = current_particip + 1 where id = row_id;
end;
$$;
create or replace function public.decrement_participant(row_id integer)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.posts set current_particip = greatest(0, current_particip - 1) where id = row_id;
end;
$$;
revoke all on function public.increment_participant(integer) from public, anon, authenticated;
revoke all on function public.decrement_participant(integer) from public, anon, authenticated;
grant execute on function public.increment_participant(integer) to service_role;
grant execute on function public.decrement_participant(integer) to service_role;
notify pgrst, 'reload schema';
commit;
