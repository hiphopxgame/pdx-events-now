
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  venue_name: string;
  venue_address: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_zip: string | null;
  category: string;
  price_min: number | null;
  price_max: number | null;
  price_display: string | null;
  image_url: string | null;
  ticket_url: string | null;
  organizer_name: string | null;
  organizer_url: string | null;
  tags: string[] | null;
  api_source: string;
  external_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UseEventsOptions {
  searchTerm?: string;
  category?: string;
  dateFilter?: string;
}

export const useEvents = (options: UseEventsOptions = {}) => {
  return useQuery({
    queryKey: ['events', options],
    queryFn: async () => {
      let query = supabase
        .from('poreve_events')
        .select('*')
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      // Apply search filter
      if (options.searchTerm) {
        query = query.or(`title.ilike.%${options.searchTerm}%,venue_name.ilike.%${options.searchTerm}%`);
      }

      // Apply category filter
      if (options.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      // Apply date filter
      if (options.dateFilter && options.dateFilter !== 'all') {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        switch (options.dateFilter) {
          case 'today':
            query = query
              .gte('start_date', today.toISOString().split('T')[0])
              .lt('start_date', tomorrow.toISOString().split('T')[0]);
            break;
          case 'tomorrow':
            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
            query = query
              .gte('start_date', tomorrow.toISOString().split('T')[0])
              .lt('start_date', dayAfterTomorrow.toISOString().split('T')[0]);
            break;
          case 'this-week':
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
            query = query.lt('start_date', endOfWeek.toISOString());
            break;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      return data as Event[];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poreve_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      return data;
    },
  });
};
