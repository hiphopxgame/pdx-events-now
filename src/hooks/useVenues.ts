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

      // Create a map to track unique venues using a composite key
      const venueMap = new Map();

      // Helper function to create a unique key for venue comparison
      const createVenueKey = (name: string, city: string, state: string, zipCode: string) => {
        return `${name.toLowerCase().trim()}_${(city || '').toLowerCase().trim()}_${(state || '').toLowerCase().trim()}_${(zipCode || '').toLowerCase().trim()}`;
      };

      // Add venues from venues table
      venuesData.forEach(venue => {
        const key = createVenueKey(venue.name, venue.city || '', venue.state || '', venue.zip_code || '');
        venueMap.set(key, venue);
      });

      // Add venues from events (only if not already in venues table with same location details)
      eventsData.forEach(event => {
        const key = createVenueKey(
          event.venue_name, 
          event.venue_city || 'Portland', 
          event.venue_state || 'Oregon', 
          event.venue_zip || ''
        );
        
        if (!venueMap.has(key)) {
          venueMap.set(key, {
            id: `event-venue-${event.venue_name}-${event.venue_city || 'Portland'}`, // Generate a more unique temporary ID
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