
import React from 'react';
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
}

interface EventsGridProps {
  events: Event[];
}

export const EventsGrid: React.FC<EventsGridProps> = ({ events }) => {
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Upcoming Events
          <span className="text-emerald-600 ml-2">({events.length})</span>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};
