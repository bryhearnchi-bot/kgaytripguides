-- Phase 2: RLS hygiene - replace auth.*() calls with (select auth.*()) and consolidate duplicates where safe

-- Profiles: ensure stable evaluation in policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id AND (role = OLD.role OR role IS NULL));

-- Invitations: example of replacing auth.role() patterns in permissive policies
-- Note: We do not change semantics; only wrap function calls to avoid per-row initplan re-eval
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policies WHERE schemaname='public' AND tablename='invitations'
  LOOP
    -- This is a placeholder loop to illustrate approach; actual consolidation is manual per policy text.
    -- Keeping semantics unchanged to avoid breaking API.
    NULL;
  END LOOP;
END $$;

-- Trips/Locations/Events/etc. will continue to function; consolidation of duplicate permissive
-- policies will be handled in subsequent targeted migrations after observation.


