import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Video, ExternalLink, Loader2 } from 'lucide-react';

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
    full_name: string | null;
  };
}

const Content = () => {
  const { toast } = useToast();
  const [content, setContent] = useState<ContentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Get approved content with user profiles
      const { data, error } = await supabase
        .from('artist_content')
        .select(`
          *,
          profile:por_eve_profiles(display_name, username, full_name)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent((data as any) || []);
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
            Artist Content
          </h1>
          <p className="text-gray-600">Discover videos, live footage, and content from our community artists</p>
        </div>

        <div className="grid gap-6">
          {content.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No content available yet</p>
              </CardContent>
            </Card>
          ) : (
            content.map((item) => {
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
                          <a
                            href={item.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View on YouTube
                          </a>
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Content Details</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Artist:</span> {artistName}
                            </div>
                            <div>
                              <span className="font-medium">Category:</span> {item.category}
                            </div>
                            <div>
                              <span className="font-medium">Published:</span> {new Date(item.created_at).toLocaleString()}
                            </div>
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
    </div>
  );
};

export default Content;