import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { EventsGrid } from '@/components/EventsGrid';
import { EventDetailsModal } from '@/components/EventDetailsModal';
import { useEvents } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Phone, Globe, Calendar, ArrowLeft, ExternalLink, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';


// Helper function to decode URL-friendly strings
const decodeUrlFriendlyString = (str: string) => {
  return str
    .replace(/_/g, ' ')     // Replace underscores with spaces
    .replace(/and/g, '&');  // Replace 'and' back to &
};

const Venue = () => {
  const { venueName } = useParams<{ venueName: string }>();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [venueData, setVenueData] = useState<any>(null);

  const { data: allEvents = [], isLoading } = useEvents();

  // Filter events for this venue - handle both old and new URL formats
  const decodedVenueName = venueName ? decodeUrlFriendlyString(venueName) : '';
  const venueEvents = allEvents.filter(event => 
    event.venue_name?.toLowerCase() === decodedVenueName.toLowerCase() ||
    event.venue_name?.toLowerCase() === decodeURIComponent(venueName || '').toLowerCase()
  );

  // Get venue details from the first event
  const venueDetails = venueEvents[0] || null;

  // Fetch venue data from database
  useEffect(() => {
    const fetchVenueData = async () => {
      if (!venueName) return;
      
      const decodedName = decodeUrlFriendlyString(venueName);
      console.log('Looking for venue:', decodedName, 'from URL:', venueName);
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .or(`name.ilike.%${decodedName}%,name.ilike.%${decodeURIComponent(venueName)}%`)
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setVenueData(data);
      }
    };

    fetchVenueData();
  }, [venueName]);

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = venueEvents
    .filter(event => new Date(event.start_date) >= now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  
  const pastEvents = venueEvents
    .filter(event => new Date(event.start_date) < now)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Transform events for display
  const transformEvent = (event: any) => {
    let formattedTime = 'TBA';
    let dateString = event.start_date;
    
    if (event.start_date) {
      try {
        const eventDate = new Date(event.start_date);
        if (!isNaN(eventDate.getTime())) {
          formattedTime = eventDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Los_Angeles'
          });
          dateString = eventDate.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Date parsing error:', error);
      }
    }
    
    return {
      id: event.id,
      title: event.title,
      date: dateString,
      time: formattedTime,
      venue: event.venue_name,
      category: event.category,
      price: event.price_display || 'TBA',
      imageUrl: event.image_url || '/placeholder.svg',
      description: event.description || '',
      startDate: event.start_date,
      endDate: event.end_date,
      venueAddress: event.venue_address,
      venueCity: event.venue_city,
      venueState: event.venue_state,
      ticketUrl: event.ticket_url,
      endTime: event.end_time,
      createdBy: event.created_by,
    };
  };

  const transformedUpcomingEvents = upcomingEvents.map(transformEvent);
  const transformedPastEvents = pastEvents.map(transformEvent);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        <div className="flex justify-center items-center py-16">
          <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-lg text-gray-600">Loading venue information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!venueDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Venue Not Found</h1>
            <p className="text-gray-600 mb-8">We couldn't find any events for this venue.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const fullAddress = [venueDetails.venue_address, venueDetails.venue_city, venueDetails.venue_state]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Button 
          onClick={() => navigate('/')} 
          variant="outline" 
          className="mb-6 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        {/* Venue Header */}
        <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{venueDetails.venue_name}</h1>
          
          <div className="space-y-6">
            {/* Venue Address */}
            {fullAddress && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-emerald-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-gray-700">{fullAddress}</p>
                </div>
              </div>
            )}
            
            {/* Event Count */}
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-emerald-600 mr-3" />
              <p className="text-gray-700">
                {upcomingEvents.length} upcoming events • {pastEvents.length} past events
              </p>
            </div>

            {/* Website & Social Media */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Website & Social Media</h3>
              <div className="flex flex-wrap gap-3">
                {venueData?.website && (
                  <Button variant="outline" size="sm" asChild className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    <a href={venueData.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
                {venueData?.facebook_url && (
                  <Button variant="outline" size="sm" asChild className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    <a href={venueData.facebook_url} target="_blank" rel="noopener noreferrer">
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </a>
                  </Button>
                )}
                {venueData?.instagram_url && (
                  <Button variant="outline" size="sm" asChild className="border-pink-300 text-pink-700 hover:bg-pink-50">
                    <a href={venueData.instagram_url} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </a>
                  </Button>
                )}
                {venueData?.twitter_url && (
                  <Button variant="outline" size="sm" asChild className="border-sky-300 text-sky-700 hover:bg-sky-50">
                    <a href={venueData.twitter_url} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </a>
                  </Button>
                )}
                {venueData?.youtube_url && (
                  <Button variant="outline" size="sm" asChild className="border-red-300 text-red-700 hover:bg-red-50">
                    <a href={venueData.youtube_url} target="_blank" rel="noopener noreferrer">
                      <Youtube className="h-4 w-4 mr-2" />
                      YouTube
                    </a>
                  </Button>
                )}
                {!venueData?.website && !venueData?.facebook_url && !venueData?.instagram_url && !venueData?.twitter_url && !venueData?.youtube_url && (
                  <p className="text-gray-500 text-sm">No website or social media links available</p>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Events Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming Events ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Events ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {transformedUpcomingEvents.length > 0 ? (
              <EventsGrid events={transformedUpcomingEvents} onEventClick={handleEventClick} />
            ) : (
              <div className="text-center py-16">
                <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
                  <h3 className="text-2xl font-semibold text-gray-700 mb-4">No Upcoming Events</h3>
                  <p className="text-gray-500">This venue doesn't have any upcoming events scheduled.</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {transformedPastEvents.length > 0 ? (
              <EventsGrid events={transformedPastEvents} onEventClick={handleEventClick} />
            ) : (
              <div className="text-center py-16">
                <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
                  <h3 className="text-2xl font-semibold text-gray-700 mb-4">No Past Events</h3>
                  <p className="text-gray-500">This venue doesn't have any past events in our records.</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <EventDetailsModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Venue;