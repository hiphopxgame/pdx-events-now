
import { useQuery } from '@tanstack/react-query';
import { UseEventsOptions } from './events/types';
import { useApiEvents } from './events/useApiEvents';
import { useApprovedUserEvents } from './events/useUserEvents';
import { transformUserEventsToEvents } from './events/eventTransformers';
import { applyEventFilters } from './events/eventFilters';

export const useEvents = (options: UseEventsOptions = {}) => {
  const { data: apiEvents = [], isLoading: apiLoading, error: apiError } = useApiEvents();
  const { data: userEvents = [], isLoading: userLoading, error: userError } = useApprovedUserEvents();

  return useQuery({
    queryKey: ['events-v2', options], // Updated cache key
    queryFn: async () => {
      // Transform user events to match the Event interface
      const transformedUserEvents = transformUserEventsToEvents(userEvents);

      // Combine all events
      const allEvents = [...apiEvents, ...transformedUserEvents];

      console.log('Combined events:', allEvents.length, 'API events:', apiEvents.length, 'User events:', transformedUserEvents.length);

      // Apply filters
      const filteredEvents = applyEventFilters(allEvents, options);
      console.log('Filtered events:', filteredEvents.length);
      
      return filteredEvents;
    },
    enabled: !apiLoading && !userLoading,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Re-export the individual hooks for direct use
export { useUserEvents, usePendingEvents } from './events/useUserEvents';
export { useCategories } from './events/useCategories';
export { useFeaturedEvents } from './events/useFeaturedEvents';

// Re-export types for convenience
export type { Event, UserEvent, UseEventsOptions } from './events/types';
