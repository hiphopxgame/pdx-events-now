import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { useUserEvents } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { EditEventDialog } from '@/components/EditEventDialog';

const MyEvents = () => {
  const { data: events = [], isLoading, refetch } = useUserEvents();
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const { toast } = useToast();

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const { error } = await supabase
      .from('user_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      refetch();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
          <Header />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex justify-center items-center py-16">
              <p className="text-lg text-gray-600">Loading your events...</p>
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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">My Events</h1>
            <p className="text-lg text-gray-600">
              Manage your submitted events
            </p>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
                <h3 className="text-2xl font-semibold text-gray-700 mb-4">No events yet</h3>
                <p className="text-gray-500 mb-6">You haven't submitted any events yet.</p>
                <Button asChild>
                  <a href="/submit-event">Submit Your First Event</a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                      <Badge className={getStatusBadge(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {event.image_url && (
                      <img 
                        src={event.image_url} 
                        alt={event.title}
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                    )}
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {new Date(event.start_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {event.start_time && (
                          <>
                            <Clock className="h-4 w-4 ml-4 mr-2" />
                            <span className="text-sm">
                              {new Date(`${event.start_date}T${event.start_time}`).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                                timeZone: 'America/Los_Angeles'
                              })}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">{event.venue_name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Category: <span className="font-medium">{event.category}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingEvent(event)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {editingEvent && (
          <EditEventDialog
            event={editingEvent}
            isOpen={!!editingEvent}
            onClose={() => setEditingEvent(null)}
            onSuccess={() => {
              setEditingEvent(null);
              refetch();
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default MyEvents;