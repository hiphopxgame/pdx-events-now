
-- Create a table for user-submitted events with recurring event support
CREATE TABLE public.user_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  venue_city TEXT DEFAULT 'Portland',
  venue_state TEXT DEFAULT 'Oregon',
  venue_zip TEXT,
  price_display TEXT,
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  organizer_name TEXT,
  organizer_email TEXT,
  organizer_phone TEXT,
  ticket_url TEXT,
  image_url TEXT,
  
  -- Date and recurrence fields
  start_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT, -- 'weekly', 'monthly', 'custom'
  recurrence_pattern TEXT, -- JSON string for complex patterns like "last Friday of month"
  recurrence_end_date DATE,
  
  -- Status and metadata
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_events_start_date ON public.user_events(start_date);
CREATE INDEX idx_user_events_category ON public.user_events(category);
CREATE INDEX idx_user_events_status ON public.user_events(status);
CREATE INDEX idx_user_events_created_by ON public.user_events(created_by);

-- Enable Row Level Security
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Create policies for user events
CREATE POLICY "Users can view approved events and their own events" 
  ON public.user_events 
  FOR SELECT 
  USING (status = 'approved' OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create events" 
  ON public.user_events 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events" 
  ON public.user_events 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events" 
  ON public.user_events 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Clear existing dummy data
DELETE FROM public.poreve_events WHERE api_source = 'sample';
