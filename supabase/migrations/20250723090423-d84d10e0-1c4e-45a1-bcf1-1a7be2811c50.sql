-- Update RLS policies for por_eve_profiles to show all profiles in community page
-- while still protecting email privacy based on is_email_public setting

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Public can view profiles with limited data" ON public.por_eve_profiles;

-- Create a new policy that allows viewing all profiles but respects email privacy
CREATE POLICY "Public can view all profiles" 
ON public.por_eve_profiles 
FOR SELECT 
USING (true);

-- Note: Email privacy is now handled at the application level based on is_email_public field