
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Tag, User, Repeat } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SocialShare } from '@/components/SocialShare';
import { supabase } from '@/integrations/supabase/client';
import { createEventUrl, createVenueUrl, createUserUrl } from '@/lib/seo';
import { mobileStyles } from '@/lib/mobile';

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

  const handleEventClick = (e?: React.MouseEvent) => {
    console.log('Event card clicked:', event.id, event.title);
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      if (onEventClick) {
        onEventClick(event);
      } else {
        console.log('Navigating to:', createEventUrl(event.title, event.id));
        navigate(createEventUrl(event.title, event.id));
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

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
    console.log('Venue link clicked:', event.venue);
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const venueUrl = createVenueUrl(event.venue, event.venue);
      console.log('Navigating to venue:', venueUrl);
      navigate(venueUrl);
    } catch (error) {
      console.error('Venue navigation error:', error);
    }
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
    <Card className={`group hover:shadow-xl transition-all duration-300 border-emerald-100 hover:border-emerald-300 overflow-hidden cursor-pointer ${mobileStyles.card}`} onClick={handleEventClick}>
      <CardHeader className="p-0">
        <div 
          className={`${mobileStyles.aspectRatio} bg-gradient-to-br from-emerald-100 to-orange-100 relative overflow-hidden`}
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
      
      <CardContent className={`${mobileStyles.card} ${mobileStyles.spacing}`}>
        <h3 className={`${mobileStyles.h3} text-gray-800 mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2`}>
          {event.title}
        </h3>
        
        <div className="space-y-3 mb-4">
          <div className={`${mobileStyles.flexRow} text-gray-600 text-sm`}>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-emerald-600" />
              <span>
                {event.time}
                {event.endTime && (
                  <> - {event.endTime}</>
                )}
              </span>
            </div>
            {event.recurrencePattern && (
              <div className="flex items-center text-orange-600">
                <Repeat className="h-4 w-4 mr-1 text-orange-500" />
                <span className="text-sm font-medium">
                  {formatRecurrencePattern(event.recurrencePattern)}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
            <button 
              className="text-sm text-left hover:text-emerald-600 hover:underline focus:outline-none focus:text-emerald-600"
              onClick={handleVenueClick}
            >
              {event.venue}
            </button>
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
                      navigate(createUserUrl(submittedByUser, event.createdBy || ''));
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
        
        <p className={`text-gray-600 ${mobileStyles.body} line-clamp-2 sm:line-clamp-3 mb-4`}>
          {event.description}
        </p>

        {/* Social Share - Mobile optimized */}
        <div className="sm:hidden">
          <SocialShare 
            url={window.location.origin + createEventUrl(event.title, event.id)}
            title={event.title}
            description={event.description}
            variant="button"
            className="justify-center"
          />
        </div>
      </CardContent>
      
      <CardFooter className={`${mobileStyles.card} pt-0 ${mobileStyles.flexRow} gap-2`}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleEventClick(e);
          }}
          className={`flex-1 bg-gradient-primary text-white py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 transform group-hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary ${mobileStyles.button} min-h-[48px] min-w-[48px]`}
        >
          Event Details
        </button>
        
        {/* Social Share - Desktop */}
        <div className="hidden sm:block">
          <SocialShare 
            url={window.location.origin + createEventUrl(event.title, event.id)}
            title={event.title}
            description={event.description}
            variant="dropdown"
          />
        </div>
      </CardFooter>
    </Card>
  );
};
