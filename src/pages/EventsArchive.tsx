import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EventCard } from '@/components/EventCard';
import { EnhancedPagination } from '@/components/EnhancedPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Archive, Calendar, Search } from 'lucide-react';
import { UserEvent } from '@/hooks/events/types';

const ITEMS_PER_PAGE = 12;

export default function EventsArchive() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['archive-events'],
    queryFn: async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('user_events')
        .select('*, created_by')
        .eq('status', 'approved')
        .lt('start_date', now.toISOString().split('T')[0])
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as UserEvent[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poreve_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Filter events based on search and category
  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchTerm || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || 
      event.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Archive className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Events Archive</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse through past events and discover what you missed. Get inspired for future adventures!
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search past events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Events Grid */}
          <div className="mb-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                    <div className="h-32 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : currentEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentEvents.map((userEvent) => {
                  // Transform UserEvent to EventCard's expected Event format
                  const eventForCard = {
                    id: userEvent.id,
                    title: userEvent.title,
                    date: userEvent.start_date,
                    time: userEvent.start_time || '',
                    venue: userEvent.venue_name,
                    category: userEvent.category,
                    price: userEvent.price_display || '',
                    imageUrl: userEvent.image_url || '',
                    description: userEvent.description || '',
                    createdBy: userEvent.created_by,
                    ticketUrl: userEvent.ticket_url || '',
                    venueAddress: userEvent.venue_address || '',
                    venueCity: userEvent.venue_city || '',
                    venueState: userEvent.venue_state || '',
                    endTime: userEvent.end_time || '',
                  };
                  
                  return (
                    <EventCard key={userEvent.id} event={eventForCard} />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Past Events Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search criteria.'
                    : 'No past events are available in the archive yet.'}
                </p>
                {(searchTerm || selectedCategory !== 'all') && (
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <EnhancedPagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}

          {/* Stats */}
          {filteredEvents.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Showing {currentEvents.length} of {filteredEvents.length} past events
                {totalItems !== filteredEvents.length && ` (${totalItems} total)`}
              </p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    );
  }