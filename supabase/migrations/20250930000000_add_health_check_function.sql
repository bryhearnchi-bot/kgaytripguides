-- Migration: Add health_check function for monitoring
-- Date: 2025-09-30
-- Purpose: Provide a simple health check function for the monitoring system

-- Create health_check function
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Simple health check that returns database status
  -- This function is called by the /healthz endpoint
  RETURN jsonb_build_object(
    'status', 'ok',
    'timestamp', NOW(),
    'database', 'connected',
    'version', version()
  );
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION public.health_check() TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.health_check() IS
'Health check function for monitoring system. Returns database status and connection info.';