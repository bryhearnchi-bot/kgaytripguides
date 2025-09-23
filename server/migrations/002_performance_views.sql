-- ===============================================
-- PERFORMANCE OPTIMIZATION VIEWS
-- K-GAY Travel Guides Database
-- Created: 2025-09-23
-- ===============================================

-- ============================================
-- MATERIALIZED VIEWS FOR COMPLEX AGGREGATIONS
-- ============================================

-- Trip summary view with all counts
CREATE MATERIALIZED VIEW IF NOT EXISTS trip_summary_stats AS
SELECT
  t.id as trip_id,
  t.name as trip_name,
  t.slug as trip_slug,
  t.start_date,
  t.end_date,
  ts.status as trip_status,
  tt.trip_type,
  s.name as ship_name,
  s.cruise_line,
  -- Event counts
  COUNT(DISTINCT e.id) as event_count,
  COUNT(DISTINCT e.type) as event_type_count,
  COUNT(DISTINCT e.party_theme_id) as party_theme_count,
  -- Itinerary counts
  COUNT(DISTINCT i.id) as itinerary_stop_count,
  COUNT(DISTINCT i.location_id) as unique_location_count,
  COUNT(DISTINCT i.segment) as segment_count,
  -- Talent counts
  COUNT(DISTINCT tal.talent_id) as talent_count,
  COUNT(DISTINCT tc.category) as talent_category_count,
  -- Info sections
  COUNT(DISTINCT tis.id) as info_section_count,
  -- Calculated fields
  CASE
    WHEN t.start_date > CURRENT_DATE THEN 'upcoming'
    WHEN t.end_date < CURRENT_DATE THEN 'past'
    ELSE 'active'
  END as time_status,
  t.end_date - t.start_date + 1 as duration_days,
  -- Metadata
  t.created_at,
  t.updated_at
FROM trips t
LEFT JOIN trip_status ts ON t.trip_status_id = ts.id
LEFT JOIN trip_types tt ON t.trip_type_id = tt.id
LEFT JOIN ships s ON t.ship_id = s.id
LEFT JOIN events e ON t.id = e.trip_id
LEFT JOIN itinerary i ON t.id = i.trip_id
LEFT JOIN trip_talent tal ON t.id = tal.trip_id
LEFT JOIN talent ta ON tal.talent_id = ta.id
LEFT JOIN talent_categories tc ON ta.talent_category_id = tc.id
LEFT JOIN trip_info_sections tis ON t.id = tis.trip_id
GROUP BY
  t.id, t.name, t.slug, t.start_date, t.end_date,
  ts.status, tt.trip_type, s.name, s.cruise_line,
  t.created_at, t.updated_at;

-- Create index on materialized view
CREATE INDEX idx_trip_summary_trip_id ON trip_summary_stats(trip_id);
CREATE INDEX idx_trip_summary_slug ON trip_summary_stats(trip_slug);
CREATE INDEX idx_trip_summary_status ON trip_summary_stats(trip_status);
CREATE INDEX idx_trip_summary_dates ON trip_summary_stats(start_date, end_date);

COMMENT ON MATERIALIZED VIEW trip_summary_stats IS 'Pre-aggregated trip statistics for dashboard and listing pages';

-- ============================================
-- DASHBOARD STATISTICS VIEW
-- ============================================

CREATE OR REPLACE VIEW dashboard_overview AS
WITH trip_stats AS (
  SELECT
    COUNT(*) as total_trips,
    COUNT(CASE WHEN ts.status = 'published' THEN 1 END) as published_trips,
    COUNT(CASE WHEN ts.status = 'draft' THEN 1 END) as draft_trips,
    COUNT(CASE WHEN ts.status = 'archived' THEN 1 END) as archived_trips,
    COUNT(CASE WHEN t.start_date > CURRENT_DATE THEN 1 END) as upcoming_trips,
    COUNT(CASE WHEN t.start_date <= CURRENT_DATE AND t.end_date >= CURRENT_DATE THEN 1 END) as active_trips,
    COUNT(CASE WHEN t.end_date < CURRENT_DATE THEN 1 END) as past_trips
  FROM trips t
  JOIN trip_status ts ON t.trip_status_id = ts.id
),
event_stats AS (
  SELECT
    COUNT(*) as total_events,
    COUNT(DISTINCT trip_id) as trips_with_events,
    COUNT(DISTINCT type) as unique_event_types,
    COUNT(DISTINCT venue) as unique_venues,
    COUNT(CASE WHEN date >= CURRENT_DATE THEN 1 END) as upcoming_events
  FROM events
),
talent_stats AS (
  SELECT
    COUNT(DISTINCT t.id) as total_talent,
    COUNT(DISTINCT tc.category) as talent_categories,
    COUNT(DISTINCT tt.trip_id) as trips_with_talent,
    AVG(assignment_count) as avg_assignments_per_talent
  FROM talent t
  LEFT JOIN talent_categories tc ON t.talent_category_id = tc.id
  LEFT JOIN (
    SELECT talent_id, COUNT(*) as assignment_count
    FROM trip_talent
    GROUP BY talent_id
  ) tt ON t.id = tt.talent_id
),
location_stats AS (
  SELECT
    COUNT(*) as total_locations,
    COUNT(DISTINCT country) as unique_countries,
    COUNT(DISTINCT i.location_id) as used_locations
  FROM locations l
  LEFT JOIN itinerary i ON l.id = i.location_id
),
user_stats AS (
  SELECT
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN role = 'content_manager' THEN 1 END) as content_managers,
    COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewers,
    COUNT(CASE WHEN account_status = 'active' THEN 1 END) as active_users
  FROM profiles
)
SELECT
  json_build_object(
    'generated_at', NOW(),
    'trips', row_to_json(trip_stats),
    'events', row_to_json(event_stats),
    'talent', row_to_json(talent_stats),
    'locations', row_to_json(location_stats),
    'users', row_to_json(user_stats)
  ) as dashboard_data
