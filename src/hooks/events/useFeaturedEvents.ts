import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event, UserEvent } from './types';
import { transformUserEventsToEvents } from './eventTransformers';

export const useFeaturedEvents = () => {
  return useQuery({
    queryKey: ['featured-events'],
    queryFn: async () => {
      // Fetch featured API events
      const { data: apiEvents, error: apiError } = await supabase
        .from('poreve_events')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (apiError) {
        console.error('Error fetching featured API events:', apiError);
        throw apiError;
      }

      // Fetch featured user events
      const { data: userEvents, error: userError } = await supabase
        .from('user_events')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'approved')
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (userError) {
        console.error('Error fetching featured user events:', userError);
        throw userError;
      }

      // Transform user events and combine with API events
      const transformedUserEvents = transformUserEventsToEvents(userEvents as UserEvent[]);
      const allFeaturedEvents = [...(apiEvents as Event[]), ...transformedUserEvents];

      // Sort by start date
      return allFeaturedEvents.sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};