-- Fix function search path mutable warnings by setting search_path to 'public'
-- Update functions that don't have SET search_path configured

-- Fix on_auth_user_created function
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create user profile
  INSERT INTO public.por_eve_profiles (id, email, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)), ' ', '_'))
  );
  
  -- Assign basic user role (all new users get 'user' role by default)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- If this is the admin email, also give admin role
  IF NEW.email = 'tyronenorris@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix setup_admin_user function
CREATE OR REPLACE FUNCTION public.setup_admin_user()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find the admin user by email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'tyronenorris@gmail.com';
    
    -- If admin user exists, give them admin role
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END;
$function$;

-- Fix update_playlist_video_count function
CREATE OR REPLACE FUNCTION public.update_playlist_video_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.hiphop_bingo_playlists 
    SET video_count = video_count + 1, updated_at = now()
    WHERE id = NEW.playlist_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.hiphop_bingo_playlists 
    SET video_count = video_count - 1, updated_at = now()
    WHERE id = OLD.playlist_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix approve_import_batch function
CREATE OR REPLACE FUNCTION public.approve_import_batch(batch_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  events_moved INTEGER := 0;
  venues_moved INTEGER := 0;
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can approve import batches';
  END IF;
  
  -- Move venues to main table (with conflict resolution)
  INSERT INTO public.venues (
    name, address, city, state, zip_code, phone, website,
    facebook_url, instagram_url, twitter_url, youtube_url,
    image_urls, ages, api_source, status
  )
  SELECT DISTINCT ON (name, city, state, zip_code)
    name, address, city, state, zip_code, phone, website,
    facebook_url, instagram_url, twitter_url, youtube_url,
    image_urls, ages, api_source, 'approved'
  FROM public.staging_venues 
  WHERE import_batch_id = batch_id
  ON CONFLICT (name, city, state, zip_code) DO UPDATE SET
    address = COALESCE(EXCLUDED.address, venues.address),
    phone = COALESCE(EXCLUDED.phone, venues.phone),
    website = COALESCE(EXCLUDED.website, venues.website),
    facebook_url = COALESCE(EXCLUDED.facebook_url, venues.facebook_url),
    instagram_url = COALESCE(EXCLUDED.instagram_url, venues.instagram_url),
    twitter_url = COALESCE(EXCLUDED.twitter_url, venues.twitter_url),
    youtube_url = COALESCE(EXCLUDED.youtube_url, venues.youtube_url),
    image_urls = COALESCE(EXCLUDED.image_urls, venues.image_urls),
    updated_at = now();
  
  GET DIAGNOSTICS venues_moved = ROW_COUNT;
  
  -- Move events to main table
  INSERT INTO public.user_events (
    title, description, category, start_date, start_time, end_time,
    is_recurring, recurrence_type, recurrence_pattern, recurrence_end_date,
    price_display, ticket_url, website_url, facebook_url, instagram_url,
    twitter_url, youtube_url, image_url, venue_name, venue_address,
    venue_city, venue_state, venue_zip, api_source, external_id,
    status, created_by
  )
  SELECT 
    title, description, category, start_date, start_time, end_time,
    is_recurring, recurrence_type, recurrence_pattern, recurrence_end_date,
    price_display, ticket_url, website_url, facebook_url, instagram_url,
    twitter_url, youtube_url, image_url, venue_name, venue_address,
    venue_city, venue_state, venue_zip, api_source, external_id,
    'approved', (SELECT created_by FROM public.import_batches WHERE id = batch_id)
  FROM public.staging_events 
  WHERE import_batch_id = batch_id;
  
  GET DIAGNOSTICS events_moved = ROW_COUNT;
  
  -- Update batch status
  UPDATE public.import_batches 
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = batch_id;
  
  -- Log the approval
  RAISE NOTICE 'Import batch % approved: % events and % venues moved to live tables', 
    batch_id, events_moved, venues_moved;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;