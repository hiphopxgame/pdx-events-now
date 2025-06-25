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

export interface UserEvent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  venue_name: string;
  venue_address: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_zip: string | null;
  price_display: string | null;
  price_min: number | null;
  price_max: number | null;
  organizer_name: string | null;
  organizer_email: string | null;
  organizer_phone: string | null;
  ticket_url: string | null;
  image_url: string | null;
  start_date: string;
  start_time: string | null;
  end_time: string | null;
  is_recurring: boolean;
  recurrence_type: string | null;
  recurrence_pattern: string | null;
  recurrence_end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
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
      // Fetch both API events and approved user events
      const [apiEventsResponse, userEventsResponse] = await Promise.all([
        supabase
          .from('poreve_events')
          .select('*')
          .eq('is_active', true)
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true }),
        supabase
          .from('user_events')
          .select('*')
          .eq('status', 'approved')
          .gte('start_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true })
      ]);

      if (apiEventsResponse.error) {
        console.error('Error fetching API events:', apiEventsResponse.error);
      }
      
      if (userEventsResponse.error) {
        console.error('Error fetching user events:', userEventsResponse.error);
      }

      const apiEvents = apiEventsResponse.data || [];
      const userEvents = userEventsResponse.data || [];

      // Transform user events to match the Event interface
      const transformedUserEvents = userEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start_date: `${event.start_date}T${event.start_time || '00:00:00'}`,
        end_date: event.start_time && event.end_time ? `${event.start_date}T${event.end_time}` : null,
        venue_name: event.venue_name,
        venue_address: event.venue_address,
        venue_city: event.venue_city,
        venue_state: event.venue_state,
        venue_zip: event.venue_zip,
        category: event.category,
        price_min: event.price_min,
        price_max: event.price_max,
        price_display: event.price_display,
        image_url: event.image_url,
        ticket_url: event.ticket_url,
        organizer_name: event.organizer_name,
        organizer_url: null,
        tags: null,
        api_source: 'user_submitted',
        external_id: event.id,
        is_active: true,
        created_at: event.created_at,
        updated_at: event.updated_at,
      }));

      // Combine and sort all events
      const allEvents = [...apiEvents, ...transformedUserEvents];

      // Apply filters
      let filteredEvents = allEvents;

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

      return filteredEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) as Event[];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserEvents = () => {
  return useQuery({
    queryKey: ['user-events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user events:', error);
        throw error;
      }

      return data as UserEvent[];
    },
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
