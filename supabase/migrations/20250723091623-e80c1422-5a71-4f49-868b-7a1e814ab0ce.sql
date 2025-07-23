-- Fix avatar upload policies
-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create comprehensive avatar upload policies
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Also allow admins to manage all avatars
CREATE POLICY "Admins can manage all avatars" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'::app_role));