import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArtistForm } from '@/components/ArtistForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import { Pencil, Trash2, Eye, Music, Globe } from 'lucide-react';

interface FeaturedArtist {
  id: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  website_url: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
  bandcamp_url: string | null;
  apple_music_url: string | null;
  soundcloud_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const AdminArtists: React.FC = () => {
  const [artists, setArtists] = useState<FeaturedArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_artists')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error('Error fetching artists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load artists',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleArtistStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('featured_artists')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Artist ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      fetchArtists();
    } catch (error) {
      console.error('Error updating artist status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update artist status',
        variant: 'destructive',
      });
    }
  };

  const deleteArtist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artist?')) return;

    try {
      const { error } = await supabase
        .from('featured_artists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Artist deleted successfully',
      });

      fetchArtists();
    } catch (error) {
      console.error('Error deleting artist:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete artist',
        variant: 'destructive',
      });
    }
  };

  const getSocialLinkCount = (artist: FeaturedArtist) => {
    const links = [
      artist.website_url,
      artist.youtube_url,
      artist.spotify_url,
      artist.bandcamp_url,
      artist.apple_music_url,
      artist.soundcloud_url,
      artist.tiktok_url,
      artist.facebook_url,
      artist.twitter_url,
    ].filter(Boolean);
    return links.length;
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Featured Artists Management</h1>
                <p className="text-muted-foreground">
                  Manage artists showcased on the platform
                </p>
              </div>
              <Button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2"
              >
                <Music className="h-4 w-4" />
                {showForm ? 'Hide Form' : 'Add Artist'}
              </Button>
            </div>

            {showForm && (
              <div className="mb-8">
                <ArtistForm
                  onSuccess={() => {
                    setShowForm(false);
                    fetchArtists();
                  }}
                />
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">Loading artists...</div>
            ) : (
              <div className="space-y-4">
                {artists.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg text-muted-foreground">No artists added yet</p>
                      <p className="text-sm text-muted-foreground">
                        Add your first featured artist to get started
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  artists.map((artist) => (
                    <Card key={artist.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {artist.image_url ? (
                              <img
                                src={artist.image_url}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold">{artist.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={artist.is_active ? 'default' : 'secondary'}>
                                    {artist.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <Badge variant="outline">
                                    {getSocialLinkCount(artist)} social links
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleArtistStatus(artist.id, artist.is_active)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteArtist(artist.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {artist.bio && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {artist.bio}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span>Order: {artist.display_order}</span>
                              <span>Created: {new Date(artist.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </AdminProtectedRoute>
  );
};

export default AdminArtists;