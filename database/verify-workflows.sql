-- Integration verification with temporary users. Always run the whole file.
-- All data changes are rolled back; PostgreSQL sequences may advance.
begin;
set local role service_role;
do $test$
declare a bigint; b bigint; c bigint; d bigint; p bigint; q bigint; part bigint; result jsonb; suffix text := txid_current()::text;
begin
insert into public.users(username,email,role,status_verif) values('rpc_owner_'||suffix,'rpc_owner_'||suffix||'@example.invalid','user','approved') returning id into a;
insert into public.users(username,email,role,status_verif) values('rpc_member_'||suffix,'rpc_member_'||suffix||'@example.invalid','user','approved') returning id into b;
insert into public.users(username,email,role,status_verif) values('rpc_other_'||suffix,'rpc_other_'||suffix||'@example.invalid','user','approved') returning id into c;
insert into public.users(username,email,role,status_verif) values('rpc_unverified_'||suffix,'rpc_unverified_'||suffix||'@example.invalid','user','unverified') returning id into d;
begin perform public.lynkn_create_post(d,'{"title":"probe","lat":0,"lng":0}'::jsonb); raise exception 'Unverified creation allowed'; exception when insufficient_privilege then null; end;
result := public.lynkn_create_post(a,'{"title":"rollback probe","description":"temporary verification","category":"general","lat":0,"lng":0,"max_particip":1}'::jsonb);
p := (result->>'id')::bigint;
if (select current_particip from public.posts where id=p) <> 0 then raise exception 'Invalid initial counter'; end if;
begin perform public.lynkn_participation('join',d,p); raise exception 'Unverified join allowed'; exception when insufficient_privilege then null; end;
result := public.lynkn_participation('join',b,p); part := (result->>'id')::bigint;
perform public.lynkn_participation('join',b,p);
if (select count(*) from public.participations where post_id=p and user_id=b) <> 1 then raise exception 'Duplicate request'; end if;
begin perform public.lynkn_participation('set',b,null,part,'accepted'); raise exception 'Self approval allowed'; exception when insufficient_privilege then null; end;
perform public.lynkn_participation('set',a,null,part,'accepted');
perform public.lynkn_participation('set',a,null,part,'accepted');
if (select current_particip from public.posts where id=p) <> 1 then raise exception 'Wrong accepted counter'; end if;
begin perform public.lynkn_participation('join',c,p); raise exception 'Capacity exceeded'; exception when check_violation then null; end;
perform public.lynkn_participation('cancel',b,null,part);
if (select current_particip from public.posts where id=p) <> 0 then raise exception 'Wrong cancelled counter'; end if;
result := public.lynkn_participation('join',b,p); part := (result->>'id')::bigint;
perform public.lynkn_participation('set',a,null,part,'accepted');
result := public.lynkn_create_post(b,'{"title":"member owned rollback probe","category":"general","lat":1,"lng":1,"max_particip":2}'::jsonb);
q := (result->>'id')::bigint;
insert into public.post_favorites(user_id,post_id) values(b,p);
insert into public.user_follows(follower_id,following_id) values(b,a),(a,b);
perform public.lynkn_delete_account(b);
if exists(select 1 from public.users where id=b) or exists(select 1 from public.posts where id=q) or (select current_particip from public.posts where id=p) <> 0 then raise exception 'Incomplete account removal'; end if;
perform public.lynkn_delete_account(a);
if exists(select 1 from public.posts where id=p) then raise exception 'Owned post retained'; end if;
end $test$;
rollback;
select 'PASS: create/join/authorize/capacity/cancel/delete-account; rolled back' as result;
