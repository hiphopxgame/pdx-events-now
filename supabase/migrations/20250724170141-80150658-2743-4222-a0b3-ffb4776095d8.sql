-- Check if the admin can see all venues by updating the RLS policy
-- First, let's see the current policy details
-- Drop and recreate the admin policy to ensure it works correctly

DROP POLICY IF EXISTS "Admins can manage all venues" ON venues;

-- Create a more explicit admin policy
CREATE POLICY "Admins can manage all venues" 
ON venues 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'::app_role
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'::app_role
  )
);

-- Also update the view policy to ensure admins can see all venues
DROP POLICY IF EXISTS "Anyone can view approved venues" ON venues;

CREATE POLICY "Anyone can view approved venues" 
ON venues 
FOR SELECT 
USING (
  (status = 'approved'::text) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'::app_role
  )
);