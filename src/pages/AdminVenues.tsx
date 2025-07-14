import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useGooglePlaces, GooglePlace } from '@/hooks/useGooglePlaces';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Search, 
  Plus, 
  Star, 
  Phone, 
  Globe, 
  Check, 
  X, 
  Loader2,
  Building2,
  Eye
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Venue {
  id: string;
  name: string;
  google_place_id?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  google_rating?: number;
  google_review_count?: number;
  google_photos?: string[];
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

const AdminVenues = () => {
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const { searchPlaces, getPlaceDetails, loading: googleLoading } = useGooglePlaces();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showGoogleSearch, setShowGoogleSearch] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchVenues();
    }
  }, [isAdmin]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVenues((data || []) as Venue[]);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch venues',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = await searchPlaces(`${searchQuery} Portland OR`);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search Google Places',
        variant: 'destructive'
      });
    }
  };

  const addVenueFromGoogle = async (place: GooglePlace) => {
    try {
      // Get detailed information about the place
      const details = await getPlaceDetails(place.place_id);
      
      const venueData = {
        name: place.name,
        google_place_id: place.place_id,
        address: place.formatted_address,
        latitude: place.geometry?.location.lat,
        longitude: place.geometry?.location.lng,
        google_rating: place.rating,
        google_review_count: place.user_ratings_total,
        google_photos: place.photos?.map(photo => photo.photo_reference) || [],
        phone: details?.formatted_phone_number,
        website: details?.website,
        status: 'pending'
      };

      const { error } = await supabase
        .from('venues')
        .insert(venueData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Venue added successfully and is pending approval',
      });

      fetchVenues();
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding venue:', error);
      toast({
        title: 'Error',
        description: 'Failed to add venue',
        variant: 'destructive'
      });
    }
  };

  const updateVenueStatus = async (venueId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('venues')
        .update({
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', venueId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Venue ${status} successfully`,
      });

      fetchVenues();
    } catch (error) {
      console.error('Error updating venue status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update venue status',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  if (rolesLoading || !isAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
          <Header />
          <div className="flex justify-center items-center py-16">
            <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-lg text-gray-600">
                  {!isAdmin ? 'Access denied. Admin privileges required.' : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center">
                <Building2 className="h-8 w-8 mr-3 text-emerald-600" />
                Venue Management
              </h1>
              <p className="text-gray-600">Manage venues and Google Places integration</p>
            </div>
            <Button 
              onClick={() => setShowGoogleSearch(!showGoogleSearch)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add from Google
            </Button>
          </div>

          {/* Google Places Search */}
          {showGoogleSearch && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Search Google Places</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search for venues in Portland..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleGoogleSearch()}
                    />
                  </div>
                  <Button 
                    onClick={handleGoogleSearch}
                    disabled={googleLoading || !searchQuery.trim()}
                  >
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Search Results:</h4>
                    {searchResults.map((place) => (
                      <div key={place.place_id} className="border rounded-lg p-4 flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-800">{place.name}</h5>
                          <p className="text-sm text-gray-600 mb-2">{place.formatted_address}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {place.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                {place.rating} ({place.user_ratings_total} reviews)
                              </div>
                            )}
                            {place.photos && place.photos.length > 0 && (
                              <span>{place.photos.length} photos</span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addVenueFromGoogle(place)}
                          className="ml-4"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Venue
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Venues List */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {venues.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No venues found</h3>
                    <p className="text-gray-500">Add venues from Google Places to get started.</p>
                  </CardContent>
                </Card>
              ) : (
                venues.map((venue) => (
                  <Card key={venue.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-gray-800">{venue.name}</h3>
                            <Badge variant={getStatusColor(venue.status)}>
                              {venue.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {venue.address && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="h-4 w-4" />
                                {venue.address}
                              </div>
                            )}
                            
                            {venue.phone && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="h-4 w-4" />
                                {venue.phone}
                              </div>
                            )}
                            
                            {venue.website && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Globe className="h-4 w-4" />
                                <a href={venue.website} target="_blank" rel="noopener noreferrer" 
                                   className="text-emerald-600 hover:underline">
                                  Website
                                </a>
                              </div>
                            )}
                            
                            {venue.google_rating && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Star className="h-4 w-4 text-yellow-500" />
                                {venue.google_rating} ({venue.google_review_count} reviews)
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 text-xs text-gray-500">
                            Added: {new Date(venue.created_at).toLocaleDateString()}
                            {venue.approved_at && (
                              <span className="ml-4">
                                Approved: {new Date(venue.approved_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          {venue.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateVenueStatus(venue.id, 'approved')}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateVenueStatus(venue.id, 'rejected')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {venue.google_place_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://www.google.com/maps/place/?q=place_id:${venue.google_place_id}`, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View on Google
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default AdminVenues;