FROM trip_stats, event_stats, talent_stats, location_stats, user_stats;

COMMENT ON VIEW dashboard_overview IS 'Complete dashboard statistics in a single query';

-- ============================================
-- TRIP CALENDAR VIEW
-- ============================================

CREATE OR REPLACE VIEW trip_calendar AS
SELECT
  t.id as trip_id,
  t.name as trip_name,
  t.slug as trip_slug,
  ts.status as trip_status,
  t.start_date,
  t.end_date,
  t.hero_image_url,
  -- Generate date series for calendar display
  generate_series(
    t.start_date::date,
    t.end_date::date,
    '1 day'::interval
  )::date as calendar_date,
  -- Event counts per day
  (
    SELECT COUNT(*)
    FROM events e
    WHERE e.trip_id = t.id
    AND e.date::date = generate_series(
      t.start_date::date,
      t.end_date::date,
      '1 day'::interval
    )::date
  ) as events_on_date,
  -- Check if it's a port day
  EXISTS (
    SELECT 1
    FROM itinerary i
    WHERE i.trip_id = t.id
    AND i.date::date = generate_series(
      t.start_date::date,
      t.end_date::date,
      '1 day'::interval
    )::date
  ) as has_port_stop
FROM trips t
JOIN trip_status ts ON t.trip_status_id = ts.id
WHERE ts.status = 'published'
  AND t.end_date >= CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX idx_trip_calendar_date ON trip_calendar(calendar_date);
CREATE INDEX idx_trip_calendar_trip ON trip_calendar(trip_id);

COMMENT ON VIEW trip_calendar IS 'Calendar view of trips with daily event counts';

-- ============================================
-- POPULAR CONTENT VIEW
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS popular_content AS
WITH trip_popularity AS (
  SELECT
    t.id as trip_id,
    t.name as trip_name,
    t.slug as trip_slug,
    COUNT(DISTINCT e.id) as event_count,
    COUNT(DISTINCT tt.talent_id) as talent_count,
    COUNT(DISTINCT i.location_id) as location_count,
    -- Popularity score (weighted formula)
    (
      COUNT(DISTINCT e.id) * 2 +  -- Events weighted higher
      COUNT(DISTINCT tt.talent_id) * 3 +  -- Talent weighted highest
      COUNT(DISTINCT i.location_id) * 1  -- Locations standard weight
    ) as popularity_score
  FROM trips t
  LEFT JOIN events e ON t.id = e.trip_id
  LEFT JOIN trip_talent tt ON t.id = tt.trip_id
  LEFT JOIN itinerary i ON t.id = i.trip_id
  GROUP BY t.id, t.name, t.slug
),
talent_popularity AS (
  SELECT
    t.id as talent_id,
    t.name as talent_name,
    tc.category as talent_category,
    COUNT(DISTINCT tt.trip_id) as trip_count,
    COUNT(DISTINCT et.event_id) as event_count,
    (
      COUNT(DISTINCT tt.trip_id) * 5 +  -- Trip assignments weighted high
      COUNT(DISTINCT et.event_id) * 2  -- Event appearances
    ) as popularity_score
  FROM talent t
  LEFT JOIN talent_categories tc ON t.talent_category_id = tc.id
  LEFT JOIN trip_talent tt ON t.id = tt.talent_id
  LEFT JOIN (
    SELECT DISTINCT
      (talent_ids->>'id')::int as talent_id,
      id as event_id
    FROM events,
    jsonb_array_elements(COALESCE(talent_ids, '[]'::jsonb)) as talent_ids
  ) et ON t.id = et.talent_id
  GROUP BY t.id, t.name, tc.category
),
location_popularity AS (
  SELECT
    l.id as location_id,
    l.name as location_name,
    l.country,
    COUNT(DISTINCT i.trip_id) as trip_count,
    COUNT(DISTINCT i.id) as visit_count,
    (COUNT(DISTINCT i.trip_id) * 3) as popularity_score
  FROM locations l
  LEFT JOIN itinerary i ON l.id = i.location_id
  GROUP BY l.id, l.name, l.country
)
SELECT
  'trip' as content_type,
  trip_id as content_id,
  trip_name as content_name,
  trip_slug as slug,
  NULL as category,
  popularity_score,
  event_count as related_count_1,
  talent_count as related_count_2
