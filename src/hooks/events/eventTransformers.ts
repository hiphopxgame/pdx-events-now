
import { UserEvent, Event } from './types';

const generateRecurringEventDates = (startDate: string, recurrencePattern: string, endDate?: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  
  const endLimit = endDate ? new Date(endDate) : threeMonthsFromNow;
  const finalEndDate = endLimit < threeMonthsFromNow ? endLimit : threeMonthsFromNow;

  if (recurrencePattern.startsWith('every-')) {
    // Weekly recurrence
    const dayName = recurrencePattern.replace('every-', '');
    const dayMap: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    const targetDay = dayMap[dayName];
    if (targetDay !== undefined) {
      let currentDate = new Date(start);
      
      // Find the first occurrence of the target day
      while (currentDate.getDay() !== targetDay) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Generate weekly occurrences
      while (currentDate <= finalEndDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
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
      let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
      
      while (currentDate <= finalEndDate) {
        const monthDate = findNthDayOfMonth(currentDate.getFullYear(), currentDate.getMonth(), occurrence, targetDay);
        if (monthDate && monthDate >= start && monthDate <= finalEndDate) {
          dates.push(monthDate.toISOString().split('T')[0]);
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
      'first': 1, 'second': 2, 'third': 3, 'fourth': 4
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
    if (event.is_recurring && event.recurrence_pattern) {
      // Generate recurring event instances
      const recurringDates = generateRecurringEventDates(
        event.start_date,
        event.recurrence_pattern,
        event.recurrence_end_date || undefined
      );
      
      recurringDates.forEach((date, index) => {
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
        organizer_name: event.organizer_name,
        organizer_url: null,
        tags: null,
        api_source: 'user_submitted',
        external_id: event.id,
        is_active: true,
        created_at: event.created_at,
        updated_at: event.updated_at,
      });
    }
  });
  
  return events;
};
