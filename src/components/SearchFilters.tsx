
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedDate,
  setSelectedDate,
}) => {
  const categories = [
    'all',
    'Music',
    'Food & Drink',
    'Arts & Culture',
    'Technology',
    'Outdoor',
    'Entertainment',
    'Sports',
    'Business'
  ];

  return (
    <div className="mb-12">
      <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search events or venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 border-emerald-200 focus:border-emerald-500"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-12 border-emerald-200 focus:border-emerald-500">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-white border-emerald-200">
              {categories.map((category) => (
                <SelectItem key={category} value={category} className="hover:bg-emerald-50">
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="h-12 border-emerald-200 focus:border-emerald-500">
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent className="bg-white border-emerald-200">
              <SelectItem value="all" className="hover:bg-emerald-50">All Dates</SelectItem>
              <SelectItem value="2025-06-21" className="hover:bg-emerald-50">Today</SelectItem>
              <SelectItem value="2025-06-22" className="hover:bg-emerald-50">Tomorrow</SelectItem>
              <SelectItem value="2025-06-23" className="hover:bg-emerald-50">This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
