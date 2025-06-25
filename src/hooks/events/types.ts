
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

export interface UseEventsOptions {
  searchTerm?: string;
  category?: string;
  dateFilter?: string;
}
