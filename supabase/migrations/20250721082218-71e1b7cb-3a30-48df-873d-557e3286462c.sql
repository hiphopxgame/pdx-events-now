-- One-time migration to copy social and web links from events to venues
-- Only update venues where the links are currently null or empty

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