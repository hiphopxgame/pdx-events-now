-- Update RLS policies to require authentication for sensitive operations
-- Fix function search paths and tighten security policies

-- First, update functions to have explicit search_path
CREATE OR REPLACE FUNCTION public.handle_community_purchase(p_user_id uuid, p_cash_amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update user profile - deduct cash and increment communities owned
  UPDATE public.hiphopworld_profiles 
  SET 
    hip_hop_cash_balance = hip_hop_cash_balance + p_cash_amount,
    communities_owned = communities_owned + 1,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upgrade_to_artist()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Must be authenticated to apply for artist role';
    END IF;
    
    -- Create an artist application instead of directly adding the role
    INSERT INTO public.artist_applications (user_id, status)
    VALUES (auth.uid(), 'pending')
    ON CONFLICT (user_id) DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.format_service_name(service_slug text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE service_slug
    WHEN 'used-tires' THEN 'Used Tires'
    WHEN 'new-tires' THEN 'New Tires'
    WHEN 'tire-repair' THEN 'Tire Repair'
    WHEN 'tire-installation' THEN 'Tire Installation'
    WHEN 'tire-rotation' THEN 'Tire Rotation'
    WHEN 'tire-balancing' THEN 'Tire Balancing'
    WHEN 'flat-tire-repair' THEN 'Flat Tire Repair'
    WHEN 'wheel-alignment' THEN 'Wheel Alignment'
    WHEN 'mobile-service' THEN 'Mobile Service'
    ELSE INITCAP(REPLACE(service_slug, '-', ' '))
  END;
END;
$function$;

-- Update policies to require authentication where appropriate

-- Fix por_eve_profiles policies to require authentication for sensitive operations
DROP POLICY IF EXISTS "Public can view all profiles" ON public.por_eve_profiles;
CREATE POLICY "Users can view profiles when authenticated" 
ON public.por_eve_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix user_events policies to require authentication for viewing
DROP POLICY IF EXISTS "Users can view approved events and their own events" ON public.user_events;
CREATE POLICY "Authenticated users can view events" 
ON public.user_events 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    status = 'approved' OR 
    created_by = auth.uid() OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Fix venues policies to require authentication for viewing
DROP POLICY IF EXISTS "Anyone can view approved venues" ON public.venues;
CREATE POLICY "Authenticated users can view venues" 
ON public.venues 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    status = 'approved' OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Fix hair_styles policies to require authentication
DROP POLICY IF EXISTS "Anyone can view iwitty-hair hair styles" ON public.hair_styles;
CREATE POLICY "Authenticated users can view hair styles" 
ON public.hair_styles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND project_id = 'iwitty-hair');

-- Fix portfolio_images policies to require authentication
DROP POLICY IF EXISTS "Anyone can view iwitty-hair portfolio images" ON public.portfolio_images;
CREATE POLICY "Authenticated users can view portfolio images" 
ON public.portfolio_images 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND project_id = 'iwitty-hair');

-- Fix categories policies to require authentication
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.pdxbus_categories;
CREATE POLICY "Authenticated users can view categories" 
ON public.pdxbus_categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

DROP POLICY IF EXISTS "Categories are publicly readable" ON public.poreve_categories;
CREATE POLICY "Authenticated users can view event categories" 
ON public.poreve_categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix hiphop_bingo_profiles to require authentication
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.hiphop_bingo_profiles;
CREATE POLICY "Authenticated users can view bingo profiles" 
ON public.hiphop_bingo_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix hiphop_bingo_videos to require authentication for viewing approved videos
DROP POLICY IF EXISTS "Anyone can view approved videos" ON public.hiphop_bingo_videos;
CREATE POLICY "Authenticated users can view approved videos" 
ON public.hiphop_bingo_videos 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND status = 'approved');

-- Fix pdxbus_profiles to require authentication
DROP POLICY IF EXISTS "Anyone can view approved profiles" ON public.pdxbus_profiles;
CREATE POLICY "Authenticated users can view approved profiles" 
ON public.pdxbus_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_approved = true);

-- Fix dc_business_profiles to require authentication
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.dc_business_profiles;
CREATE POLICY "Authenticated users can view business profiles" 
ON public.dc_business_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix dc_business_discussions to require authentication
DROP POLICY IF EXISTS "Anyone can view discussions" ON public.dc_business_discussions;
CREATE POLICY "Authenticated users can view discussions" 
ON public.dc_business_discussions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix dc_business_comments to require authentication
DROP POLICY IF EXISTS "Anyone can view comments" ON public.dc_business_comments;
CREATE POLICY "Authenticated users can view comments" 
ON public.dc_business_comments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix dc_business_directory to require authentication
DROP POLICY IF EXISTS "Anyone can view approved businesses" ON public.dc_business_directory;
CREATE POLICY "Authenticated users can view approved businesses" 
ON public.dc_business_directory 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_approved = true);

-- Fix hiphopworld_communities to require authentication
DROP POLICY IF EXISTS "Anyone can view communities" ON public.hiphopworld_communities;
CREATE POLICY "Authenticated users can view communities" 
ON public.hiphopworld_communities 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix music_videos to require authentication
DROP POLICY IF EXISTS "Anyone can view approved music videos" ON public.music_videos;
CREATE POLICY "Authenticated users can view approved music videos" 
ON public.music_videos 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND status = 'approved');

-- Fix bitcoin_crypto_data to require authentication
DROP POLICY IF EXISTS "Anyone can view crypto data" ON public.bitcoin_crypto_data;
DROP POLICY IF EXISTS "Public read access for crypto data" ON public.bitcoin_crypto_data;
CREATE POLICY "Authenticated users can view crypto data" 
ON public.bitcoin_crypto_data 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix storage policies to require authentication for sensitive operations
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
CREATE POLICY "Authenticated users can view event images" 
ON storage.objects 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND bucket_id = 'event-images');

DROP POLICY IF EXISTS "Anyone can view venue images" ON storage.objects;
CREATE POLICY "Authenticated users can view venue images" 
ON storage.objects 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND bucket_id = 'venue-images');

-- Keep some policies that need to be public for legitimate reasons
-- Like API sync logs, gallery images, and portfolio images for public display

-- Update service policies to be more restrictive where appropriate
UPDATE auth.config SET password_strength_requirements_enabled = true WHERE name = 'password_strength_requirements_enabled';