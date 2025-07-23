-- Add city, state, and zip code fields to por_eve_profiles table for artist applications
ALTER TABLE public.por_eve_profiles 
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN zip_code text;