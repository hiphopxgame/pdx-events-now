
import React from 'react';
import { Calendar, MapPin, Clock, Tag } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
}

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
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
        <div className="aspect-video bg-gradient-to-br from-emerald-100 to-orange-100 relative overflow-hidden">
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
        <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-emerald-700 transition-colors">
          {event.title}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
            <span className="text-sm">{formatDate(event.date)}</span>
            <Clock className="h-4 w-4 ml-4 mr-2 text-emerald-600" />
            <span className="text-sm">{event.time}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
            <span className="text-sm">{event.venue}</span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-3">
          {event.description}
        </p>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <button className="w-full bg-gradient-to-r from-emerald-600 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-orange-600 transition-all duration-300 transform group-hover:scale-105">
          Get Tickets
        </button>
      </CardFooter>
    </Card>
  );
};
