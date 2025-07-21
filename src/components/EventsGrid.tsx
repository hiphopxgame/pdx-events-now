
import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { EventCard } from './EventCard';

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
  submittedBy?: string;
  recurrencePattern?: string;
  createdBy?: string;
}

interface EventsGridProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}

interface DailyEvents {
  [key: string]: Event[];
}

export const EventsGrid: React.FC<EventsGridProps> = ({ events, onEventClick }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">No events found</h3>
          <p className="text-gray-500">Try adjusting your search filters to find more events.</p>
        </div>
      </div>
    );
  }

  // Group events by day
  const groupEventsByDay = (events: Event[]): DailyEvents => {
    return events.reduce((acc, event) => {
      try {
        const date = new Date(event.startDate || event.date);
        if (isNaN(date.getTime())) return acc;
        
        const dayKey = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
        
        if (!acc[dayKey]) {
          acc[dayKey] = [];
        }
        acc[dayKey].push(event);
        return acc;
      } catch {
        return acc;
      }
    }, {} as DailyEvents);
  };

  const dailyEvents = groupEventsByDay(events);
  const sortedDays = Object.keys(dailyEvents).sort((a, b) => {
    const dateA = new Date(dailyEvents[a][0]?.startDate || dailyEvents[a][0]?.date);
    const dateB = new Date(dailyEvents[b][0]?.startDate || dailyEvents[b][0]?.date);
    return dateA.getTime() - dateB.getTime();
  });

  const formatDayHeader = (dayKey: string) => {
    try {
      // Extract the date from the first event of this day
      const firstEvent = dailyEvents[dayKey][0];
      const date = new Date(firstEvent.startDate || firstEvent.date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      // Reset time for comparison
      const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      
      if (eventDate.getTime() === todayDate.getTime()) {
        return `Today - ${date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        })}`;
      } else if (eventDate.getTime() === tomorrowDate.getTime()) {
        return `Tomorrow - ${date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        })}`;
      } else {
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    } catch {
      return dayKey;
    }
  };

  const getEventCountForDay = (dayKey: string) => {
    return dailyEvents[dayKey]?.length || 0;
  };

  return (
    <div className="space-y-12">
      {/* Total Events Summary */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-emerald-600" />
          <h2 className="text-3xl font-bold text-gray-800">
            Events Calendar
            <span className="text-emerald-600 ml-2">({events.length} events)</span>
          </h2>
        </div>
      </div>

      {/* Daily Grouped Events */}
      {sortedDays.map((dayKey) => (
        <div key={dayKey} className="mb-8">
          {/* Day Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-emerald-100">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {formatDayHeader(dayKey)}
                </h3>
                <p className="text-gray-600 text-sm">
                  {getEventCountForDay(dayKey)} event{getEventCountForDay(dayKey) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          
          {/* Events Grid for this day */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dailyEvents[dayKey].map((event) => (
              <EventCard key={event.id} event={event} onEventClick={onEventClick} />
            ))}
          </div>
        </div>
      ))}

    </div>
  );
};
