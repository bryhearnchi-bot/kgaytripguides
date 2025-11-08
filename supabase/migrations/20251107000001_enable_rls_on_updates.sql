-- Enable RLS on updates table
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all updates (needed for trip guide display)
CREATE POLICY "Allow authenticated read access to updates"
  ON updates
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow public (anonymous) users to read updates (for public trip guides)
CREATE POLICY "Allow public read access to updates"
  ON updates
  FOR SELECT
  TO anon
  USING (true);

-- Allow service role full access (for admin operations via backend)
CREATE POLICY "Allow service role full access to updates"
  ON updates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: INSERT, UPDATE, DELETE are handled via backend API with service_role
-- The backend validates user permissions before executing queries
