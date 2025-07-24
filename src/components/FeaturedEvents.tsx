import React from 'react';
import { useFeaturedEvents } from '@/hooks/events/useFeaturedEvents';
import { EventCard } from './EventCard';
import { Loader2, Star } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  price: string;
  imageUrl: string;
  description: string;
  startDate?: string;
  endDate?: string;
  endTime?: string;
  venueAddress?: string;
  venueCity?: string;
  venueState?: string;
  ticketUrl?: string;
  organizerName?: string;
  createdBy?: string;
}

interface FeaturedEventsProps {
  onEventClick?: (event: Event) => void;
}

export const FeaturedEvents: React.FC<FeaturedEventsProps> = ({ onEventClick }) => {
  const { data: featuredEvents = [], isLoading } = useFeaturedEvents();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (featuredEvents.length === 0) {
    return null;
  }

  // Transform events to match EventCard interface
  const transformedEvents = featuredEvents.map(event => {
    // Handle date parsing safely
    let formattedTime = 'TBA';
    let formattedEndTime = '';
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
          dateString = eventDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          });
        }
      } catch (error) {
        console.error('Date parsing error:', error, event.start_date);
      }
    }
    
    // Handle end time formatting
    if (event.end_date) {
      try {
        const endDate = new Date(event.end_date);
        if (!isNaN(endDate.getTime())) {
          formattedEndTime = endDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Los_Angeles'
          });
        }
      } catch (error) {
        console.error('End date parsing error:', error, event.end_date);
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
      endTime: formattedEndTime,
      venueAddress: event.venue_address,
      venueCity: event.venue_city,
      venueState: event.venue_state,
      ticketUrl: event.ticket_url,
      organizerName: event.organizer_name,
      createdBy: event.created_by,
    };
  });

  return (
    <div className="mb-12">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-6 border border-primary/20">
        <div className="flex items-center gap-2 mb-6">
          <Star className="h-6 w-6 text-primary fill-primary" />
          <h2 className="text-2xl font-bold text-primary">Featured Events</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transformedEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="relative">
              <div className="absolute -top-2 -right-2 z-10">
                <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                  Featured
                </div>
              </div>
              <EventCard event={event} onEventClick={onEventClick} />
            </div>
          ))}
        </div>
        
        {transformedEvents.length > 3 && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            And {transformedEvents.length - 3} more featured events...
          </div>
        )}
      </div>
    </div>
  );
};