
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Hero = () => {
  const navigate = useNavigate();

  const handleBrowseEvents = () => {
    // Scroll to events section
    const eventsSection = document.querySelector('.grid');
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmitEvent = () => {
    navigate('/submit-event');
  };

  return (
    <div className="relative bg-gradient-primary text-white">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Discover Portland's
            <span className="block text-brand-yellow">Best Events</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            From food festivals to indie concerts, tech meetups to outdoor adventures - 
            find your next Portland experience here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleBrowseEvents}
              className="bg-brand-yellow text-brand-green px-8 py-3 rounded-lg font-semibold hover:bg-brand-yellow/90 transition-colors shadow-lg"
            >
              Browse Events
            </button>
            <button 
              onClick={handleSubmitEvent}
              className="border-2 border-brand-white text-brand-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-white hover:text-brand-green transition-colors"
            >
              Submit Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
