-- Update all venues to be created by Mental Stamina
UPDATE poreve_venues 
SET created_by = '50c27815-a68b-430a-b6ad-4a2c046d3497',
    updated_at = now()
WHERE created_by IS NULL OR created_by != '50c27815-a68b-430a-b6ad-4a2c046d3497';

-- First, add the created_by column to poreve_venues if it doesn't exist
ALTER TABLE poreve_venues 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update all existing venues to be created by Mental Stamina
UPDATE poreve_venues 
SET created_by = '50c27815-a68b-430a-b6ad-4a2c046d3497',
    updated_at = now();

-- One-time data migration: Copy social media and website info from user_events to poreve_venues
-- Only update venues where the social info is currently null or empty
UPDATE poreve_venues 
SET 
  website = COALESCE(NULLIF(poreve_venues.website, ''), user_events.website_url),
  facebook_url = COALESCE(NULLIF(poreve_venues.facebook_url, ''), user_events.facebook_url),
  instagram_url = COALESCE(NULLIF(poreve_venues.instagram_url, ''), user_events.instagram_url),
  twitter_url = COALESCE(NULLIF(poreve_venues.twitter_url, ''), user_events.twitter_url),
  youtube_url = COALESCE(NULLIF(poreve_venues.youtube_url, ''), user_events.youtube_url),
  updated_at = now()
FROM user_events 
WHERE poreve_venues.name = user_events.venue_name
  AND user_events.status = 'approved'
  AND (
    user_events.website_url IS NOT NULL OR
    user_events.facebook_url IS NOT NULL OR
    user_events.instagram_url IS NOT NULL OR
    user_events.twitter_url IS NOT NULL OR
    user_events.youtube_url IS NOT NULL
  )
  AND (
    poreve_venues.website IS NULL OR poreve_venues.website = '' OR
    poreve_venues.facebook_url IS NULL OR poreve_venues.facebook_url = '' OR
    poreve_venues.instagram_url IS NULL OR poreve_venues.instagram_url = '' OR
    poreve_venues.twitter_url IS NULL OR poreve_venues.twitter_url = '' OR
    poreve_venues.youtube_url IS NULL OR poreve_venues.youtube_url = ''
  );

-- After copying the data, clear the social media fields from user_events
UPDATE user_events 
SET 
  website_url = NULL,
  facebook_url = NULL,
  instagram_url = NULL,
  twitter_url = NULL,
  youtube_url = NULL,
  updated_at = now()
WHERE status = 'approved'
  AND (
    website_url IS NOT NULL OR
    facebook_url IS NOT NULL OR
    instagram_url IS NOT NULL OR
    twitter_url IS NOT NULL OR
    youtube_url IS NOT NULL
  );