
-- Create events table to store event data from APIs
CREATE TABLE public.poreve_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL, -- ID from the external API (Eventbrite, Ticketmaster, etc.)
  api_source TEXT NOT NULL, -- Which API the event came from
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  venue_city TEXT DEFAULT 'Portland',
  venue_state TEXT DEFAULT 'Oregon',
  venue_zip TEXT,
  category TEXT NOT NULL,
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  price_display TEXT, -- For display like "Free", "$25-$50", etc.
  image_url TEXT,
  ticket_url TEXT,
  organizer_name TEXT,
  organizer_url TEXT,
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(external_id, api_source)
);

-- Create venues table for venue information
CREATE TABLE public.poreve_venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'Portland',
  state TEXT DEFAULT 'Oregon',
  zip_code TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  phone TEXT,
  website TEXT,
  capacity INTEGER,
  venue_type TEXT, -- theater, club, outdoor, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table for event categories
CREATE TABLE public.poreve_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#10B981', -- Default emerald color
  icon TEXT, -- Lucide icon name
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create API sync log table to track API calls and sync status
CREATE TABLE public.poreve_api_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_source TEXT NOT NULL,
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'manual'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'success', 'error'
  events_processed INTEGER DEFAULT 0,
  events_added INTEGER DEFAULT 0,
  events_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Insert default categories
INSERT INTO public.poreve_categories (name, slug, description, color, icon) VALUES
('Music', 'music', 'Concerts, festivals, and live music events', '#8B5CF6', 'Music'),
('Food & Drink', 'food-drink', 'Food festivals, tastings, and culinary events', '#F59E0B', 'UtensilsCrossed'),
('Arts & Culture', 'arts-culture', 'Art shows, theater, museums, and cultural events', '#EC4899', 'Palette'),
('Technology', 'technology', 'Tech meetups, conferences, and workshops', '#3B82F6', 'Laptop'),
('Outdoor', 'outdoor', 'Hiking, sports, and outdoor activities', '#10B981', 'Trees'),
('Entertainment', 'entertainment', 'Comedy shows, movies, and general entertainment', '#F59E0B', 'Theater'),
('Sports', 'sports', 'Sporting events and athletic competitions', '#EF4444', 'Trophy'),
('Business', 'business', 'Networking events, conferences, and professional meetups', '#6B7280', 'Briefcase'),
('Family', 'family', 'Kid-friendly and family-oriented events', '#06B6D4', 'Users'),
('Health & Wellness', 'health-wellness', 'Fitness, yoga, meditation, and wellness events', '#84CC16', 'Heart');

-- Create indexes for better performance
CREATE INDEX idx_poreve_events_start_date ON public.poreve_events(start_date);
CREATE INDEX idx_poreve_events_category ON public.poreve_events(category);
CREATE INDEX idx_poreve_events_api_source ON public.poreve_events(api_source);
CREATE INDEX idx_poreve_events_venue_name ON public.poreve_events(venue_name);
CREATE INDEX idx_poreve_events_active ON public.poreve_events(is_active);

-- Enable Row Level Security (make events publicly readable)
ALTER TABLE public.poreve_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poreve_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poreve_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poreve_api_sync_log ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Events are publicly readable" ON public.poreve_events FOR SELECT USING (true);
CREATE POLICY "Venues are publicly readable" ON public.poreve_venues FOR SELECT USING (true);
CREATE POLICY "Categories are publicly readable" ON public.poreve_categories FOR SELECT USING (true);
CREATE POLICY "API sync logs are publicly readable" ON public.poreve_api_sync_log FOR SELECT USING (true);
