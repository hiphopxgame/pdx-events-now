
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event } from './types';

export const useApiEvents = () => {
  return useQuery({
    queryKey: ['api-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .not('api_source', 'is', null)
        .eq('status', 'approved')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching API events:', error);
        throw error;
      }

      // Transform the data to match the Event type and add required fields
      return data?.map(event => ({
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
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
