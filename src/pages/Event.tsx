import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useEvents } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, ExternalLink, User, ArrowLeft, Globe, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Event = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: allEvents = [], isLoading } = useEvents();

  // Find the specific event
  const event = allEvents.find(e => e.id === eventId);

  // Fetch venue details for social media links
  const { data: venueData } = useQuery({
    queryKey: ['venue', event?.venue_name],
    queryFn: async () => {
      if (!event?.venue_name) return null;
      const { data, error } = await supabase
        .from('poreve_venues')
        .select('*')
        .eq('name', event.venue_name)
        .single();
      
      if (error) {
        console.error('Error fetching venue:', error);
        return null;
      }
      return data;
    },
    enabled: !!event?.venue_name,
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'TBA';
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'TBA';
    }
  };

  const formatTimeRange = () => {
    if (!event) return 'TBA';
    
    const startTime = formatTime(event.start_date);
    if (event.end_date) {
      const endTime = formatTime(event.end_date);
      return `${startTime} - ${endTime}`;
    }
    return startTime;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Music': 'bg-purple-100 text-purple-800',
      'Food & Drink': 'bg-orange-100 text-orange-800',
      'Arts & Culture': 'bg-pink-100 text-pink-800',
      'Technology': 'bg-blue-100 text-blue-800',
      'Outdoor': 'bg-green-100 text-green-800',
      'Entertainment': 'bg-yellow-100 text-yellow-800',
      'Sports': 'bg-red-100 text-red-800',
      'Business': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleVenueClick = () => {
    if (event?.venue_name) {
      navigate(`/venue/${encodeURIComponent(event.venue_name)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        <div className="flex justify-center items-center py-16">
          <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-lg text-gray-600">Loading event details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Event Not Found</h1>
            <p className="text-gray-600 mb-8">We couldn't find the event you're looking for.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const fullAddress = [event.venue_address, event.venue_city, event.venue_state]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Button 
          onClick={() => navigate('/')} 
          variant="outline" 
          className="mb-6 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        {/* Event Header */}
        <div className="bg-white rounded-xl shadow-lg border border-emerald-100 overflow-hidden mb-8">
          {/* Event Image */}
          <div className="aspect-video bg-gradient-to-br from-emerald-100 to-orange-100 relative">
            <img 
              src={event.image_url || '/placeholder.svg'} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <Badge className={getCategoryColor(event.category)}>
                {event.category}
              </Badge>
            </div>
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
              <span className="font-bold text-emerald-700">{event.price_display || 'TBA'}</span>
            </div>
          </div>

          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">{event.title}</h1>
            
            {/* Event Details */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3 text-emerald-600" />
                  <div>
                    <p className="font-medium">{formatDate(event.start_date)}</p>
                    <p className="text-sm text-gray-500">{formatTimeRange()}</p>
                  </div>
                </div>
                
                <div className="flex items-start text-gray-600">
                  <MapPin className="h-5 w-5 mr-3 text-emerald-600 mt-0.5" />
                  <div>
                    <p 
                      className="font-medium cursor-pointer hover:text-emerald-600 hover:underline"
                      onClick={handleVenueClick}
                    >
                      {event.venue_name}
                    </p>
                    {fullAddress && (
                      <p className="text-sm text-gray-500">{fullAddress}</p>
                    )}
                  </div>
                </div>

                {event.organizer_name && (
                  <div className="flex items-center text-gray-600">
                    <User className="h-5 w-5 mr-3 text-emerald-600" />
                    <div>
                      <p className="font-medium">Organized by</p>
                      <p className="text-sm text-gray-500">{event.organizer_name}</p>
                      {event.created_by && (
                        <p className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer"
                           onClick={() => navigate(`/user/${event.created_by}`)}>
                          View profile →
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Venue Information & Social Media */}
              <div className="space-y-6">
                {/* Venue Social Media */}
                {venueData && (venueData.website || venueData.facebook_url || venueData.instagram_url || venueData.twitter_url || venueData.youtube_url) && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">Venue Info</h4>
                    <div className="flex flex-wrap gap-3">
                      {venueData.website && (
                        <Button variant="outline" size="sm" asChild className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                          <a href={venueData.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                          </a>
                        </Button>
                      )}
                      {venueData.facebook_url && (
                        <Button variant="outline" size="sm" asChild className="border-blue-300 text-blue-700 hover:bg-blue-50">
                          <a href={venueData.facebook_url} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-4 w-4 mr-2" />
                            Facebook
                          </a>
                        </Button>
                      )}
                      {venueData.instagram_url && (
                        <Button variant="outline" size="sm" asChild className="border-pink-300 text-pink-700 hover:bg-pink-50">
                          <a href={venueData.instagram_url} target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-4 w-4 mr-2" />
                            Instagram
                          </a>
                        </Button>
                      )}
                      {venueData.twitter_url && (
                        <Button variant="outline" size="sm" asChild className="border-sky-300 text-sky-700 hover:bg-sky-50">
                          <a href={venueData.twitter_url} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-4 w-4 mr-2" />
                            Twitter
                          </a>
                        </Button>
                      )}
                      {venueData.youtube_url && (
                        <Button variant="outline" size="sm" asChild className="border-red-300 text-red-700 hover:bg-red-50">
                          <a href={venueData.youtube_url} target="_blank" rel="noopener noreferrer">
                            <Youtube className="h-4 w-4 mr-2" />
                            YouTube
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Event Social Media */}
                {(event.website_url || event.facebook_url || event.instagram_url || event.twitter_url || event.youtube_url) && (
                  <div className="bg-emerald-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">Event Links</h4>
                    <div className="flex flex-wrap gap-3">
                      {event.website_url && (
                        <Button variant="outline" size="sm" asChild className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                          <a href={event.website_url} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                          </a>
                        </Button>
                      )}
                      {event.facebook_url && (
                        <Button variant="outline" size="sm" asChild className="border-blue-300 text-blue-700 hover:bg-blue-50">
                          <a href={event.facebook_url} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-4 w-4 mr-2" />
                            Facebook
                          </a>
                        </Button>
                      )}
                      {event.instagram_url && (
                        <Button variant="outline" size="sm" asChild className="border-pink-300 text-pink-700 hover:bg-pink-50">
                          <a href={event.instagram_url} target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-4 w-4 mr-2" />
                            Instagram
                          </a>
                        </Button>
                      )}
                      {event.twitter_url && (
                        <Button variant="outline" size="sm" asChild className="border-sky-300 text-sky-700 hover:bg-sky-50">
                          <a href={event.twitter_url} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-4 w-4 mr-2" />
                            Twitter
                          </a>
                        </Button>
                      )}
                      {event.youtube_url && (
                        <Button variant="outline" size="sm" asChild className="border-red-300 text-red-700 hover:bg-red-50">
                          <a href={event.youtube_url} target="_blank" rel="noopener noreferrer">
                            <Youtube className="h-4 w-4 mr-2" />
                            YouTube
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">About This Event</h3>
                <p className="text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Ticket Link */}
            {event.ticket_url && (
              <div className="mb-8">
                <Button 
                  asChild
                  className="bg-gradient-to-r from-emerald-600 to-orange-500 hover:from-emerald-700 hover:to-orange-600"
                >
                  <a href={event.ticket_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Get Tickets
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Event;