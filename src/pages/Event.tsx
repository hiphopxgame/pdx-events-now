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

  // Also try to fetch from user_events table (for ManageEvents view)
  const { data: userEvent } = useQuery({
    queryKey: ['user-event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      // Handle recurring event IDs that have "-0", "-1", etc. suffix
      let baseEventId = eventId;
      if (eventId.includes('-') && eventId.split('-').length > 5) {
        baseEventId = eventId.split('-').slice(0, 5).join('-');
      }
      
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('id', baseEventId)
        .single();
      
      if (error) {
        console.error('User event not found:', error);
        return null;
      }
      return data;
    },
    enabled: !!eventId,
  });

  // Find the specific event from combined events or user event
  const event = allEvents.find(e => e.id === eventId) || (userEvent ? {
    id: userEvent.id,
    title: userEvent.title,
    description: userEvent.description,
    date: userEvent.start_date,
    time: userEvent.start_time,
    endTime: userEvent.end_time,
    venue: userEvent.venue_name,
    venueAddress: userEvent.venue_address,
    city: userEvent.venue_city,
    state: userEvent.venue_state,
    category: userEvent.category,
    price: userEvent.price_display,
    imageUrl: userEvent.image_url,
    organizer: userEvent.organizer_name,
    ticketUrl: userEvent.ticket_url,
    facebookUrl: userEvent.facebook_url,
    instagramUrl: userEvent.instagram_url,
    twitterUrl: userEvent.twitter_url,
    youtubeUrl: userEvent.youtube_url,
    websiteUrl: userEvent.website_url,
    created_by: userEvent.created_by
  } : null);

  // Determine if this is a user event or regular event
  const isUserEvent = !!userEvent && !allEvents.find(e => e.id === eventId);

  // Helper functions to get properties from either event type
  const getEventProperty = (userProp: keyof typeof userEvent, regularProp: string) => {
    if (isUserEvent && userEvent) {
      return userEvent[userProp];
    }
    return (event as any)?.[regularProp];
  };

  // Get venue name based on event type  
  const venueName = getEventProperty('venue_name', 'venue');

  // Fetch venue details for social media links
  const { data: venueData } = useQuery({
    queryKey: ['venue', venueName],
    queryFn: async () => {
      if (!venueName) return null;
      const { data, error } = await supabase
        .from('poreve_venues')
        .select('*')
        .eq('name', venueName)
        .single();
      
      if (error) {
        console.error('Error fetching venue:', error);
        return null;
      }
      return data;
    },
    enabled: !!venueName,
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
    
    const startDate = getEventProperty('start_date', 'date');
    const startTime = formatTime(startDate);
    const endDate = getEventProperty('recurrence_end_date', 'endDate');
    if (endDate) {
      const endTime = formatTime(endDate);
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
    const venueNameProp = getEventProperty('venue_name', 'venue');
    if (venueNameProp) {
      navigate(`/venue/${encodeURIComponent(venueNameProp)}`);
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

  const fullAddress = [
    getEventProperty('venue_address', 'venueAddress'), 
    getEventProperty('venue_city', 'city'), 
    getEventProperty('venue_state', 'state')
  ].filter(Boolean).join(', ');

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
              src={getEventProperty('image_url', 'imageUrl') || '/placeholder.svg'} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <Badge className={getCategoryColor(event.category)}>
                {event.category}
              </Badge>
            </div>
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
              <span className="font-bold text-emerald-700">{getEventProperty('price_display', 'price') || 'TBA'}</span>
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
                    <p className="font-medium">{formatDate(getEventProperty('start_date', 'date'))}</p>
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
                      {getEventProperty('venue_name', 'venue')}
                    </p>
                    {fullAddress && (
                      <p className="text-sm text-gray-500">{fullAddress}</p>
                    )}
                  </div>
                </div>

                {getEventProperty('organizer_name', 'organizer') && (
                  <div className="flex items-center text-gray-600">
                    <User className="h-5 w-5 mr-3 text-emerald-600" />
                    <div>
                      <p className="font-medium">Organized by</p>
                      <p className="text-sm text-gray-500">{getEventProperty('organizer_name', 'organizer')}</p>
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
                    <div className="flex flex-wrap gap-2">
                      {venueData.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={venueData.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4 mr-1" />
                            Website
                          </a>
                        </Button>
                      )}
                      {venueData.facebook_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={venueData.facebook_url} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-4 w-4 mr-1" />
                            Facebook
                          </a>
                        </Button>
                      )}
                      {venueData.instagram_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={venueData.instagram_url} target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-4 w-4 mr-1" />
                            Instagram
                          </a>
                        </Button>
                      )}
                      {venueData.twitter_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={venueData.twitter_url} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-4 w-4 mr-1" />
                            Twitter
                          </a>
                        </Button>
                      )}
                      {venueData.youtube_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={venueData.youtube_url} target="_blank" rel="noopener noreferrer">
                            <Youtube className="h-4 w-4 mr-1" />
                            YouTube
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Event Social Media */}
                {(getEventProperty('website_url', 'websiteUrl') || getEventProperty('facebook_url', 'facebookUrl') || getEventProperty('instagram_url', 'instagramUrl') || getEventProperty('twitter_url', 'twitterUrl') || getEventProperty('youtube_url', 'youtubeUrl')) && (
                  <div className="bg-emerald-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">Event Links</h4>
                    <div className="flex flex-wrap gap-2">
                      {getEventProperty('website_url', 'websiteUrl') && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={getEventProperty('website_url', 'websiteUrl')} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4 mr-1" />
                            Website
                          </a>
                        </Button>
                      )}
                      {getEventProperty('facebook_url', 'facebookUrl') && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={getEventProperty('facebook_url', 'facebookUrl')} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-4 w-4 mr-1" />
                            Facebook
                          </a>
                        </Button>
                      )}
                      {getEventProperty('instagram_url', 'instagramUrl') && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={getEventProperty('instagram_url', 'instagramUrl')} target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-4 w-4 mr-1" />
                            Instagram
                          </a>
                        </Button>
                      )}
                      {getEventProperty('twitter_url', 'twitterUrl') && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={getEventProperty('twitter_url', 'twitterUrl')} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-4 w-4 mr-1" />
                            Twitter
                          </a>
                        </Button>
                      )}
                      {getEventProperty('youtube_url', 'youtubeUrl') && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={getEventProperty('youtube_url', 'youtubeUrl')} target="_blank" rel="noopener noreferrer">
                            <Youtube className="h-4 w-4 mr-1" />
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

            {/* Links */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-3">
                {getEventProperty('ticket_url', 'ticketUrl') && (
                  <Button 
                    asChild
                    className="bg-gradient-to-r from-emerald-600 to-orange-500 hover:from-emerald-700 hover:to-orange-600"
                  >
                    <a href={getEventProperty('ticket_url', 'ticketUrl')} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Get Tickets
                    </a>
                  </Button>
                )}
                {getEventProperty('website_url', 'websiteUrl') && (
                  <Button variant="outline" asChild>
                    <a href={getEventProperty('website_url', 'websiteUrl')} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
                {getEventProperty('facebook_url', 'facebookUrl') && (
                  <Button variant="outline" asChild>
                    <a href={getEventProperty('facebook_url', 'facebookUrl')} target="_blank" rel="noopener noreferrer">
                      Facebook
                    </a>
                  </Button>
                )}
                {getEventProperty('instagram_url', 'instagramUrl') && (
                  <Button variant="outline" asChild>
                    <a href={getEventProperty('instagram_url', 'instagramUrl')} target="_blank" rel="noopener noreferrer">
                      Instagram
                    </a>
                  </Button>
                )}
                {getEventProperty('twitter_url', 'twitterUrl') && (
                  <Button variant="outline" asChild>
                    <a href={getEventProperty('twitter_url', 'twitterUrl')} target="_blank" rel="noopener noreferrer">
                      Twitter
                    </a>
                  </Button>
                )}
                {getEventProperty('youtube_url', 'youtubeUrl') && (
                  <Button variant="outline" asChild>
                    <a href={getEventProperty('youtube_url', 'youtubeUrl')} target="_blank" rel="noopener noreferrer">
                      YouTube
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Event;