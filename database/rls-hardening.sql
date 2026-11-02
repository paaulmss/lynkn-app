-- Scoped security repair for Lynkn's Nest-only data access.
-- Requires SUPABASE_KEY=server Secret/service_role in every backend.
-- Does not install secure-workflows.sql or alter application data.
BEGIN;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.users FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO service_role;
CREATE POLICY lynkn_backend_only ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.posts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.posts TO service_role;
CREATE POLICY lynkn_backend_only ON public.posts FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.participations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.participations TO service_role;
CREATE POLICY lynkn_backend_only ON public.participations FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.messages FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO service_role;
CREATE POLICY lynkn_backend_only ON public.messages FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO service_role;
CREATE POLICY lynkn_backend_only ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.post_reports FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.post_reports TO service_role;
CREATE POLICY lynkn_backend_only ON public.post_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.post_favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.post_favorites FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.post_favorites TO service_role;
CREATE POLICY lynkn_backend_only ON public.post_favorites FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.user_follows FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_follows TO service_role;
CREATE POLICY lynkn_backend_only ON public.user_follows FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.event_categories FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_categories TO service_role;
CREATE POLICY lynkn_backend_only ON public.event_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
DO $$
DECLARE seq regclass;
BEGIN
  FOR seq IN
    SELECT DISTINCT s.oid::regclass
    FROM pg_class s
    JOIN pg_depend d ON d.objid=s.oid AND d.classid='pg_class'::regclass
    JOIN pg_class t ON t.oid=d.refobjid
    JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE s.relkind='S' AND d.deptype IN ('a','i')
      AND n.nspname='public' AND t.relname IN ('users','posts','participations','messages','notifications','post_reports','post_favorites','user_follows','event_categories')
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE %s FROM PUBLIC, anon, authenticated', seq);
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO service_role', seq);
  END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public.check_post_participation_limit() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_post_participation_limit() TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_participant(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_participant(integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.decrement_participant(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_participant(integer) TO service_role;
-- Uploads go through Nest; public image reads remain available.
DROP POLICY "Permitir subida de imágenes de posts" ON storage.objects;
COMMIT;

