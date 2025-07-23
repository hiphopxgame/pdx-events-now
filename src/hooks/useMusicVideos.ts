import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MusicVideo {
  id: string;
  artist_id: string;
  title: string;
  youtube_url: string;
  youtube_id: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  artist?: {
    full_name?: string;
    username?: string;
  };
}

export const useMusicVideos = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<MusicVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchMyVideos = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('music_videos')
        .select(`
          *,
          artist:por_eve_profiles(full_name, username)
        `)
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my videos:', error);
        return;
      }

      setVideos(data as MusicVideo[] || []);
    } catch (error) {
      console.error('Error fetching my videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllVideos = async (status?: 'pending' | 'approved' | 'rejected') => {
    try {
      setLoading(true);
      let query = supabase
        .from('music_videos')
        .select(`
          *,
          artist:por_eve_profiles(full_name, username)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching videos:', error);
        return [];
      }

      return data as MusicVideo[] || [];
    } catch (error) {
      console.error('Error fetching videos:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const submitVideo = async (title: string, youtubeUrl: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) throw new Error('Invalid YouTube URL');

    try {
      const { error } = await supabase
        .from('music_videos')
        .insert({
          artist_id: user.id,
          title,
          youtube_url: youtubeUrl,
          youtube_id: youtubeId,
          status: 'pending'
        });

      if (error) throw error;
      
      // Refresh videos after submission
      await fetchMyVideos();
    } catch (error) {
      console.error('Error submitting video:', error);
      throw error;
    }
  };

  const updateVideoStatus = async (
    videoId: string, 
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ) => {
    try {
      const updateData: any = {
        status,
        approved_by: user?.id,
        approved_at: new Date().toISOString()
      };

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('music_videos')
        .update(updateData)
        .eq('id', videoId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating video status:', error);
      throw error;
    }
  };

  const deleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('music_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
      
      // Refresh videos after deletion
      await fetchMyVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyVideos();
    }
  }, [user]);

  return {
    videos,
    loading,
    fetchMyVideos,
    fetchAllVideos,
    submitVideo,
    updateVideoStatus,
    deleteVideo,
    extractYouTubeId
  };
};