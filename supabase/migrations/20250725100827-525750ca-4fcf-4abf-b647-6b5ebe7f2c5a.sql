-- Add new columns first
ALTER TABLE venues ADD COLUMN IF NOT EXISTS api_source text;
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS api_source text;
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS external_id text;

-- Consolidate venues tables
-- Migrate data from poreve_venues to venues with api_source
INSERT INTO venues (
  name, address, city, state, zip_code, phone, website,
  latitude, longitude, created_at, updated_at, status,
  facebook_url, instagram_url, twitter_url, youtube_url,
  api_source
)
SELECT 
  name, address, city, state, zip_code, phone, website,
  latitude, longitude, created_at, updated_at, 'approved',
  facebook_url, instagram_url, twitter_url, youtube_url,
  'api'
FROM poreve_venues
WHERE NOT EXISTS (
  SELECT 1 FROM venues v WHERE v.name = poreve_venues.name
);

-- Consolidate events tables  
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

-- Drop the old tables after successful migration
DROP TABLE IF EXISTS poreve_venues;
DROP TABLE IF EXISTS poreve_events;