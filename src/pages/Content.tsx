import React, { useState, useEffect, useRef } from 'react';
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
import { EnhancedPagination } from '@/components/EnhancedPagination';

interface ArtistContent {
  id: string;
  title: string;
  youtube_url: string;
  category: 'Live Footage' | 'Music Videos' | 'Interviews' | 'Miscellaneous';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
}

interface ContentWithProfile extends ArtistContent {
  profile?: {
    display_name: string | null;
    username: string | null;
  };
}

const Content = () => {
  const { toast } = useToast();
  const [content, setContent] = useState<ContentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<{url: string; title: string} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const scrollTargetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Get approved content
      const { data: contentData, error: contentError } = await supabase
        .from('artist_content')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (contentError) throw contentError;

      // Get user profiles for the content creators
      const userIds = contentData?.map(content => content.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('por_eve_profiles')
        .select('id, display_name, username')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine content with profiles
      const contentWithProfiles: ContentWithProfile[] = contentData?.map(content => {
        const profile = profilesData?.find(p => p.id === content.user_id);
        return {
          ...content,
          profile: profile ? {
            display_name: profile.display_name,
            username: profile.username
          } : undefined
        } as ContentWithProfile;
      }) || [];

      setContent(contentWithProfiles);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content',
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
            Portland Content
          </h1>
          <p className="text-gray-600">Discover videos, live footage, and content from our community artists</p>
        </div>

        {/* Per-page selector at the top */}
        <div className="mb-6">
          <EnhancedPagination
            currentPage={currentPage}
            totalItems={content.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            scrollTargetRef={scrollTargetRef}
          />
        </div>

        {/* Add ref for scroll target */}
        <div ref={(el) => { if (el) scrollTargetRef.current = el; }} />
        
        <div className="grid gap-6">
          {content.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No content available yet</p>
              </CardContent>
            </Card>
          ) : (
            content.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => {
              const youtubeId = getYouTubeId(item.youtube_url);
              const artistName = item.profile?.display_name || item.profile?.username || 'Unknown Artist';

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
                      {/* YouTube Embed */}
                      <div>
                        {youtubeId ? (
                          <div className="aspect-video">
                            <iframe
                              src={`https://www.youtube.com/embed/${youtubeId}`}
                              title={item.title}
                              className="w-full h-full rounded-lg"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                            <p className="text-gray-500">Invalid YouTube URL</p>
                          </div>
                        )}
                        <div className="mt-4">
                          <Button
                            onClick={() => setSelectedVideo({url: item.youtube_url, title: item.title})}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Play
                          </Button>
                        </div>
                      </div>

                      {/* Content Info */}
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
        
        {content.length > 0 && (
          <EnhancedPagination
            currentPage={currentPage}
            totalItems={content.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            scrollTargetRef={scrollTargetRef}
          />
        )}
      </div>
      
      {selectedVideo && (
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          youtubeUrl={selectedVideo.url}
          title={selectedVideo.title}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default Content;