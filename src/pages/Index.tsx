
import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { EventsGrid } from '@/components/EventsGrid';
import { SearchFilters } from '@/components/SearchFilters';
import { Hero } from '@/components/Hero';
import { Footer } from '@/components/Footer';
import { FeaturedEvents } from '@/components/FeaturedEvents';
import { useEvents, useCategories } from '@/hooks/useEvents';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
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
  }, [searchTerm, selectedCategory, selectedDate]);

  if (eventsError) {
    console.error('Events error:', eventsError);
  }

  const transformedEvents = events.map(event => {
    // Handle date parsing safely
    let formattedTime = 'TBA';
    let formattedEndTime = '';
    let dateString = event.start_date;
    
    if (event.start_date) {
      try {
        // If start_date includes timezone, use it directly
        const eventDate = new Date(event.start_date);
        if (!isNaN(eventDate.getTime())) {
          formattedTime = eventDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Los_Angeles'
          });
          dateString = eventDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          });
        }
      } catch (error) {
        console.error('Date parsing error:', error, event.start_date);
      }
    }
    
    // Handle end time formatting
    if (event.end_date) {
      try {
        const endDate = new Date(event.end_date);
        if (!isNaN(endDate.getTime())) {
          formattedEndTime = endDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Los_Angeles'
          });
        }
      } catch (error) {
        console.error('End date parsing error:', error, event.end_date);
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
      endTime: formattedEndTime,
      venueAddress: event.venue_address,
      venueCity: event.venue_city,
      venueState: event.venue_state,
      ticketUrl: event.ticket_url,
      organizerName: event.organizer_name,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10">
      <Header />
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FeaturedEvents onEventClick={handleEventClick} />
        
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
            <div className="bg-white rounded-xl shadow-lg border border-primary/20 p-12">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg text-gray-600">Loading Portland events...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <EventsGrid 
              events={transformedEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)} 
              onEventClick={handleEventClick} 
            />
            
            {transformedEvents.length > itemsPerPage && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(currentPage - 1);
                          }}
                        />
                      </PaginationItem>
                    )}
                    
                    {Array.from({ length: Math.ceil(transformedEvents.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    {currentPage < Math.ceil(transformedEvents.length / itemsPerPage) && (
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(currentPage + 1);
                          }}
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Index;
