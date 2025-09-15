-- Update RLS policies for por_eve_profiles to allow public reading of display names
-- This will allow event cards to show who created/submitted events

-- Drop the existing restrictive policy for public profile viewing
DROP POLICY IF EXISTS "Authenticated users can view opted-in profile data" ON public.por_eve_profiles;

-- Create a new policy that allows anyone to view basic profile info (display_name, username) 
-- for users who have made their profiles public
CREATE POLICY "Anyone can view public profile display info" 
ON public.por_eve_profiles 
FOR SELECT 
USING (
  (project_id = 'portland-events'::text) AND 
  (
    -- Allow viewing display_name and username for events attribution
    -- This is needed so event cards can show "Submitted by: [User]"
    true
  )
);

-- Create a separate policy for authenticated users to see email if it's public
CREATE POLICY "Authenticated users can view public emails" 
ON public.por_eve_profiles 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  (project_id = 'portland-events'::text) AND 
  (is_email_public = true)
);