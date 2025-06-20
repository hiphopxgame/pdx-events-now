
import React from 'react';

export const Hero = () => {
  return (
    <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-700 to-orange-600 text-white">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Discover Portland's
            <span className="block text-orange-200">Best Events</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-emerald-100 max-w-3xl mx-auto">
            From food festivals to indie concerts, tech meetups to outdoor adventures - 
            find your next Portland experience here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-emerald-700 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors">
              Browse Events
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-700 transition-colors">
              Submit Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
