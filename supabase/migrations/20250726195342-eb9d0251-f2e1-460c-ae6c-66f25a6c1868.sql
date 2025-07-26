-- Create table for import batches
CREATE TABLE public.import_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'csv' or 'tsv'
  total_events INTEGER NOT NULL DEFAULT 0,
  total_venues INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create table for staging events (before approval)
CREATE TABLE public.staging_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  start_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT,
  recurrence_pattern TEXT,
  recurrence_end_date DATE,
  price_display TEXT,
  ticket_url TEXT,
  website_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  image_url TEXT,
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  venue_city TEXT DEFAULT 'Portland',
  venue_state TEXT DEFAULT 'Oregon',
  venue_zip TEXT,
  api_source TEXT DEFAULT 'import',
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for staging venues (before approval)
CREATE TABLE public.staging_venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'Portland',
  state TEXT DEFAULT 'Oregon',
  zip_code TEXT,
  phone TEXT,
  website TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  image_urls TEXT[],
  ages TEXT DEFAULT '21+',
  api_source TEXT DEFAULT 'import',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_venues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for import_batches
CREATE POLICY "Admins can manage all import batches" 
ON public.import_batches 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own import batches" 
ON public.import_batches 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create import batches" 
ON public.import_batches 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- RLS Policies for staging_events  
CREATE POLICY "Admins can manage all staging events" 
ON public.staging_events 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view staging events from their batches" 
ON public.staging_events 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.import_batches 
  WHERE id = import_batch_id AND created_by = auth.uid()
));

CREATE POLICY "Users can create staging events" 
ON public.staging_events 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.import_batches 
  WHERE id = import_batch_id AND created_by = auth.uid()
));

-- RLS Policies for staging_venues
CREATE POLICY "Admins can manage all staging venues" 
ON public.staging_venues 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view staging venues from their batches" 
ON public.staging_venues 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.import_batches 
  WHERE id = import_batch_id AND created_by = auth.uid()
));

CREATE POLICY "Users can create staging venues" 
ON public.staging_venues 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.import_batches 
  WHERE id = import_batch_id AND created_by = auth.uid()
));

-- Create function to approve import batch
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