-- Consolidate venues tables
-- First, migrate data from poreve_venues to venues with api_source
INSERT INTO venues (
  name, address, city, state, zip_code, phone, website,
  latitude, longitude, created_at, updated_at, status,
  facebook_url, instagram_url, twitter_url, youtube_url,
  google_place_id, api_source
)
SELECT 
  name, address, city, state, zip_code, phone, website,
  latitude, longitude, created_at, updated_at, 'approved',
  facebook_url, instagram_url, twitter_url, youtube_url,
  null, 'api'
FROM poreve_venues
WHERE NOT EXISTS (
  SELECT 1 FROM venues v WHERE v.name = poreve_venues.name
);

-- Add api_source column to venues if it doesn't exist
ALTER TABLE venues ADD COLUMN IF NOT EXISTS api_source text;

-- Consolidate events tables  
-- First, add api_source column to user_events
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS api_source text;

-- Migrate data from poreve_events to user_events
INSERT INTO user_events (
  title, description, category, venue_name, venue_address, 
  venue_city, venue_state, venue_zip, start_date, start_time,
  end_time, price_display, ticket_url, website_url,
  facebook_url, instagram_url, twitter_url, youtube_url,
  image_url, status, created_at, updated_at, api_source,
  external_id
)
SELECT 
  title, description, category, venue_name, venue_address,
  venue_city, venue_state, venue_zip, start_date::date,
  CASE 
    WHEN start_date::time != '00:00:00' THEN start_date::time
    ELSE null
  END,
  CASE 
    WHEN end_date IS NOT NULL AND end_date::time != '00:00:00' THEN end_date::time
    ELSE null
  END,
  price_display, ticket_url, website_url,
  facebook_url, instagram_url, twitter_url, youtube_url,
  image_url, 'approved', created_at, updated_at, api_source,
  external_id
FROM poreve_events
WHERE NOT EXISTS (
  SELECT 1 FROM user_events ue WHERE ue.title = poreve_events.title AND ue.start_date = poreve_events.start_date::date
);

-- Add external_id column to user_events if it doesn't exist
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS external_id text;

-- Update RLS policies for consolidated tables
-- Venues policies (allow API sources to be viewed)
DROP POLICY IF EXISTS "Anyone can view approved venues" ON venues;
CREATE POLICY "Anyone can view approved venues" 
ON venues FOR SELECT 
USING (status = 'approved' OR has_role(auth.uid(), 'admin'::app_role));

-- Events policies (allow API sources to be viewed)
DROP POLICY IF EXISTS "Anyone can view approved events" ON user_events;
CREATE POLICY "Anyone can view approved events" 
ON user_events FOR SELECT 
USING (status = 'approved' OR auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Drop the old tables after successful migration
DROP TABLE IF EXISTS poreve_venues;
DROP TABLE IF EXISTS poreve_events;