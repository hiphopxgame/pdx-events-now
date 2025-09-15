
import { Event, UseEventsOptions } from './types';
import { getLocationFilter } from '@/utils/domainConfig';

export const applyEventFilters = (events: Event[], options: UseEventsOptions): Event[] => {
  let filteredEvents = [...events];

  // Filter out past events - only show current and upcoming events
  // Consider an event current if it's today or in the future
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of today
  
  filteredEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.start_date);
    eventDate.setHours(0, 0, 0, 0); // Set to start of event day
    return eventDate >= now;
  });

  // Location filter based on domain
  const locationFilter = getLocationFilter();
  if (locationFilter) {
    filteredEvents = filteredEvents.filter(event => {
      // If no location filter is set, show all events (Public.Events)
      if (!locationFilter.cities && !locationFilter.states && !locationFilter.regions) {
        return true;
      }

      const eventCity = event.venue_city?.toLowerCase() || '';
      const eventState = event.venue_state?.toLowerCase() || '';

      // Check cities
      if (locationFilter.cities) {
        const matchesCity = locationFilter.cities.some(city => 
          eventCity.includes(city.toLowerCase())
        );
        if (matchesCity) return true;
      }

      // Check states
      if (locationFilter.states) {
        const matchesState = locationFilter.states.some(state => 
          eventState.includes(state.toLowerCase()) || 
          eventState === state.toLowerCase()
        );
        if (matchesState) return true;
      }

      // Check regions (for venue names or descriptions that might mention regions)
      if (locationFilter.regions) {
        const venueName = event.venue_name?.toLowerCase() || '';
        const description = event.description?.toLowerCase() || '';
        const matchesRegion = locationFilter.regions.some(region => 
          venueName.includes(region.toLowerCase()) ||
          description.includes(region.toLowerCase()) ||
          eventCity.includes(region.toLowerCase())
        );
        if (matchesRegion) return true;
      }

      // If location filter is set but no matches found, exclude the event
      return false;
    });
  }

  if (options.searchTerm) {
    filteredEvents = filteredEvents.filter(event =>
      event.title.toLowerCase().includes(options.searchTerm!.toLowerCase()) ||
      event.venue_name.toLowerCase().includes(options.searchTerm!.toLowerCase())
    );
  }

  if (options.category && options.category !== 'all') {
    filteredEvents = filteredEvents.filter(event => {
      // Handle both slug and name matching for better compatibility
      const categoryLower = event.category.toLowerCase();
      const optionLower = options.category!.toLowerCase();
      
      // Direct match
      if (categoryLower === optionLower) return true;
      
      // Slug to name mapping
      const categoryMap: Record<string, string[]> = {
        'music': ['music', 'open mic'],
        'arts-culture': ['arts & culture', 'arts', 'culture'],
        'food-drink': ['food & drink', 'food', 'drink'],
        'technology': ['technology', 'tech'],
        'outdoor': ['outdoor', 'outdoors'],
        'entertainment': ['entertainment'],
        'sports': ['sports'],
        'business': ['business'],
        'family': ['family'],
        'health-wellness': ['health & wellness', 'health', 'wellness']
      };
      
      // Check if selected category matches any mapped values
      for (const [slug, names] of Object.entries(categoryMap)) {
        if (slug === optionLower && names.some(name => categoryLower.includes(name))) {
          return true;
        }
      }
      
      return false;
    });
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
