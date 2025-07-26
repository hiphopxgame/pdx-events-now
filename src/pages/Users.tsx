import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Users as UsersIcon, Search, User, Globe, Facebook, Instagram, Twitter, Youtube, Loader2, ExternalLink, Calendar, MapPin, Video } from 'lucide-react';
import { EnhancedPagination } from '@/components/EnhancedPagination';
import { createUserSlug } from '@/utils/eventUtils';

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
  video_count?: number;
}

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const scrollTargetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

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
        // Get event count (only approved events)
        const { count: eventCount } = await supabase
          .from('user_events')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .eq('status', 'approved');

        // Get venue count (venues approved by this user)
        const { count: venueCount } = await supabase
          .from('venues')
          .select('id', { count: 'exact', head: true })
          .eq('approved_by', user.id)
          .eq('status', 'approved');

        // Get video count from artist_content (only approved videos)
        const { count: videoCount } = await supabase
          .from('artist_content')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'approved');

        usersWithCounts.push({
          ...user,
          event_count: eventCount || 0,
          venue_count: venueCount || 0,
          video_count: videoCount || 0
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

    // Sort by approved events count (descending), then alphabetically by display name
    filtered = filtered.sort((a, b) => {
      // First sort by event count (descending - higher counts first)
      const eventCountDiff = (b.event_count || 0) - (a.event_count || 0);
      if (eventCountDiff !== 0) {
        return eventCountDiff;
      }
      
      // If event counts are equal, sort alphabetically by display name
      const nameA = a.display_name || a.username || '';
      const nameB = b.display_name || b.username || '';
      return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
    });

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
            <CardTitle>Search Community</CardTitle>
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
          <>
            {/* Add ref for scroll target */}
            <div ref={(el) => { if (el) scrollTargetRef.current = el; }} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => {
              const socialLinks = getSocialLinks(user);
              
              return (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <Link to={`/community/${createUserSlug(user.username, user.display_name, user.id)}`} className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors flex-shrink-0">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.display_name || 'User'}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-emerald-600" />
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/community/${createUserSlug(user.username, user.display_name, user.id)}`} className="block">
                          <h3 className={`font-semibold hover:text-primary transition-colors truncate ${
                            user.display_name 
                              ? 'text-foreground' 
                              : 'text-muted-foreground italic'
                          }`}>
                            {user.display_name || (
                              <span className="bg-muted/50 px-2 py-1 rounded text-xs border border-muted">
                                Anonymous User
                              </span>
                            )}
                          </h3>
                        </Link>
                        <div className="mt-1">
                          {user.username ? (
                            <p className="text-sm text-foreground truncate">@{user.username}</p>
                          ) : (
                            <span className="text-xs text-muted-foreground italic bg-muted/30 px-2 py-1 rounded border border-muted">
                              No username set
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Member since {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* View Profile Button on its own line */}
                    <div className="mb-4">
                      <Link to={`/community/${createUserSlug(user.username, user.display_name, user.id)}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                      </Link>
                    </div>

                    {/* Content Counts - Better aligned grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className={`flex flex-col items-center text-center p-3 rounded-lg border transition-colors ${
                        (user.event_count || 0) > 0 
                          ? 'bg-primary/10 border-primary/20 text-primary' 
                          : 'bg-muted/30 border-muted text-muted-foreground'
                      }`}>
                        <Calendar className="h-4 w-4 mb-1" />
                        <span className="text-sm font-bold">{user.event_count || 0}</span>
                        <span className="text-xs">Events</span>
                      </div>
                      <div className={`flex flex-col items-center text-center p-3 rounded-lg border transition-colors ${
                        (user.venue_count || 0) > 0 
                          ? 'bg-secondary/10 border-secondary/20 text-secondary' 
                          : 'bg-muted/30 border-muted text-muted-foreground'
                      }`}>
                        <MapPin className="h-4 w-4 mb-1" />
                        <span className="text-sm font-bold">{user.venue_count || 0}</span>
                        <span className="text-xs">Venues</span>
                      </div>
                      <div className={`flex flex-col items-center text-center p-3 rounded-lg border transition-colors ${
                        (user.video_count || 0) > 0 
                          ? 'bg-accent/10 border-accent/20 text-accent' 
                          : 'bg-muted/30 border-muted text-muted-foreground'
                      }`}>
                        <Video className="h-4 w-4 mb-1" />
                        <span className="text-sm font-bold">{user.video_count || 0}</span>
                        <span className="text-xs">Videos</span>
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
            </div>
            
            {filteredUsers.length > 0 && (
              <EnhancedPagination
                currentPage={currentPage}
                totalItems={filteredUsers.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                scrollTargetRef={scrollTargetRef}
              />
            )}
            
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
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Users;