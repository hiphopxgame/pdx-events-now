-- Create artist application queue table
CREATE TABLE public.artist_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.artist_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own applications"
ON public.artist_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
ON public.artist_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all applications"
ON public.artist_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update the upgrade_to_artist function to create an application instead
CREATE OR REPLACE FUNCTION public.upgrade_to_artist()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;