-- Phase 1: Safe DB Hardening
-- 1) Lock function search_path for security
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public, auth, extensions';
  END IF;
END $$;

-- 2) Index for audit log foreign key (no-op if already exists)
CREATE INDEX IF NOT EXISTS security_audit_log_user_id_idx
  ON public.security_audit_log(user_id);

-- 3) Remove duplicate/legacy indexes (safe if they exist)
DROP INDEX IF EXISTS public.ports_name_key;
DROP INDEX IF EXISTS public.talent_talent_category_id_idx;


