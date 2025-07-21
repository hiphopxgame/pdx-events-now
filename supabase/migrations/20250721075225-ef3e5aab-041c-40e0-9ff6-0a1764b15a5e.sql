-- One-time data migration: Copy social media info from events to venues
UPDATE public.venues 
SET 
  website = COALESCE(venues.website, user_events.website_url),
  facebook_url = COALESCE(venues.facebook_url, user_events.facebook_url),
  instagram_url = COALESCE(venues.instagram_url, user_events.instagram_url),
  twitter_url = COALESCE(venues.twitter_url, user_events.twitter_url),
  youtube_url = COALESCE(venues.youtube_url, user_events.youtube_url),
  updated_at = now()
FROM public.user_events
WHERE venues.name = user_events.venue_name
  AND (
    user_events.website_url IS NOT NULL OR
    user_events.facebook_url IS NOT NULL OR
    user_events.instagram_url IS NOT NULL OR
    user_events.twitter_url IS NOT NULL OR
    user_events.youtube_url IS NOT NULL
  );