-- Add social media and website fields to events and venues tables

-- Add fields to poreve_events table
ALTER TABLE public.poreve_events 
ADD COLUMN facebook_url TEXT,
ADD COLUMN instagram_url TEXT,
ADD COLUMN website_url TEXT;

-- Add fields to poreve_venues table  
ALTER TABLE public.poreve_venues
ADD COLUMN facebook_url TEXT,
ADD COLUMN instagram_url TEXT;

-- Add fields to user_events table
ALTER TABLE public.user_events
ADD COLUMN facebook_url TEXT,
ADD COLUMN instagram_url TEXT,
ADD COLUMN website_url TEXT;