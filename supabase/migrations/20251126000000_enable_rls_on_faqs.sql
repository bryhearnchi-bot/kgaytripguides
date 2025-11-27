-- Enable Row Level Security on faqs table
-- This was identified as missing during security audit

-- Enable RLS
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (FAQs are public content)
CREATE POLICY "Public can view faqs" ON faqs
  FOR SELECT
  USING (true);

-- Allow authenticated admins to manage faqs
CREATE POLICY "Admins can insert faqs" ON faqs
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'content_manager')
  ));

CREATE POLICY "Admins can update faqs" ON faqs
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'content_manager')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'content_manager')
  ));

CREATE POLICY "Admins can delete faqs" ON faqs
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'content_manager')
  ));

-- Allow service role full access (for backend operations)
CREATE POLICY "Service role full access to faqs" ON faqs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
