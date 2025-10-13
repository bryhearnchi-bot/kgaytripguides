-- Create comprehensive trip sections query function
-- Date: 2025-10-13
-- Description: Function to get all sections for a trip (trip_specific + always + general if assigned)

CREATE OR REPLACE FUNCTION get_trip_sections_comprehensive(p_trip_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  content TEXT,
  section_type VARCHAR(20),
  updated_by VARCHAR(255),
  updated_at TIMESTAMP,
  assignment_id INTEGER,
  order_index INTEGER,
  is_always BOOLEAN,
  is_assigned BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (tis.id)
    tis.id,
    tis.title,
    tis.content,
    tis.section_type,
    tis.updated_by,
    tis.updated_at,
    tsa.id as assignment_id,
    COALESCE(tsa.order_index, 999) as order_index,
    (tis.section_type = 'always') as is_always,
    (tsa.id IS NOT NULL) as is_assigned
  FROM trip_info_sections tis
  LEFT JOIN trip_section_assignments tsa
    ON tsa.section_id = tis.id AND tsa.trip_id = p_trip_id
  WHERE
    -- Always show "always" sections
    tis.section_type = 'always'
    OR
    -- Show assigned sections (trip_specific or general)
    tsa.trip_id = p_trip_id
  ORDER BY
    tis.id,
    COALESCE(tsa.order_index, 999) ASC,
    tis.title ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment documenting the function
COMMENT ON FUNCTION get_trip_sections_comprehensive(INTEGER) IS
'Returns all sections relevant to a specific trip: "always" sections (universal), and any sections explicitly assigned to the trip (trip_specific or general). Results include metadata about assignment status and ordering.';
