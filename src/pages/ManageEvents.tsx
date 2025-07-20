import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { usePendingEvents, useUserEvents } from '@/hooks/events/useUserEvents';
import { useApiEvents } from '@/hooks/events/useApiEvents';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Clock, Check, X, Loader2, Search, Edit, Trash2, Star, Eye, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useNavigate } from 'react-router-dom';

const ManageEvents = () => {
  const { data: pendingEvents = [], isLoading: pendingLoading } = usePendingEvents();
  const { data: userEvents = [], isLoading: userEventsLoading } = useUserEvents();
  const { data: apiEvents = [], isLoading: apiEventsLoading } = useApiEvents();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleApprove = async (eventId: string) => {
    try {
      // Get the event details first
      const { data: event, error: eventError } = await supabase
        .from('user_events')
        .select('venue_name, venue_address, venue_city, venue_state, venue_zip')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Update event status to approved
      const { error } = await supabase
        .from('user_events')
        .update({ status: 'approved' })
        .eq('id', eventId);

      if (error) throw error;

      // Auto-approve venue if it exists and matches event venue
      if (event.venue_name) {
        const { error: venueError } = await supabase
          .from('venues')
          .update({ 
            status: 'approved',
            approved_at: new Date().toISOString()
          })
          .eq('name', event.venue_name)
          .eq('status', 'pending');

        if (venueError) {
          console.warn('Could not auto-approve venue:', venueError);
        }
      }

      toast({
        title: "Event approved",
        description: "The event has been approved and is now visible to the public.",
      });

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['pending-events'] });
      queryClient.invalidateQueries({ queryKey: ['approved-user-events'] });
    } catch (error) {
      console.error('Error approving event:', error);
      toast({
        title: "Error",
        description: "Failed to approve event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('user_events')
        .update({ status: 'rejected' })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Event rejected",
        description: "The event has been rejected.",
      });

      queryClient.invalidateQueries({ queryKey: ['pending-events'] });
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast({
        title: "Error",
        description: "Failed to reject event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async (eventId: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('user_events')
        .update({ is_featured: !currentFeatured })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Event ${!currentFeatured ? 'featured' : 'unfeatured'} successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ['approved-user-events'] });
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast({
        title: "Error",
        description: "Failed to update featured status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ['approved-user-events'] });
      queryClient.invalidateQueries({ queryKey: ['pending-events'] });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Time TBA';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredUserEvents = userEvents.filter(event => {
    const matchesSearch = !searchTerm || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(userEvents.map(event => event.category))];

  if (rolesLoading || !isAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
          <Header />
          <div className="flex justify-center items-center py-16">
            <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-lg text-gray-600">
                  {!isAdmin ? 'Access denied. Admin privileges required.' : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
              <Settings className="h-8 w-8 mr-3 text-emerald-600" />
              Manage Events
            </h1>
            <p className="text-gray-600">Review, approve, and manage all events in the system</p>
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                Pending Approval ({pendingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                All Events ({userEvents.length})
              </TabsTrigger>
              <TabsTrigger value="api">
                API Events ({apiEvents.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Events Tab */}
            <TabsContent value="pending">
              {pendingLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
                    <div className="flex items-center justify-center space-x-3">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                      <p className="text-lg text-gray-600">Loading pending events...</p>
                    </div>
                  </div>
                </div>
              ) : pendingEvents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
                    <h3 className="text-2xl font-semibold text-gray-700 mb-4">No pending events</h3>
                    <p className="text-gray-500">All events have been reviewed.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingEvents.map((event) => (
                    <Card key={event.id} className="bg-white shadow-lg border border-emerald-100 hover:shadow-xl transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {event.title}
                          </CardTitle>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {event.image_url && (
                          <img 
                            src={event.image_url} 
                            alt={event.title}
                            className="w-full h-32 object-cover rounded-md"
                          />
                        )}
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
                          {formatDate(event.start_date)}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-emerald-600" />
                          {formatTime(event.start_time)}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
                          {event.venue_name}
                        </div>
                        
                        <Badge variant="outline" className="w-fit">
                          {event.category}
                        </Badge>
                        
                        {event.description && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {event.description}
                          </p>
                        )}
                      </CardContent>
                      
                      <CardFooter className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(event.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(event.id)}
                          variant="destructive"
                          className="flex-1"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* All Events Tab */}
            <TabsContent value="approved">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search events..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {userEventsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUserEvents.map((event) => (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
                              <Badge variant={getStatusBadgeVariant(event.status)}>
                                {event.status}
                              </Badge>
                              {event.is_featured && (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(event.start_date)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {formatTime(event.start_time)}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {event.venue_name}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Created: {new Date(event.created_at).toLocaleDateString()}</span>
                              <Badge variant="outline" className="text-xs">
                                {event.category}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/event/${event.id}`)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            
                            {event.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleFeatured(event.id, event.is_featured || false)}
                                className={event.is_featured 
                                  ? "text-yellow-600 border-yellow-200 hover:bg-yellow-50" 
                                  : "text-gray-600 border-gray-200 hover:bg-gray-50"
                                }
                              >
                                <Star className="h-4 w-4 mr-1" />
                                {event.is_featured ? 'Unfeature' : 'Feature'}
                              </Button>
                            )}
                            
                            {event.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(event.id)}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(event.id)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredUserEvents.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">No events found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* API Events Tab */}
            <TabsContent value="api">
              {apiEventsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>API Events Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        These events are imported from external APIs and are read-only.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-emerald-700">{apiEvents.length}</div>
                          <div className="text-sm text-emerald-600">Total API Events</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">
                            {new Set(apiEvents.map(e => e.api_source)).size}
                          </div>
                          <div className="text-sm text-blue-600">API Sources</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-700">
                            {apiEvents.filter(e => e.is_featured).length}
                          </div>
                          <div className="text-sm text-purple-600">Featured Events</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apiEvents.slice(0, 12).map((event) => (
                      <Card key={event.id} className="bg-white shadow-lg border border-emerald-100 hover:shadow-xl transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                              {event.title}
                            </CardTitle>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              {event.api_source}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          {event.image_url && (
                            <img 
                              src={event.image_url} 
                              alt={event.title}
                              className="w-full h-32 object-cover rounded-md"
                            />
                          )}
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
                            {formatDate(event.start_date)}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
                            {event.venue_name}
                          </div>
                          
                          <Badge variant="outline" className="w-fit">
                            {event.category}
                          </Badge>
                        </CardContent>
                        
                        <CardFooter>
                          <Button
                            onClick={() => navigate(`/event/${event.id}`)}
                            variant="outline"
                            className="w-full"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Event
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default ManageEvents;