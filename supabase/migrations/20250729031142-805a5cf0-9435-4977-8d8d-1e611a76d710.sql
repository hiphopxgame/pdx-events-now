-- Create donations table to track donation information
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  stripe_session_id TEXT UNIQUE,
  amount INTEGER NOT NULL,             -- Amount donated (in cents)
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',       -- 'pending', 'completed', 'failed'
  donor_name TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own donations
CREATE POLICY "view_own_donations" ON public.donations
  FOR SELECT
  USING (user_id = auth.uid() OR email = auth.email());

-- Create policy for edge functions to insert donations
CREATE POLICY "insert_donations" ON public.donations
  FOR INSERT
  WITH CHECK (true);

-- Create policy for edge functions to update donations
CREATE POLICY "update_donations" ON public.donations
  FOR UPDATE
  USING (true);