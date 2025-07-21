-- Remove venue social media columns from user_events table (they don't belong there)
ALTER TABLE public.user_events 
DROP COLUMN venue_website_url,
DROP COLUMN venue_facebook_url,
DROP COLUMN venue_instagram_url,
DROP COLUMN venue_twitter_url,
DROP COLUMN venue_youtube_url;