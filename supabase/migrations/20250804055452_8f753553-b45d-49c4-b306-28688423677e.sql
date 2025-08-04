-- Create featured artists table
CREATE TABLE public.featured_artists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  website_url TEXT,
  youtube_url TEXT,
  spotify_url TEXT,
  bandcamp_url TEXT,
  apple_music_url TEXT,
  soundcloud_url TEXT,
  tiktok_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.featured_artists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active artists" 
ON public.featured_artists 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage artists" 
ON public.featured_artists 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_featured_artists_updated_at
BEFORE UPDATE ON public.featured_artists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();