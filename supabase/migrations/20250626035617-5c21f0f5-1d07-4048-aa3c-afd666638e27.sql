
-- Add missing RLS policy to allow users to insert their own profiles
CREATE POLICY "Users can create their own profile" 
  ON public.por_eve_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
