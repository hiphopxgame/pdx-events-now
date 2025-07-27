
export interface EventFormData {
  title: string;
  description: string;
  category: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_zip: string;
  venue_website_url: string;
  venue_facebook_url: string;
  venue_instagram_url: string;
  venue_twitter_url: string;
  venue_youtube_url: string;
  venue_ages: string;
  price_display: string;
  ticket_url: string;
  website_url: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  youtube_url: string;
  start_date: Date;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_type: string;
  recurrence_pattern: string;
  recurrence_end_date: Date;
}
