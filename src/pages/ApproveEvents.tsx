import React from 'react';
import { Header } from '@/components/Header';
import { usePendingEvents } from '@/hooks/events/useUserEvents';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const ApproveEvents = () => {
  const { data: pendingEvents = [], isLoading } = usePendingEvents();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleApprove = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('user_events')
        .update({ status: 'approved' })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Event approved",
        description: "The event has been approved and is now visible to the public.",
      });

      // Refresh the pending events list
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

      // Refresh the pending events list
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Approve Events</h1>
          <p className="text-gray-600">Review and approve pending event submissions</p>
        </div>

        {isLoading ? (
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
      </div>
    </div>
  );
};

export default ApproveEvents;