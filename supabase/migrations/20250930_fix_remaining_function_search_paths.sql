-- Migration: Fix search_path for remaining database functions
-- Created: 2025-09-30
-- Purpose: Fix security advisors warnings for functions without search_path

-- Fix update_charter_companies_updated_at
CREATE OR REPLACE FUNCTION public.update_charter_companies_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix count_profiles_estimated
CREATE OR REPLACE FUNCTION public.count_profiles_estimated(search_term text DEFAULT NULL, filter_role text DEFAULT NULL, filter_active boolean DEFAULT NULL)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SET search_path = public, extensions
AS $function$
DECLARE
  result BIGINT;
  total_rows BIGINT;
BEGIN
  -- For simple cases with no filters, use table statistics
  IF search_term IS NULL AND filter_role IS NULL AND filter_active IS NULL THEN
    SELECT COALESCE(reltuples::bigint, 0) INTO total_rows
    FROM pg_class WHERE relname = 'profiles';
    RETURN total_rows;
  END IF;

  -- For filtered queries, use exact count (profiles table is expected to be small)
  SELECT COUNT(*)
  INTO result
  FROM profiles p
  WHERE
    (filter_role IS NULL OR p.role = filter_role)
    AND (filter_active IS NULL OR p.is_active = filter_active)
    AND (
      search_term IS NULL
      OR (
        length(search_term) < 3 AND (
          p.username ILIKE search_term || '%'
          OR p.email ILIKE search_term || '%'
          OR p.full_name ILIKE search_term || '%'
        )
      )
      OR (
        length(search_term) >= 3 AND (
          p.username % search_term
          OR p.email % search_term
          OR p.full_name % search_term
          OR (COALESCE(p.username, '') || ' ' || COALESCE(p.email, '') || ' ' || COALESCE(p.full_name, '')) % search_term
        )
      )
    );

  RETURN COALESCE(result, 0);
END;
$function$;

-- Fix search_profiles_optimized
CREATE OR REPLACE FUNCTION public.search_profiles_optimized(search_term text DEFAULT NULL, filter_role text DEFAULT NULL, filter_active boolean DEFAULT NULL, page_limit integer DEFAULT 20, page_offset integer DEFAULT 0)
RETURNS TABLE(id uuid, username text, email text, full_name text, role text, is_active boolean, account_status text, created_at timestamp with time zone, updated_at timestamp with time zone, last_sign_in_at timestamp without time zone, search_rank real)
LANGUAGE plpgsql
STABLE
SET search_path = public, extensions
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.email,
    p.full_name,
    p.role,
    p.is_active,
    p.account_status,
    p.created_at,
    p.updated_at,
    p.last_sign_in_at,
    CASE
      WHEN search_term IS NULL THEN 0::real
      ELSE GREATEST(
        similarity(COALESCE(p.username, ''), search_term),
        similarity(COALESCE(p.email, ''), search_term),
        similarity(COALESCE(p.full_name, ''), search_term)
      )
    END as search_rank
  FROM profiles p
  WHERE
    (filter_role IS NULL OR p.role = filter_role)
    AND (filter_active IS NULL OR p.is_active = filter_active)
    AND (
      search_term IS NULL
      OR (
        length(search_term) < 3 AND (
          p.username ILIKE search_term || '%'
          OR p.email ILIKE search_term || '%'
          OR p.full_name ILIKE search_term || '%'
        )
      )
      OR (
        length(search_term) >= 3 AND (
          p.username % search_term
          OR p.email % search_term
          OR p.full_name % search_term
          OR (COALESCE(p.username, '') || ' ' || COALESCE(p.email, '') || ' ' || COALESCE(p.full_name, '')) % search_term
        )
      )
    )
  ORDER BY
    CASE WHEN search_term IS NULL THEN p.created_at END DESC,
    CASE WHEN search_term IS NOT NULL THEN search_rank END DESC,
    p.created_at DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$function$;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
BEGIN
  -- Insert into profiles table, ignore if already exists
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    role,
    is_active,
    account_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    true,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;