-- LOCAL HARNESS ONLY. Independently authored minimal claims simulation.
-- NEVER put this file in a Supabase migration directory or execute it remotely.
DO $$ BEGIN
 IF current_database() NOT LIKE 'aishu_auth_review_%' OR inet_server_addr() IS DISTINCT FROM '127.0.0.1'::inet
 OR inet_server_port() IS DISTINCT FROM 55439 OR current_setting('data_directory') NOT LIKE '%aishu-stage-c-%/data' THEN
 RAISE EXCEPTION 'Local disposable authorization database required'; END IF;
END $$;
CREATE SCHEMA auth;
CREATE SCHEMA extensions;
CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
 SELECT NULLIF(current_setting('request.jwt.claim.role',true),'');
$$;
GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.uid(),auth.role() TO anon,authenticated,service_role;
-- Existing disposable cluster supplies database roles; this creates no roles.
