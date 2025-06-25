
import { Event, UseEventsOptions } from './types';

export const applyEventFilters = (events: Event[], options: UseEventsOptions): Event[] => {
  let filteredEvents = events;

  if (options.searchTerm) {
    filteredEvents = filteredEvents.filter(event =>
      event.title.toLowerCase().includes(options.searchTerm!.toLowerCase()) ||
      event.venue_name.toLowerCase().includes(options.searchTerm!.toLowerCase())
    );
  }

  if (options.category && options.category !== 'all') {
    filteredEvents = filteredEvents.filter(event => event.category === options.category);
  }

  if (options.dateFilter && options.dateFilter !== 'all') {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    switch (options.dateFilter) {
      case 'today':
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.start_date).toDateString();
          return eventDate === today.toDateString();
        });
        break;
      case 'tomorrow':
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.start_date).toDateString();
          return eventDate === tomorrow.toDateString();
        });
        break;
      case 'this-week':
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate <= endOfWeek;
        });
        break;
    }
  }

  return filteredEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
};
