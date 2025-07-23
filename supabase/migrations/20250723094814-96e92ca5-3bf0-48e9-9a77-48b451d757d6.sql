-- 1. Add 'artist' role to the app_role enum
ALTER TYPE public.app_role ADD VALUE 'artist';

-- 2. Add new social media fields to por_eve_profiles
ALTER TABLE public.por_eve_profiles 
ADD COLUMN spotify_url TEXT,
ADD COLUMN bandcamp_url TEXT,
ADD COLUMN soundcloud_url TEXT;

-- 3. Create music_videos table for artist submissions
CREATE TABLE public.music_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.por_eve_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    youtube_id TEXT NOT NULL, -- extracted from URL for embedding
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES public.por_eve_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on music_videos
ALTER TABLE public.music_videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for music_videos
CREATE POLICY "Artists can view their own music videos" 
ON public.music_videos 
FOR SELECT 
USING (auth.uid() = artist_id);

CREATE POLICY "Artists can create their own music videos" 
ON public.music_videos 
FOR INSERT 
WITH CHECK (auth.uid() = artist_id AND status = 'pending');

CREATE POLICY "Artists can update their own pending music videos" 
ON public.music_videos 
FOR UPDATE 
USING (auth.uid() = artist_id AND status = 'pending');

CREATE POLICY "Artists can delete their own pending music videos" 
ON public.music_videos 
FOR DELETE 
USING (auth.uid() = artist_id AND status = 'pending');

CREATE POLICY "Admins can manage all music videos" 
ON public.music_videos 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view approved music videos" 
ON public.music_videos 
FOR SELECT 
USING (status = 'approved');

-- Add trigger for updated_at
CREATE TRIGGER update_music_videos_updated_at
    BEFORE UPDATE ON public.music_videos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create function to allow members to upgrade to artist role
CREATE OR REPLACE FUNCTION public.upgrade_to_artist()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is currently a member
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'member'::app_role
    ) THEN
        RAISE EXCEPTION 'Only members can upgrade to artist role';
    END IF;
    
    -- Add artist role (keep member role too)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'artist'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;