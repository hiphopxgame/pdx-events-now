import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Video, Check, X, Loader2, ExternalLink } from 'lucide-react';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';

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
  por_eve_profiles?: {
    display_name: string | null;
    username: string | null;
    full_name: string | null;
  };
}

const ManageContent = () => {
  const { toast } = useToast();
  const [content, setContent] = useState<ContentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Get all content with user profiles
      const { data, error } = await supabase
        .from('artist_content')
        .select(`
          *,
          por_eve_profiles(display_name, username, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent((data as any) || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load media',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateContentStatus = async (contentId: string, status: 'approved' | 'rejected') => {
    try {
      setUpdating(contentId);
      const { error } = await supabase
        .from('artist_content')
        .update({ status })
        .eq('id', contentId);

      if (error) throw error;

      // Update local state
      setContent(prevContent =>
        prevContent.map(item =>
          item.id === contentId ? { ...item, status } : item
        )
      );

      toast({
        title: 'Success',
        description: `Media ${status} successfully`,
      });
    } catch (error) {
      console.error('Error updating content status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update media status',
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
          <Header />
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center">
              <Video className="h-8 w-8 mr-3 text-emerald-600" />
              Manage Media
            </h1>
            <p className="text-gray-600">Review and approve artist-submitted media</p>
          </div>

          <div className="grid gap-6">
            {content.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No media submissions yet</p>
                </CardContent>
              </Card>
            ) : (
              content.map((item) => {
                const youtubeId = getYouTubeId(item.youtube_url);
                const artistName = item.por_eve_profiles?.display_name || item.por_eve_profiles?.full_name || item.por_eve_profiles?.username || 'Unknown Artist';

                return (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{item.title}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            by {artistName} • {item.category} • {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(item.status)}
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

                        {/* Actions */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Media Details</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Category:</span> {item.category}
                              </div>
                              <div>
                                <span className="font-medium">Status:</span> {item.status}
                              </div>
                              <div>
                                <span className="font-medium">Submitted:</span> {new Date(item.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {item.status === 'pending' && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-700">Actions</h4>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => updateContentStatus(item.id, 'approved')}
                                  disabled={updating === item.id}
                                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                >
                                  {updating === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <Check className="h-4 w-4 mr-2" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => updateContentStatus(item.id, 'rejected')}
                                  disabled={updating === item.id}
                                  variant="outline"
                                  className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                                >
                                  {updating === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <X className="h-4 w-4 mr-2" />
                                  )}
                                  Reject
                                </Button>
                              </div>
                            </div>
                          )}
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
    </AdminProtectedRoute>
  );
};

export default ManageContent;