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
        .from('user_events')
        .select('*')
        .eq('is_featured', true)
        .not('api_source', 'is', null)
        .eq('status', 'approved')
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
      const transformedApiEvents = apiEvents?.map(event => ({
        ...event,
        created_by: null, // API events don't have user creators
        end_date: event.end_time ? 
          `${event.start_date.split('T')[0]}T${event.end_time}:00.000Z` : 
          null,
        organizer_url: event.website_url || null,
        tags: null,
        is_active: true,
        website: event.website_url
      })) as Event[];
      const allFeaturedEvents = [...transformedApiEvents, ...transformedUserEvents];

      // Sort by start date
      return allFeaturedEvents.sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};