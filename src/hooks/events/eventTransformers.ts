
import { UserEvent, Event } from './types';

export const transformUserEventsToEvents = (userEvents: UserEvent[]): Event[] => {
  return userEvents.map(event => ({
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
};
