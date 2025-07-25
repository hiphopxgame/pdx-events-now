
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event } from './types';

export const useApiEvents = () => {
  return useQuery({
    queryKey: ['api-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poreve_events')
        .select('*')
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching API events:', error);
        throw error;
      }

      // Transform the data to match the Event type and add required created_by field
      return data?.map(event => ({
        ...event,
        created_by: null // API events don't have user creators
      })) as Event[];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
