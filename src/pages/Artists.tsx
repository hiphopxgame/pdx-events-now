import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Globe, Music, Play } from 'lucide-react';

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
}

const Artists: React.FC = () => {
  const [artists, setArtists] = useState<FeaturedArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_artists')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSocialLinks = (artist: FeaturedArtist) => {
    const links = [];
    
    if (artist.website_url) links.push({ url: artist.website_url, label: 'Website', icon: Globe });
    if (artist.youtube_url) links.push({ url: artist.youtube_url, label: 'YouTube', icon: Play });
    if (artist.spotify_url) links.push({ url: artist.spotify_url, label: 'Spotify', icon: Music });
    if (artist.bandcamp_url) links.push({ url: artist.bandcamp_url, label: 'Bandcamp', icon: Music });
    if (artist.apple_music_url) links.push({ url: artist.apple_music_url, label: 'Apple Music', icon: Music });
    if (artist.soundcloud_url) links.push({ url: artist.soundcloud_url, label: 'SoundCloud', icon: Music });
    if (artist.tiktok_url) links.push({ url: artist.tiktok_url, label: 'TikTok', icon: ExternalLink });
    if (artist.facebook_url) links.push({ url: artist.facebook_url, label: 'Facebook', icon: ExternalLink });
    if (artist.twitter_url) links.push({ url: artist.twitter_url, label: 'Twitter', icon: ExternalLink });

    return links;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading artists...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Featured Artists</h1>
            <p className="text-lg text-muted-foreground">
              Discover the talented artists in our Portland music community
            </p>
          </div>

          {artists.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No featured artists yet. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {artists.map((artist) => {
                const socialLinks = getSocialLinks(artist);
                
                return (
                  <Card key={artist.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      {artist.image_url ? (
                        <img
                          src={artist.image_url}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Music className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-3">{artist.name}</h3>
                      {artist.bio && (
                        <p className="text-muted-foreground mb-4 line-clamp-3">
                          {artist.bio}
                        </p>
                      )}
                      
                      {socialLinks.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Connect:</h4>
                          <div className="flex flex-wrap gap-2">
                            {socialLinks.map((link, index) => {
                              const Icon = link.icon;
                              return (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="h-8"
                                >
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                  >
                                    <Icon className="h-3 w-3" />
                                    <span className="text-xs">{link.label}</span>
                                  </a>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Artists;