FROM trip_popularity
WHERE popularity_score > 0

UNION ALL

SELECT
  'talent' as content_type,
  talent_id as content_id,
  talent_name as content_name,
  NULL as slug,
  talent_category as category,
  popularity_score,
  trip_count as related_count_1,
  event_count as related_count_2
FROM talent_popularity
WHERE popularity_score > 0

UNION ALL

SELECT
  'location' as content_type,
  location_id as content_id,
  location_name as content_name,
  NULL as slug,
  country as category,
  popularity_score,
  trip_count as related_count_1,
  visit_count as related_count_2
FROM location_popularity
WHERE popularity_score > 0

ORDER BY popularity_score DESC;

CREATE INDEX idx_popular_content_type ON popular_content(content_type);
CREATE INDEX idx_popular_content_score ON popular_content(popularity_score DESC);

COMMENT ON MATERIALIZED VIEW popular_content IS 'Pre-calculated popular content across all types';

-- ============================================
-- SEARCH OPTIMIZATION VIEW
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS search_index AS
SELECT
  'trip' as entity_type,
  id as entity_id,
  name as primary_text,
  description as secondary_text,
  slug as url_slug,
  hero_image_url as image_url,
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(resort_name, '')
  ) as search_vector,
  start_date,
  end_date,
  created_at,
  updated_at
FROM trips

UNION ALL

SELECT
  'event' as entity_type,
  id as entity_id,
  title as primary_text,
  description as secondary_text,
  NULL as url_slug,
  NULL as image_url,
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(venue, '')
  ) as search_vector,
  date as start_date,
  date as end_date,
  created_at,
  updated_at
FROM events

UNION ALL

SELECT
  'talent' as entity_type,
  id as entity_id,
  name as primary_text,
  bio as secondary_text,
  NULL as url_slug,
  profile_image_url as image_url,
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(bio, '') || ' ' ||
    COALESCE(known_for, '')
  ) as search_vector,
  NULL as start_date,
  NULL as end_date,
  created_at,
  updated_at
FROM talent

UNION ALL

SELECT
  'location' as entity_type,
  id as entity_id,
  name as primary_text,
  description as secondary_text,
  NULL as url_slug,
  image_url,
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(country, '')
  ) as search_vector,
  NULL as start_date,
  NULL as end_date,
  created_at,
  updated_at
FROM locations;

-- Create GIN index for full-text search
CREATE INDEX idx_search_index_vector ON search_index USING gin(search_vector);
CREATE INDEX idx_search_index_type ON search_index(entity_type);
CREATE INDEX idx_search_index_dates ON search_index(start_date, end_date) WHERE start_date IS NOT NULL;

COMMENT ON MATERIALIZED VIEW search_index IS 'Unified search index across all searchable entities';

-- ============================================
-- REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ============================================

CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trip_summary_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_content;
  REFRESH MATERIALIZED VIEW CONCURRENTLY search_index;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_materialized_views() IS 'Refresh all materialized views - should be called periodically';

-- ============================================
-- SCHEDULED REFRESH (if pg_cron is available)
-- ============================================

-- Uncomment if pg_cron extension is installed
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('refresh-materialized-views', '*/15 * * * *', 'SELECT refresh_materialized_views();');

-- ============================================
-- QUERY PERFORMANCE TRACKING VIEW
-- ============================================

CREATE OR REPLACE VIEW query_performance AS
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  min_time,
  stddev_time,
  rows,
  100.0 * total_time / SUM(total_time) OVER () AS percentage_of_total_time,
  mean_time / NULLIF(rows/NULLIF(calls, 0), 0) as time_per_row
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_%'
  AND query NOT LIKE '%COMMIT%'
  AND query NOT LIKE '%BEGIN%'
ORDER BY total_time DESC
LIMIT 50;

COMMENT ON VIEW query_performance IS 'Top 50 queries by total execution time with performance metrics';