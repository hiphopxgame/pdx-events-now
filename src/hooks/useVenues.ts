import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Venue {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  website?: string;
  status?: string;
}

export const useVenues = () => {
  return useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      // Get venues from the venues table
      const { data: venuesData, error: venuesError } = await supabase
        .from('venues')
        .select('*')
        .eq('status', 'approved')
        .order('name');
      
      if (venuesError) throw venuesError;

      // Get unique venues from approved events
      const { data: eventsData, error: eventsError } = await supabase
        .from('user_events')
        .select('venue_name, venue_address, venue_city, venue_state, venue_zip')
        .eq('status', 'approved')
        .not('venue_name', 'is', null);
      
      if (eventsError) throw eventsError;

      // Create a map to track unique venues
      const venueMap = new Map();

      // Add venues from venues table
      venuesData.forEach(venue => {
        venueMap.set(venue.name, venue);
      });

      // Add venues from events (if not already in venues table)
      eventsData.forEach(event => {
        if (!venueMap.has(event.venue_name)) {
          venueMap.set(event.venue_name, {
            id: `event-venue-${event.venue_name}`, // Generate a temporary ID
            name: event.venue_name,
            address: event.venue_address,
            city: event.venue_city || 'Portland',
            state: event.venue_state || 'Oregon',
            zip_code: event.venue_zip,
            status: 'approved'
          });
        }
      });

      // Convert map to array and sort by name
      return Array.from(venueMap.values()).sort((a, b) => a.name.localeCompare(b.name)) as Venue[];
    },
  });
};