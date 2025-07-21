import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Users as UsersIcon, Search, User, Globe, Facebook, Instagram, Twitter, Youtube, Loader2, ExternalLink, Calendar, MapPin } from 'lucide-react';

interface UserProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  created_at: string;
  event_count?: number;
  venue_count?: number;
}

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('por_eve_profiles')
        .select(`
          id,
          display_name,
          username,
          avatar_url,
          website_url,
          facebook_url,
          instagram_url,
          twitter_url,
          youtube_url,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch event and venue counts for each user
      const usersWithCounts: UserProfile[] = [];
      
      for (const user of data || []) {
        // Get event count
        const { count: eventCount } = await supabase
          .from('user_events')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', user.id);

        // For now, set venue count to 0 as we don't have a created_by field in venues table
        const venueCount = 0;

        usersWithCounts.push({
          ...user,
          event_count: eventCount || 0,
          venue_count: venueCount
        });
      }

      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const getSocialLinks = (user: UserProfile) => {
    const links = [];
    if (user.website_url) links.push({ icon: Globe, url: user.website_url, label: 'Website' });
    if (user.facebook_url) links.push({ icon: Facebook, url: user.facebook_url, label: 'Facebook' });
    if (user.instagram_url) links.push({ icon: Instagram, url: user.instagram_url, label: 'Instagram' });
    if (user.twitter_url) links.push({ icon: Twitter, url: user.twitter_url, label: 'Twitter' });
    if (user.youtube_url) links.push({ icon: Youtube, url: user.youtube_url, label: 'YouTube' });
    return links;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center">
            <UsersIcon className="h-8 w-8 mr-3 text-emerald-600" />
            Portland Community
          </h1>
          <p className="text-gray-600">Discover and connect with event organizers and community members</p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => {
              const socialLinks = getSocialLinks(user);
              
              return (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Link to={`/user/${user.id}`} className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.display_name || 'User'}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-emerald-600" />
                        )}
                      </Link>
                      <div className="flex-1">
                        <Link to={`/user/${user.id}`} className="block">
                          <h3 className="font-semibold text-gray-800 hover:text-emerald-600 transition-colors">
                            {user.display_name || 'Anonymous User'}
                          </h3>
                        </Link>
                        {user.username && (
                          <p className="text-sm text-gray-600">@{user.username}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Member since {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Link to={`/user/${user.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                      </Link>
                    </div>

                    {/* Event and Venue Counts */}
                    <div className="flex gap-4 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1 text-emerald-600" />
                        <span>{user.event_count || 0} Events</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1 text-orange-600" />
                        <span>{user.venue_count || 0} Venues</span>
                      </div>
                    </div>

                    {/* Social Links */}
                    {socialLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {socialLinks.map((link, index) => {
                          const Icon = link.icon;
                          return (
                            <Button
                              key={index}
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(link.url, '_blank')}
                              className="flex items-center gap-1"
                            >
                              <Icon className="h-3 w-3" />
                              <span className="hidden sm:inline">{link.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredUsers.length === 0 && !loading && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No users found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Users;