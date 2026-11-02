const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
let db;
before(async () => {
  db = new PGlite();
  await db.exec(fs.readFileSync(path.join(__dirname, 'fixtures/schema.sql'), 'utf8'));
  await db.exec(fs.readFileSync(path.join(__dirname, '../../database/secure-workflows.sql'), 'utf8'));
  await db.exec(fs.readFileSync(path.join(__dirname, '../../database/legacy-function-hardening.sql'), 'utf8'));
  // Reproduce the backend-only public schema access model deployed in Supabase.
  await db.exec(fs.readFileSync(path.join(__dirname, '../../database/public-schema-hardening.sql'), 'utf8'));
});
after(async () => { await db?.close(); });
async function seed() {
  await db.exec("truncate users, posts, participations, messages, notifications, post_reports, post_favorites, user_follows restart identity cascade");
  await db.exec("insert into users(id,username,email) values (1,'owner','owner@test'),(2,'member','member@test'),(3,'other','other@test')");
  await db.query("select lynkn_create_post(1, $1::jsonb)", [JSON.stringify({ title:'event',description:'test',lat:0,lng:0,category:'general',max_particip:1 })]);
}
test('post creation includes its organizer and preserves zero coordinates', async () => {
  await seed();
  assert.equal((await db.query('select count(*)::int as n from participations')).rows[0].n, 1);
  assert.equal((await db.query('select lat from posts')).rows[0].lat, 0);
});
test('request and approval are idempotent and enforce capacity', async () => {
  await seed();
  const part = (await db.query("select lynkn_participation('join',2,1) as result")).rows[0].result;
  await db.query("select lynkn_participation('join',2,1)");
  assert.equal((await db.query('select count(*)::int as n from participations where user_id=2')).rows[0].n,1);
  await db.query("select lynkn_participation('set',1,null,$1,'accepted')", [part.id]);
  await db.query("select lynkn_participation('set',1,null,$1,'accepted')", [part.id]);
  assert.equal((await db.query('select current_particip from posts')).rows[0].current_particip,1);
  await assert.rejects(db.query("select lynkn_participation('join',3,1)"), /EVENT_FULL/);
});
test('a participant cannot approve themselves or cancel someone else', async () => {
  await seed();
  const part = (await db.query("select lynkn_participation('join',2,1) as result")).rows[0].result;
  await assert.rejects(db.query("select lynkn_participation('set',2,null,$1,'accepted')", [part.id]), /OWNER_REQUIRED/);
  await assert.rejects(db.query("select lynkn_participation('cancel',3,null,$1)", [part.id]), /PARTICIPATION_FORBIDDEN/);
});
test('notification failure rolls back the participation and counter together', async () => {
  await seed();
  await db.exec("alter table notifications add constraint reject_test_notification check (type <> 'join_request')");
  try {
    await assert.rejects(db.query("select lynkn_participation('join',2,1)"));
    assert.equal((await db.query('select count(*)::int as n from participations where user_id=2')).rows[0].n,0);
    assert.equal((await db.query('select current_particip from posts')).rows[0].current_particip,0);
  } finally { await db.exec('alter table notifications drop constraint reject_test_notification'); }
});
test('cancellation frees capacity without decrementing twice', async () => {
  await seed();
  const part = (await db.query("select lynkn_participation('join',2,1) as result")).rows[0].result;
  await db.query("select lynkn_participation('set',1,null,$1,'accepted')", [part.id]);
  await db.query("select lynkn_participation('cancel',2,null,$1)", [part.id]);
  await assert.rejects(db.query("select lynkn_participation('cancel',2,null,$1)", [part.id]), /PARTICIPATION_NOT_FOUND/);
  assert.equal((await db.query('select current_particip from posts')).rows[0].current_particip,0);
});
test('deleting a post requires ownership and removes dependent records atomically', async () => {
  await seed();
  await db.query("select lynkn_participation('join',2,1)");
  await assert.rejects(db.query('select lynkn_delete_post(1,2)'), /OWNER_REQUIRED/);
  await db.query('select lynkn_delete_post(1,1)');
  assert.equal((await db.query('select count(*)::int as n from posts')).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int as n from participations')).rows[0].n,0);
});
test('deleting a member preserves the event and releases capacity', async () => {
  await seed();
  const part = (await db.query("select lynkn_participation('join',2,1) as result")).rows[0].result;
  await db.query("select lynkn_participation('set',1,null,$1,'accepted')", [part.id]);
  await db.query('select lynkn_delete_account(2)');
  assert.equal((await db.query('select current_particip from posts')).rows[0].current_particip,0);
  assert.equal((await db.query('select count(*)::int as n from users where id=2')).rows[0].n,0);
});
test('anonymous clients cannot call privileged workflows or read user rows', async () => {
  await seed();
  await db.exec('set role anon');
  try {
    await assert.rejects(db.query("select public.lynkn_participation('join',2,1)"), /permission denied/);
    await assert.rejects(db.query('select * from public.users'), /permission denied/);
  } finally { await db.exec('reset role'); }
});

test('public schema blocks extension-style broad grants for both client roles', async () => {
  await db.exec('create table public.extension_probe(id int); grant all on public.extension_probe to public, anon, authenticated');
  await db.exec('create function public.extension_probe_rpc() returns int language sql security definer as $$ select 1 $$; grant execute on function public.extension_probe_rpc() to public, anon, authenticated');
  try {
    for (const role of ['anon', 'authenticated']) {
      await db.exec('set role ' + role);
      try {
        await assert.rejects(db.exec('select * from public.extension_probe'), /permission denied for schema public/);
        await assert.rejects(db.exec('insert into public.extension_probe values(1)'), /permission denied for schema public/);
        await assert.rejects(db.exec('select public.extension_probe_rpc()'), /permission denied for schema public/);
      } finally { await db.exec('reset role'); }
    }
  } finally { await db.exec('drop function public.extension_probe_rpc(); drop table public.extension_probe'); }
});

test('backend retains schema access and workflow execution', async () => {
  await seed();
  await db.exec('set role service_role');
  try {
    assert.equal((await db.query('select count(*)::int as n from public.posts')).rows[0].n, 1);
    await db.exec('select public.increment_participant(1); select public.decrement_participant(1)');
    assert.equal((await db.query('select current_particip from public.posts where id=1')).rows[0].current_particip, 0);
    await db.exec('select public.lynkn_delete_post(1,1)');
  } finally { await db.exec('reset role'); }
});
