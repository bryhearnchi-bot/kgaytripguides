-- Allow super_admin in profiles.role constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE public.profiles
  ADD CONSTRAINT valid_role
  CHECK (
    role IS NULL OR role = ANY (ARRAY['user'::text,'viewer'::text,'content_manager'::text,'admin'::text,'super_admin'::text])
  );


