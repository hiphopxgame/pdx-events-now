-- Add city, state, zip_code fields to por_eve_profiles for artist applications
ALTER TABLE public.por_eve_profiles 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Create content categories enum
CREATE TYPE public.content_category AS ENUM ('Live Footage', 'Music Videos', 'Interviews', 'Miscellaneous');

-- Create artist_content table for video submissions
CREATE TABLE public.artist_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    category content_category NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on artist_content
ALTER TABLE public.artist_content ENABLE ROW LEVEL SECURITY;

-- Create policies for artist_content
CREATE POLICY "Artists can view their own content" 
ON public.artist_content 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Artists can create their own content" 
ON public.artist_content 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'artist'::app_role));

CREATE POLICY "Artists can update their own content" 
ON public.artist_content 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all content" 
ON public.artist_content 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view approved content" 
ON public.artist_content 
FOR SELECT 
USING (status = 'approved');

-- Add updated_at trigger for artist_content
CREATE TRIGGER update_artist_content_updated_at
    BEFORE UPDATE ON public.artist_content
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to upgrade user to artist role
CREATE OR REPLACE FUNCTION public.upgrade_to_artist()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Must be authenticated to upgrade to artist role';
    END IF;
    
    -- Add artist role (keep existing roles too)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'artist'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;