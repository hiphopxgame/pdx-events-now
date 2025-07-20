import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Star, 
  Phone, 
  Globe, 
  Check, 
  X, 
  Loader2,
  Building2,
  Eye,
  Edit,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useNavigate } from 'react-router-dom';

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
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
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
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      fetchVenues();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterVenues();
  }, [venues, searchTerm, statusFilter]);

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

  const filterVenues = () => {
    let filtered = venues;

    if (searchTerm) {
      filtered = filtered.filter(venue => 
        venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(venue => venue.status === statusFilter);
    }

    setFilteredVenues(filtered);
  };

  const handleEditVenue = (venue: Venue) => {
    navigate(`/admin/venues/${venue.id}`);
  };

  const handleCreateVenue = () => {
    navigate('/admin/venues/new');
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
              <p className="text-gray-600">Manage venues and their details</p>
            </div>
            <Button 
              onClick={handleCreateVenue}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Venue
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search venues by name, address, or city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>


          {/* Venues List */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-emerald-700">{venues.length}</div>
                    <div className="text-sm text-gray-600">Total Venues</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-700">
                      {venues.filter(v => v.status === 'approved').length}
                    </div>
                    <div className="text-sm text-gray-600">Approved</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-700">
                      {venues.filter(v => v.status === 'pending').length}
                    </div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-700">
                      {venues.filter(v => v.status === 'rejected').length}
                    </div>
                    <div className="text-sm text-gray-600">Rejected</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {filteredVenues.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No venues found</h3>
                      <p className="text-gray-500">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Try adjusting your search or filter criteria.' 
                          : 'Create venues to get started.'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredVenues.map((venue) => (
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditVenue(venue)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
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
            </div>
          )}
        </div>
        
        <Footer />
      </div>

    </ProtectedRoute>
  );
};

export default AdminVenues;