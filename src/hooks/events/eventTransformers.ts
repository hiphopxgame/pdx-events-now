
import { UserEvent, Event } from './types';

const generateRecurringEventDates = (startDate: string, recurrencePattern: string, endDate?: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00'); // Ensure we're working in local timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  // Generate events for the next 6 months from today (or from start date if it's in the future)
  const sixMonthsFromToday = new Date(today);
  sixMonthsFromToday.setMonth(sixMonthsFromToday.getMonth() + 6);
  
  const endLimit = endDate ? new Date(endDate + 'T00:00:00') : sixMonthsFromToday;
  const finalEndDate = endLimit;
  
  // Start generating from today if the original start date is in the past
  const generateFrom = start < today ? today : start;

  if (recurrencePattern.startsWith('every-')) {
    // Weekly recurrence
    const dayName = recurrencePattern.replace('every-', '');
    const dayMap: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    const targetDay = dayMap[dayName];
    if (targetDay !== undefined) {
      let currentDate = new Date(generateFrom);
      
      // Find the first occurrence of the target day from our generate date
      // If we're already on the target day and it's not in the past, use it
      if (currentDate.getDay() === targetDay && currentDate >= today) {
        // We're already on the right day
      } else {
        // Find the next occurrence of the target day
        const daysUntilTarget = (targetDay - currentDate.getDay() + 7) % 7;
        if (daysUntilTarget === 0 && currentDate < today) {
          // If we're on the target day but it's in the past, move to next week
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (daysUntilTarget > 0) {
          currentDate.setDate(currentDate.getDate() + daysUntilTarget);
        }
      }
      
      // Generate weekly occurrences
      while (currentDate <= finalEndDate) {
        // Format as YYYY-MM-DD in local timezone
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }
  } else if (recurrencePattern.includes('-')) {
    // Monthly recurrence (first-sunday, second-monday, etc.)
    const [occurrence, dayName] = recurrencePattern.split('-');
    const dayMap: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    const targetDay = dayMap[dayName];
    if (targetDay !== undefined) {
      // Start from the month containing our generate date
      let currentDate = new Date(generateFrom.getFullYear(), generateFrom.getMonth(), 1);
      
      while (currentDate <= finalEndDate) {
        const monthDate = findNthDayOfMonth(currentDate.getFullYear(), currentDate.getMonth(), occurrence, targetDay);
        if (monthDate && monthDate >= generateFrom && monthDate <= finalEndDate) {
          // Format as YYYY-MM-DD in local timezone
          const year = monthDate.getFullYear();
          const month = String(monthDate.getMonth() + 1).padStart(2, '0');
          const day = String(monthDate.getDate()).padStart(2, '0');
          dates.push(`${year}-${month}-${day}`);
        }
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
  }

  return dates;
};

const findNthDayOfMonth = (year: number, month: number, occurrence: string, dayOfWeek: number): Date | null => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  if (occurrence === 'last') {
    // Find the last occurrence of the day in the month
    for (let day = lastDay.getDate(); day >= 1; day--) {
      const date = new Date(year, month, day);
      if (date.getDay() === dayOfWeek) {
        return date;
      }
    }
  } else {
    // Find the nth occurrence
    const occurrenceMap: { [key: string]: number } = {
      'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5
    };
    
    const nthOccurrence = occurrenceMap[occurrence];
    if (nthOccurrence) {
      let count = 0;
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        if (date.getDay() === dayOfWeek) {
          count++;
          if (count === nthOccurrence) {
            return date;
          }
        }
      }
    }
  }
  
  return null;
};

export const transformUserEventsToEvents = (userEvents: UserEvent[]): Event[] => {
  const events: Event[] = [];
  
  userEvents.forEach(event => {
    console.log('Processing event:', event.title, 'is_recurring:', event.is_recurring, 'pattern:', event.recurrence_pattern);
    
    if (event.is_recurring && event.recurrence_pattern) {
      // Generate recurring event instances
      const recurringDates = generateRecurringEventDates(
        event.start_date,
        event.recurrence_pattern,
        event.recurrence_end_date || undefined
      );
      
      console.log('Generated recurring dates for', event.title, ':', recurringDates);
      
      recurringDates.forEach((date, index) => {
        // Select a random image from available images for variety
        let selectedImageUrl = event.image_url;
        if (event.image_urls && event.image_urls.length > 0) {
          const randomIndex = Math.floor(Math.random() * event.image_urls.length);
          selectedImageUrl = event.image_urls[randomIndex];
        }

        events.push({
          id: `${event.id}-${index}`,
          title: event.title,
          description: event.description,
          start_date: `${date}T${event.start_time || '00:00:00'}`,
          end_date: event.start_time && event.end_time ? `${date}T${event.end_time}` : null,
          venue_name: event.venue_name,
          venue_address: event.venue_address,
          venue_city: event.venue_city,
          venue_state: event.venue_state,
          venue_zip: event.venue_zip,
          category: event.category,
          price_min: event.price_min,
          price_max: event.price_max,
          price_display: event.price_display,
          image_url: selectedImageUrl,
          ticket_url: event.ticket_url,
          website_url: event.website_url,
          facebook_url: event.facebook_url,
          instagram_url: event.instagram_url,
          twitter_url: event.twitter_url,
          youtube_url: event.youtube_url,
          organizer_name: event.organizer_name,
          organizer_url: null,
          tags: null,
          api_source: 'user_submitted',
          external_id: event.id,
          is_active: true,
          is_featured: event.is_featured,
          created_at: event.created_at,
          updated_at: event.updated_at,
          created_by: event.created_by,
          website: null,
        });
      });
    } else {
      // Non-recurring event
      events.push({
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
        website_url: event.website_url,
        facebook_url: event.facebook_url,
        instagram_url: event.instagram_url,
        twitter_url: event.twitter_url,
        youtube_url: event.youtube_url,
        organizer_name: event.organizer_name,
        organizer_url: null,
        tags: null,
        api_source: 'user_submitted',
        external_id: event.id,
        is_active: true,
        is_featured: event.is_featured,
        created_at: event.created_at,
        updated_at: event.updated_at,
        created_by: event.created_by,
        website: null,
      });
    }
  });
  
  return events;
};
