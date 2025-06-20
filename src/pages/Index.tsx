
import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { EventsGrid } from '@/components/EventsGrid';
import { SearchFilters } from '@/components/SearchFilters';
import { Hero } from '@/components/Hero';
import { EventSync } from '@/components/EventSync';
import { useEvents, useCategories } from '@/hooks/useEvents';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');

  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useEvents({
    searchTerm,
    category: selectedCategory,
    dateFilter: selectedDate,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  if (eventsError) {
    console.error('Events error:', eventsError);
  }

  // Transform events to match the EventCard interface
  const transformedEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    date: event.start_date.split('T')[0],
    time: new Date(event.start_date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    venue: event.venue_name,
    category: event.category,
    price: event.price_display || 'TBA',
    imageUrl: event.image_url || '/placeholder.svg',
    description: event.description || '',
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
      <Header />
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
          <EventsGrid events={transformedEvents} />
        )}
      </div>
      
      <EventSync />
    </div>
  );
};

export default Index;
