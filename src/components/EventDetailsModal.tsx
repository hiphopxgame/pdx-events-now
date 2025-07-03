import React from 'react';
import { Calendar, MapPin, Clock, ExternalLink, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
}

interface EventDetailsModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  if (!event) return null;

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

  const fullAddress = [event.venueAddress, event.venueCity, event.venueState]
    .filter(Boolean)
    .join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Image */}
          <div className="aspect-video bg-gradient-to-br from-emerald-100 to-orange-100 relative overflow-hidden rounded-lg">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
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

          {/* Event Details */}
          <div className="space-y-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-3 text-emerald-600" />
              <div>
                <p className="font-medium">{formatDate(event.date)}</p>
                <p className="text-sm text-gray-500">{event.time}</p>
              </div>
            </div>
            
            <div className="flex items-start text-gray-600">
              <MapPin className="h-5 w-5 mr-3 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium">{event.venue}</p>
                {fullAddress && (
                  <p className="text-sm text-gray-500">{fullAddress}</p>
                )}
              </div>
            </div>

            {event.organizerName && (
              <div className="flex items-center text-gray-600">
                <User className="h-5 w-5 mr-3 text-emerald-600" />
                <div>
                  <p className="font-medium">Organized by</p>
                  <p className="text-sm text-gray-500">{event.organizerName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">About This Event</h3>
              <p className="text-gray-600 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {event.ticketUrl ? (
              <Button 
                asChild
                className="flex-1 bg-gradient-to-r from-emerald-600 to-orange-500 hover:from-emerald-700 hover:to-orange-600"
              >
                <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get Tickets
                </a>
              </Button>
            ) : (
              <Button disabled className="flex-1">
                Tickets Not Available
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};