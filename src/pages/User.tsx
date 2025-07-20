import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Globe, Facebook, Instagram, Youtube } from 'lucide-react';
import { Twitter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEvents } from '@/hooks/useEvents';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  is_email_public: boolean;
  created_at: string;
}

const User = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: allEvents = [] } = useEvents();

  // Get user's events
  const userEvents = allEvents.filter(event => event.created_by === userId);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('por_eve_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSocialLinks = () => {
    if (!profile) return [];
    
    const links = [];
    if (profile.website_url) links.push({ icon: Globe, url: profile.website_url, label: 'Website' });
    if (profile.facebook_url) links.push({ icon: Facebook, url: profile.facebook_url, label: 'Facebook' });
    if (profile.instagram_url) links.push({ icon: Instagram, url: profile.instagram_url, label: 'Instagram' });
    if (profile.twitter_url) links.push({ icon: Twitter, url: profile.twitter_url, label: 'Twitter' });
    if (profile.youtube_url) links.push({ icon: Youtube, url: profile.youtube_url, label: 'YouTube' });
    return links;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        <div className="flex justify-center items-center py-16">
          <p>Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">User Not Found</h1>
            <p className="text-gray-600 mb-8">We couldn't find the user you're looking for.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const displayName = profile.display_name || profile.full_name || profile.username || 'Anonymous User';
  const socialLinks = getSocialLinks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Button 
          onClick={() => navigate(-1)} 
          variant="outline" 
          className="mb-6 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* User Profile */}
        <Card className="bg-white shadow-lg border border-emerald-100 mb-8">
          <CardHeader>
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-orange-100 rounded-full flex items-center justify-center">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={displayName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-2xl font-bold text-emerald-700">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl text-gray-800 mb-2">{displayName}</CardTitle>
                {profile.username && (
                  <p className="text-gray-600 mb-2">@{profile.username}</p>
                )}
                {profile.is_email_public && profile.email && (
                  <p className="text-gray-600 mb-4">{profile.email}</p>
                )}
                
                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map(({ icon: Icon, url, label }) => (
                      <Button
                        key={label}
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <Icon className="h-4 w-4 mr-1" />
                          {label}
                        </a>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* User's Events */}
        <Card className="bg-white shadow-lg border border-emerald-100">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">
              Events by {displayName} ({userEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userEvents.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {userEvents.map((event) => (
                  <Card 
                    key={event.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    <div className="aspect-video bg-gradient-to-br from-emerald-100 to-orange-100 relative rounded-t-lg">
                      <img 
                        src={event.image_url || '/placeholder.svg'} 
                        alt={event.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{event.title}</h3>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{event.category}</Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(event.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                {displayName} hasn't created any events yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default User;