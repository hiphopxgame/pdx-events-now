import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { EventsGrid } from '@/components/EventsGrid';
import { SearchFilters } from '@/components/SearchFilters';
import { Footer } from '@/components/Footer';
import { useEvents, useCategories } from '@/hooks/useEvents';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { EnhancedPagination } from '@/components/EnhancedPagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Events = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const scrollTargetRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  const handleEventClick = (event: any) => {
    navigate(`/event/${event.id}`);
  };

  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useEvents({
    searchTerm,
    category: selectedCategory,
    dateFilter: selectedDate,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedDate, itemsPerPage]);

  if (eventsError) {
    console.error('Events error:', eventsError);
  }

  // Transform events to match the EventCard interface
  const transformedEvents = events.map(event => {
    let formattedTime = 'TBA';
    let dateString = event.start_date;
    
    if (event.start_date) {
      try {
        // Parse the date and time correctly without timezone conversion
        if (event.start_date.includes('T')) {
          const eventDate = new Date(event.start_date);
          if (!isNaN(eventDate.getTime())) {
            formattedTime = eventDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/Los_Angeles'
            });
            dateString = event.start_date.split('T')[0];
          }
        } else {
          // If no time component, just use the date
          dateString = event.start_date;
        }
      } catch (error) {
        console.error('Date parsing error:', error, event.start_date);
      }
    }
    
    return {
      id: event.id,
      title: event.title,
      date: dateString,
      time: formattedTime,
      venue: event.venue_name,
      category: event.category,
      price: event.price_display || 'TBA',
      imageUrl: event.image_url || '/placeholder.svg',
      description: event.description || '',
      startDate: event.start_date,
      endDate: event.end_date,
      venueAddress: event.venue_address,
      venueCity: event.venue_city,
      venueState: event.venue_state,
      ticketUrl: event.ticket_url,
      organizerName: event.organizer_name,
      submittedBy: (event as any).created_by,
      recurrencePattern: (event as any).recurrence_pattern,
      createdBy: (event as any).created_by,
      endTime: (event as any).end_time,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-800">Portland Events</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
          </div>
          <p className="text-gray-600">Discover what's happening in Portland</p>
        </div>

        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          categories={categories}
          categoriesLoading={categoriesLoading}
        />
        
        {eventsLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-lg text-gray-600">Loading Portland events...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Add ref for scroll target */}
            <div ref={(el) => { if (el) scrollTargetRef.current = el; }} />
            <EventsGrid 
              events={transformedEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)} 
              onEventClick={handleEventClick} 
            />
            
            {transformedEvents.length > 0 && (
              <EnhancedPagination
                currentPage={currentPage}
                totalItems={transformedEvents.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                scrollTargetRef={scrollTargetRef}
              />
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Events;