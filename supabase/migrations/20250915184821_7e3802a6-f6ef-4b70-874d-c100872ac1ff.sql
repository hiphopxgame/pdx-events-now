-- Update RLS policy to allow reading display names for approved events
DROP POLICY IF EXISTS "Anyone can view public profile display info" ON public.por_eve_profiles;

-- Create a new policy that allows reading display names for users who created approved events
CREATE POLICY "Anyone can view profile display info for approved events" 
ON public.por_eve_profiles 
FOR SELECT 
USING (
  (project_id = 'portland-events'::text) 
  AND 
  (
    -- Allow reading display_name and username for users who have created approved events
    EXISTS (
      SELECT 1 FROM user_events 
      WHERE user_events.created_by = por_eve_profiles.id 
      AND user_events.status = 'approved'
    )
    OR 
    -- Allow users to read their own complete profile
    auth.uid() = id
  )
);