-- Add missing social media fields to por_eve_profiles
ALTER TABLE public.por_eve_profiles 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS youtube_url text;

-- Add missing social media fields to venues table
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS youtube_url text;

-- Add missing social media fields to poreve_venues table  
ALTER TABLE public.poreve_venues 
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS youtube_url text;

-- Add missing social media fields to user_events table
ALTER TABLE public.user_events 
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS youtube_url text;

-- Add missing social media fields to poreve_events table
ALTER TABLE public.poreve_events 
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS youtube_url text;

-- Update por_eve_profiles table to make email not publicly accessible by default
-- Add a is_email_public field to control email visibility
ALTER TABLE public.por_eve_profiles 
ADD COLUMN IF NOT EXISTS is_email_public boolean DEFAULT false;

-- Create updated RLS policies for por_eve_profiles to hide emails unless public
DROP POLICY IF EXISTS "Users can view their own profile" ON public.por_eve_profiles;
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.por_eve_profiles;

-- Users can view their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.por_eve_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Public can view profiles but with limited email access
CREATE POLICY "Public can view profiles with limited data" 
ON public.por_eve_profiles 
FOR SELECT 
USING (id != auth.uid() AND (is_email_public = true OR email IS NULL));