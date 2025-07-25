-- Phase 1: Fix duplicate RLS policies and secure user_roles table

-- Drop the duplicate admin policy first
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;

-- Keep the cleaner "Admins can manage all roles" policy and ensure it's comprehensive
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create a single, comprehensive admin policy for user_roles
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure users can only view their own roles (not others)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Add more restrictive venue policies to prevent unauthorized venue creation
DROP POLICY IF EXISTS "Users can suggest venue changes" ON public.venues;
CREATE POLICY "Authenticated users can suggest venues"
ON public.venues
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND status = 'pending'::text
  AND approved_by IS NULL
);

-- Secure the artist_content table better
DROP POLICY IF EXISTS "Artists can create their own content" ON public.artist_content;
CREATE POLICY "Verified artists can create content"
ON public.artist_content
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'artist'::app_role)
  AND status = 'pending'::text
);