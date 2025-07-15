
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

interface MonthlyEvents {
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

  // Group events by month
  const groupEventsByMonth = (events: Event[]): MonthlyEvents => {
    return events.reduce((acc, event) => {
      try {
        const date = new Date(event.startDate || event.date);
        if (isNaN(date.getTime())) return acc;
        
        const monthKey = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
        
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push(event);
        return acc;
      } catch {
        return acc;
      }
    }, {} as MonthlyEvents);
  };

  const monthlyEvents = groupEventsByMonth(events);
  const sortedMonths = Object.keys(monthlyEvents).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  const formatMonthHeader = (monthKey: string) => {
    try {
      const date = new Date(monthKey);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    } catch {
      return monthKey;
    }
  };

  const getEventCountForMonth = (monthKey: string) => {
    return monthlyEvents[monthKey]?.length || 0;
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

      {/* Monthly Grouped Events */}
      {sortedMonths.map((monthKey) => (
        <div key={monthKey} className="mb-12">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-emerald-100">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {formatMonthHeader(monthKey)}
                </h3>
                <p className="text-gray-600">
                  {getEventCountForMonth(monthKey)} event{getEventCountForMonth(monthKey) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          
          {/* Events Grid for this month */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monthlyEvents[monthKey].map((event) => (
              <EventCard key={event.id} event={event} onEventClick={onEventClick} />
            ))}
          </div>
        </div>
      ))}

      {/* Navigation hint */}
      <div className="text-center py-8 border-t border-emerald-100">
        <p className="text-gray-500 text-sm">
          Events are organized by month for easy browsing
        </p>
      </div>
    </div>
  );
};
