-- Add venue social media columns to user_events table
ALTER TABLE public.user_events 
ADD COLUMN venue_website_url TEXT,
ADD COLUMN venue_facebook_url TEXT,
ADD COLUMN venue_instagram_url TEXT,
ADD COLUMN venue_twitter_url TEXT,
ADD COLUMN venue_youtube_url TEXT;