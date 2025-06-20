
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { EventsGrid } from '@/components/EventsGrid';
import { SearchFilters } from '@/components/SearchFilters';
import { Hero } from '@/components/Hero';
import { useQuery } from '@tanstack/react-query';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  price: string;
  imageUrl: string;
  description: string;
}

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');

  // Mock data for now - will be replaced with API calls
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Portland Food & Wine Festival',
      date: '2025-06-25',
      time: '6:00 PM',
      venue: 'Pioneer Courthouse Square',
      category: 'Food & Drink',
      price: '$45',
      imageUrl: '/placeholder.svg',
      description: 'Annual celebration of Portland\'s culinary scene with local restaurants and wineries.'
    },
    {
      id: '2',
      title: 'Indie Rock at Doug Fir',
      date: '2025-06-22',
      time: '8:00 PM',
      venue: 'Doug Fir Lounge',
      category: 'Music',
      price: '$25',
      imageUrl: '/placeholder.svg',
      description: 'Local indie bands showcase their latest music in an intimate venue setting.'
    },
    {
      id: '3',
      title: 'Saturday Market Arts & Crafts',
      date: '2025-06-21',
      time: '10:00 AM',
      venue: 'Tom McCall Waterfront Park',
      category: 'Arts & Culture',
      price: 'Free',
      imageUrl: '/placeholder.svg',
      description: 'Browse unique handmade items from local artisans and craftspeople.'
    },
    {
      id: '4',
      title: 'Tech Meetup: AI in Portland',
      date: '2025-06-23',
      time: '7:00 PM',
      venue: 'WeWork Pearl District',
      category: 'Technology',
      price: 'Free',
      imageUrl: '/placeholder.svg',
      description: 'Network with local tech professionals and learn about AI developments.'
    },
    {
      id: '5',
      title: 'Forest Park Nature Walk',
      date: '2025-06-24',
      time: '9:00 AM',
      venue: 'Forest Park',
      category: 'Outdoor',
      price: '$10',
      imageUrl: '/placeholder.svg',
      description: 'Guided nature walk through one of the largest urban forests in the US.'
    },
    {
      id: '6',
      title: 'Comedy Night at Helium',
      date: '2025-06-26',
      time: '9:30 PM',
      venue: 'Helium Comedy Club',
      category: 'Entertainment',
      price: '$30',
      imageUrl: '/placeholder.svg',
      description: 'Stand-up comedy featuring touring comedians and local talent.'
    }
  ];

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesDate = selectedDate === 'all' || event.date === selectedDate;
    
    return matchesSearch && matchesCategory && matchesDate;
  });

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
        />
        <EventsGrid events={filteredEvents} />
      </div>
    </div>
  );
};

export default Index;
