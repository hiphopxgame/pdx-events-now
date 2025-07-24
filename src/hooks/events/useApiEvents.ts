
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
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching API events:', error);
        throw error;
      }

      return data as Event[];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
