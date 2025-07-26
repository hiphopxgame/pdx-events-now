-- Add unique constraint for venues based on name, city, state, and zip_code
-- First check if constraint already exists and drop it if needed
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'venues_name_city_state_zip_key'
  ) THEN
    ALTER TABLE public.venues DROP CONSTRAINT venues_name_city_state_zip_key;
  END IF;
END $$;

-- Add the correct unique constraint
ALTER TABLE public.venues 
ADD CONSTRAINT venues_name_city_state_zip_key 
UNIQUE (name, city, state, zip_code);

-- Update the approve_import_batch function to handle the correct conflict resolution
CREATE OR REPLACE FUNCTION public.approve_import_batch(batch_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;