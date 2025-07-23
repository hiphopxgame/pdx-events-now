
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  event_count?: number;
}

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  categories?: Category[];
  categoriesLoading?: boolean;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedDate,
  setSelectedDate,
  categories = [],
  categoriesLoading = false,
}) => {
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
              <SelectItem value="all" className="hover:bg-emerald-50">
                All Categories
              </SelectItem>
              {categoriesLoading ? (
                <SelectItem value="loading" disabled className="hover:bg-emerald-50">
                  Loading categories...
                </SelectItem>
              ) : (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug} className="hover:bg-emerald-50">
                    {category.name} {category.event_count && `(${category.event_count})`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="h-12 border-emerald-200 focus:border-emerald-500">
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent className="bg-white border-emerald-200">
              <SelectItem value="all" className="hover:bg-emerald-50">All Dates</SelectItem>
              <SelectItem value="today" className="hover:bg-emerald-50">Today</SelectItem>
              <SelectItem value="tomorrow" className="hover:bg-emerald-50">Tomorrow</SelectItem>
              <SelectItem value="this-week" className="hover:bg-emerald-50">This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
