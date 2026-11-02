-- Applied 2026-11-02: restrict_public_schema_for_backend_only_app.
-- Requires the backend-only access model; direct Supabase clients are blocked.
begin;
revoke all on schema public from public, anon, authenticated;
grant usage on schema public to service_role;
notify pgrst, 'reload schema';
commit;
