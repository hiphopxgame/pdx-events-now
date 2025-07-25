import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAllEvents } from '@/hooks/events/useUserEvents';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Clock, Check, X, Loader2, Search, Edit, Trash2, Star, Eye, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useNavigate } from 'react-router-dom';
import { EditEventDialog } from '@/components/EditEventDialog';
import { EventDetailsModal } from '@/components/EventDetailsModal';

const ManageEvents = () => {
  const { data: userEvents = [], isLoading: userEventsLoading } = useAllEvents();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [viewingEvent, setViewingEvent] = useState<any>(null);
  const [eventsWithUsers, setEventsWithUsers] = useState<any[]>([]);

  // Fetch user information for events
  useEffect(() => {
    const fetchUsersForEvents = async () => {
      if (userEvents.length === 0) return;

      const eventsWithUserInfo = await Promise.all(
        userEvents.map(async (event) => {
          if (!event.created_by) {
            return { ...event, submittedByUser: 'Unknown user' };
          }

          try {
            const { data } = await supabase
              .from('por_eve_profiles')
              .select('display_name, username')
              .eq('id', event.created_by)
              .single();

            return {
              ...event,
              submittedByUser: data?.display_name || data?.username || 'Unknown user'
            };
          } catch (error) {
            console.error('Error fetching user for event:', event.id, error);
            return { ...event, submittedByUser: 'Unknown user' };
          }
        })
      );

      setEventsWithUsers(eventsWithUserInfo);
    };

    fetchUsersForEvents();
  }, [userEvents]);

  // Real-time updates for event changes
  useEffect(() => {
    const channel = supabase
      .channel('manage-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_events'
        },
        () => {
          // Refresh the events data when any change occurs
          queryClient.invalidateQueries({ queryKey: ['all-events'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
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

      queryClient.invalidateQueries({ queryKey: ['all-events'] });
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

      queryClient.invalidateQueries({ queryKey: ['all-events'] });
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

      queryClient.invalidateQueries({ queryKey: ['all-events'] });
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

  const filteredUserEvents = eventsWithUsers.filter(event => {
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

          {/* Filters */}
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

          {/* All Events */}
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
                            <span>
                              {formatTime(event.start_time)}
                              {event.end_time && (
                                <> - {formatTime(event.end_time)}</>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {event.venue_name}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created: {new Date(event.created_at).toLocaleDateString()}</span>
                          <span>Submitted by: {event.submittedByUser || 'Loading...'}</span>
                          <Badge variant="outline" className="text-xs">
                            {event.category}
                          </Badge>
                        </div>
                      </div>
                      
                       <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingEvent({
                            id: event.id,
                            title: event.title,
                            date: event.start_date,
                            time: formatTime(event.start_time),
                            venue: event.venue_name,
                            category: event.category,
                            price: event.price_display || 'Free',
                            imageUrl: event.image_url || '/placeholder.svg',
                            description: event.description || '',
                            venueAddress: event.venue_address,
                            venueCity: event.venue_city,
                            venueState: event.venue_state,
                            ticketUrl: event.ticket_url,
                          })}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log('ManageEvents: Edit button clicked, event data:', event);
                            setEditingEvent(event);
                          }}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
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
        </div>
        
        <Footer />
      </div>
      
      {/* Edit Event Dialog */}
      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          onSuccess={() => {
            setEditingEvent(null);
            queryClient.invalidateQueries({ queryKey: ['all-events'] });
          }}
        />
      )}
      
      {/* View Event Modal */}
      <EventDetailsModal
        event={viewingEvent}
        isOpen={!!viewingEvent}
        onClose={() => setViewingEvent(null)}
      />
    </ProtectedRoute>
  );
};

export default ManageEvents;