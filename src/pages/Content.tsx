import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Video, Play, Loader2 } from 'lucide-react';
import { DataField } from '@/components/DataField';
import { VideoModal } from '@/components/VideoModal';

interface ArtistMedia {
  id: string;
  title: string;
  youtube_url: string;
  category: 'Live Footage' | 'Music Videos' | 'Interviews' | 'Miscellaneous';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
}

interface MediaWithProfile extends ArtistMedia {
  profile?: {
    display_name: string | null;
    username: string | null;
    full_name: string | null;
  };
}

const Content = () => {
  const { toast } = useToast();
  const [media, setMedia] = useState<MediaWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      
      // Get approved media
      const { data: mediaData, error: mediaError } = await supabase
        .from('artist_content')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (mediaError) throw mediaError;

      // Get user profiles for the media creators
      const userIds = mediaData?.map(media => media.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('por_eve_profiles')
        .select('id, display_name, username, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine media with profiles
      const mediaWithProfiles: MediaWithProfile[] = mediaData?.map(media => {
        const profile = profilesData?.find(p => p.id === media.user_id);
        return {
          ...media,
          profile: profile ? {
            display_name: profile.display_name,
            username: profile.username,
            full_name: profile.full_name
          } : undefined
        } as MediaWithProfile;
      }) || [];

      setMedia(mediaWithProfiles);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast({
        title: 'Error',
        description: 'Failed to load media',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      'Live Footage': 'bg-red-100 text-red-800',
      'Music Videos': 'bg-blue-100 text-blue-800',
      'Interviews': 'bg-green-100 text-green-800',
      'Miscellaneous': 'bg-gray-100 text-gray-800'
    };
    return <Badge className={colors[category as keyof typeof colors] || colors.Miscellaneous}>{category}</Badge>;
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center">
            <Video className="h-8 w-8 mr-3 text-emerald-600" />
            Portland Media
          </h1>
          <p className="text-gray-600">Discover videos, live footage, and media from our community artists</p>
        </div>

        <div className="grid gap-6">
          {media.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No media available yet</p>
              </CardContent>
            </Card>
          ) : (
            media.map((item) => {
              const youtubeId = getYouTubeId(item.youtube_url);
              const artistName = item.profile?.display_name || item.profile?.full_name || item.profile?.username || 'Unknown Artist';

              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          by {artistName} • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getCategoryBadge(item.category)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Video Preview */}
                      <div>
                        {youtubeId ? (
                          <div className="relative aspect-video group cursor-pointer" 
                               onClick={() => setSelectedVideo({ url: item.youtube_url, title: item.title })}>
                            <img
                              src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                              alt={item.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
                              <Play className="h-16 w-16 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                            <p className="text-muted-foreground">Invalid video URL</p>
                          </div>
                        )}
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVideo({ url: item.youtube_url, title: item.title })}
                            className="w-full"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Watch Video
                          </Button>
                        </div>
                      </div>

                      {/* Media Info */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-foreground mb-4">Media Details</h4>
                          <div className="space-y-3">
                            <DataField
                              label="Artist"
                              value={artistName !== 'Unknown Artist' ? artistName : null}
                              placeholder="Unknown artist"
                            />
                            <DataField
                              label="Category"
                              value={item.category}
                            />
                            <DataField
                              label="Published"
                              value={new Date(item.created_at).toLocaleString()}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
      
      <Footer />
      
      {/* Video Modal */}
      <VideoModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoUrl={selectedVideo?.url || ''}
        title={selectedVideo?.title || ''}
      />
    </div>
  );
};

export default Content;