
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Tag, User, Repeat } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

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
  venueAddress?: string;
  venueCity?: string;
  venueState?: string;
  ticketUrl?: string;
  organizerName?: string;
  submittedBy?: string;
  recurrencePattern?: string;
  createdBy?: string;
  endTime?: string;
}

interface EventCardProps {
  event: Event;
  onEventClick?: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onEventClick }) => {
  const navigate = useNavigate();
  const [submittedByUser, setSubmittedByUser] = useState<string>('');
  const [organizerUser, setOrganizerUser] = useState<string>('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (event.createdBy) {
        const { data } = await supabase
          .from('por_eve_profiles')
          .select('display_name, full_name, username')
          .eq('id', event.createdBy)
          .single();
        
        if (data) {
          setSubmittedByUser(data.display_name || data.full_name || data.username || 'Unknown User');
        }
      }
    };

    fetchUserInfo();
  }, [event.createdBy]);

  const handleVenueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/venue/${encodeURIComponent(event.venue)}`);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const formatEndTime = (endTimeString: string | undefined) => {
    if (!endTimeString) return null;
    try {
      // If it's just a time string (HH:MM), format it
      if (endTimeString.includes(':') && !endTimeString.includes('T')) {
        const [hours, minutes] = endTimeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      }
      // If it's a full date string, extract the time
      const date = new Date(endTimeString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Los_Angeles'
      });
    } catch {
      return null;
    }
  };

  const formatRecurrencePattern = (pattern: string | undefined) => {
    if (!pattern) return null;
    
    const patterns: { [key: string]: string } = {
      'weekly': 'Weekly',
      'daily': 'Daily',
      'monthly': 'Monthly',
      'yearly': 'Yearly',
      'weekdays': 'Weekdays',
      'weekends': 'Weekends'
    };
    
    return patterns[pattern] || pattern;
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

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-emerald-100 hover:border-emerald-300 overflow-hidden">
      <CardHeader className="p-0">
        <div 
          className="aspect-video bg-gradient-to-br from-emerald-100 to-orange-100 relative overflow-hidden cursor-pointer"
          onClick={() => navigate(`/event/${event.id}`)}
        >
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 left-4">
            <Badge className={getCategoryColor(event.category)}>
              {event.category}
            </Badge>
          </div>
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
            <span className="font-bold text-emerald-700">{event.price}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <h3 
          className="text-xl font-bold text-gray-800 mb-3 group-hover:text-emerald-700 transition-colors cursor-pointer"
          onClick={() => navigate(`/event/${event.id}`)}
        >
          {event.title}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600 flex-wrap">
            <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
            <span className="text-sm">{formatDate(event.date)}</span>
            <Clock className="h-4 w-4 ml-4 mr-2 text-emerald-600" />
            <span className="text-sm">
              {event.time}
              {event.endTime && (
                <> - {event.endTime}</>
              )}
            </span>
            {event.recurrencePattern && (
              <>
                <Repeat className="h-4 w-4 ml-4 mr-1 text-orange-500" />
                <span className="text-sm text-orange-600 font-medium">
                  {formatRecurrencePattern(event.recurrencePattern)}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
            <span 
              className="text-sm cursor-pointer hover:text-emerald-600 hover:underline"
              onClick={handleVenueClick}
            >
              {event.venue}
            </span>
          </div>

          {/* User Information */}
          <div className="space-y-2 pt-3 border-t border-gray-200">
            {submittedByUser && (
              <div className="flex items-center text-gray-700">
                <User className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">
                  Submitted by{' '}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/user/${event.createdBy}`);
                    }}
                    className="text-primary hover:text-primary/80 hover:underline font-medium"
                  >
                    {submittedByUser}
                  </button>
                </span>
              </div>
            )}
            {event.organizerName && (
              <div className="flex items-center text-gray-700">
                <Tag className="h-4 w-4 mr-2 text-secondary" />
                <span className="text-sm font-medium">Organizer: {event.organizerName}</span>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-3">
          {event.description}
        </p>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <button 
          onClick={() => onEventClick?.(event)}
          className="w-full bg-gradient-primary text-white py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 transform group-hover:scale-105"
        >
          Event Details
        </button>
      </CardFooter>
    </Card>
  );
};
