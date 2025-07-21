import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useEvents } from '@/hooks/useEvents';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Loader2 } from 'lucide-react';

const Venues = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: allEvents = [], isLoading } = useEvents();

  // Get unique venues with event counts
  const venues = React.useMemo(() => {
    const venueMap = new Map();
    
    allEvents.forEach(event => {
      const venueName = event.venue_name;
      if (!venueName) return;
      
      if (venueMap.has(venueName)) {
        const existing = venueMap.get(venueName);
        existing.eventCount++;
        existing.upcomingEvents = allEvents.filter(e => 
          e.venue_name === venueName && new Date(e.start_date) >= new Date()
        ).length;
      } else {
        const upcomingEvents = allEvents.filter(e => 
          e.venue_name === venueName && new Date(e.start_date) >= new Date()
        ).length;
        
        venueMap.set(venueName, {
          name: venueName,
          address: event.venue_address,
          city: event.venue_city,
          state: event.venue_state,
          eventCount: 1,
          upcomingEvents,
          lastEvent: event
        });
      }
    });
    
    return Array.from(venueMap.values())
      .filter(venue => 
        venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allEvents, searchTerm]);

  const handleVenueClick = (venueName: string) => {
    navigate(`/venue/${encodeURIComponent(venueName)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        <div className="flex justify-center items-center py-16">
          <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-lg text-gray-600">Loading venues...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Portland Venues</h1>
          <p className="text-gray-600">Discover the best event venues in Portland</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search venues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Venues Grid */}
        {venues.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">No venues found</h3>
              <p className="text-gray-500">Try adjusting your search to find venues.</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                Venues
                <span className="text-emerald-600 ml-2">({venues.length})</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => {
                const fullAddress = [venue.address, venue.city, venue.state]
                  .filter(Boolean)
                  .join(', ');
                
                return (
                  <Card 
                    key={venue.name}
                    className="group hover:shadow-xl transition-all duration-300 border-emerald-100 hover:border-emerald-300 cursor-pointer"
                    onClick={() => handleVenueClick(venue.name)}
                  >
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">
                        {venue.name}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {fullAddress && (
                        <div className="flex items-start text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-emerald-600 mt-0.5" />
                          <span className="text-sm">{fullAddress}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
                        <span className="text-sm">
                          {venue.upcomingEvents} upcoming • {venue.eventCount} total events
                        </span>
                      </div>
                      
                      <div className="pt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          View Details
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Venues;