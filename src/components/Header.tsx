
import React from 'react';
import { Calendar } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-emerald-600 to-orange-500 p-2 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-orange-500 bg-clip-text text-transparent">
                Portland.Events
              </h1>
              <p className="text-sm text-gray-600">Discover what's happening in the Rose City</p>
            </div>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#events" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              Events
            </a>
            <a href="#venues" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              Venues
            </a>
            <a href="#about" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              About
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};
