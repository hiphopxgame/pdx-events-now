import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, CheckCircle, X } from 'lucide-react';

interface SubmittedEventData {
  title: string;
  description?: string;
  category: string;
  venue_name: string;
  venue_address?: string;
  venue_city?: string;
  venue_state?: string;
  venue_zip?: string;
  price_display?: string;
  start_date: string;
  start_time?: string;
  end_time?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  submittedAt: string;
  image_url?: string;
}

interface SubmittedEventSummaryProps {
  onDismiss: () => void;
}

export const SubmittedEventSummary: React.FC<SubmittedEventSummaryProps> = ({ onDismiss }) => {
  const [eventData, setEventData] = useState<SubmittedEventData | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('recentlySubmittedEvent');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setEventData(parsedData);
      } catch (error) {
        console.error('Error parsing submitted event data:', error);
      }
    }
  }, []);

  if (!eventData) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRecurrenceDisplay = () => {
    if (!eventData.is_recurring || !eventData.recurrence_pattern) return null;
    
    const pattern = eventData.recurrence_pattern;
    if (pattern === 'single') return null;
    
    // Convert pattern to readable format
    const patterns: { [key: string]: string } = {
      'every-sunday': 'Every Sunday',
      'every-monday': 'Every Monday',
      'every-tuesday': 'Every Tuesday',
      'every-wednesday': 'Every Wednesday',
      'every-thursday': 'Every Thursday',
      'every-friday': 'Every Friday',
      'every-saturday': 'Every Saturday',
      'first-sunday': 'First Sunday of each month',
      'first-monday': 'First Monday of each month',
      'first-tuesday': 'First Tuesday of each month',
      'first-wednesday': 'First Wednesday of each month',
      'first-thursday': 'First Thursday of each month',
      'first-friday': 'First Friday of each month',
      'first-saturday': 'First Saturday of each month',
      'second-sunday': 'Second Sunday of each month',
      'second-monday': 'Second Monday of each month',
      'second-tuesday': 'Second Tuesday of each month',
      'second-wednesday': 'Second Wednesday of each month',
      'second-thursday': 'Second Thursday of each month',
      'second-friday': 'Second Friday of each month',
      'second-saturday': 'Second Saturday of each month',
      'third-sunday': 'Third Sunday of each month',
      'third-monday': 'Third Monday of each month',
      'third-tuesday': 'Third Tuesday of each month',
      'third-wednesday': 'Third Wednesday of each month',
      'third-thursday': 'Third Thursday of each month',
      'third-friday': 'Third Friday of each month',
      'third-saturday': 'Third Saturday of each month',
      'fourth-sunday': 'Fourth Sunday of each month',
      'fourth-monday': 'Fourth Monday of each month',
      'fourth-tuesday': 'Fourth Tuesday of each month',
      'fourth-wednesday': 'Fourth Wednesday of each month',
      'fourth-thursday': 'Fourth Thursday of each month',
      'fourth-friday': 'Fourth Friday of each month',
      'fourth-saturday': 'Fourth Saturday of each month',
    };
    
    return patterns[pattern] || pattern;
  };

  return (
    <Card className="mb-8 border-green-200 bg-green-50 animate-in slide-in-from-top-4 duration-500">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <CardTitle className="text-xl text-green-800">Event Submitted Successfully!</CardTitle>
              <p className="text-sm text-green-600 mt-1">
                Submitted {new Date(eventData.submittedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-green-600 hover:text-green-800 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Image */}
          {eventData.image_url && (
            <div className="lg:col-span-1">
              <img 
                src={eventData.image_url} 
                alt={eventData.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
          
          {/* Event Details */}
          <div className={eventData.image_url ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{eventData.title}</h3>
                <Badge className="bg-blue-100 text-blue-800">
                  {eventData.category}
                </Badge>
                <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                  Pending Review
                </Badge>
                {eventData.is_recurring && getRecurrenceDisplay() && (
                  <Badge className="ml-2 bg-purple-100 text-purple-800">
                    {getRecurrenceDisplay()}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-sm">{formatDate(eventData.start_date)}</p>
                    </div>
                  </div>

                  {eventData.start_time && (
                    <div className="flex items-center text-gray-700">
                      <Clock className="h-5 w-5 mr-3" />
                      <div>
                        <p className="font-medium">Time</p>
                        <p className="text-sm">
                          {formatTime(eventData.start_time)}
                          {eventData.end_time && ` - ${formatTime(eventData.end_time)}`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-medium">Venue</p>
                      <p className="text-sm">{eventData.venue_name}</p>
                      {eventData.venue_address && (
                        <p className="text-xs text-gray-500">
                          {eventData.venue_address}
                          {eventData.venue_city && `, ${eventData.venue_city}`}
                          {eventData.venue_state && `, ${eventData.venue_state}`}
                          {eventData.venue_zip && ` ${eventData.venue_zip}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {eventData.price_display && (
                    <div>
                      <p className="font-medium text-gray-700">Price</p>
                      <p className="text-sm">{eventData.price_display}</p>
                    </div>
                  )}
                </div>
              </div>

              {eventData.description && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">Description</p>
                  <p className="text-sm text-gray-600 line-clamp-3">{eventData.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>What's next?</strong> Your event is now under review. We'll notify you once it's been approved and published to the events calendar. You can view and manage all your submitted events below.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};