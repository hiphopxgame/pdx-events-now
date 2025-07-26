import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Eye, FileText, Users, Calendar, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';

interface ImportBatch {
  id: string;
  filename: string;
  file_type: string;
  total_events: number;
  total_venues: number;
  status: string;
  created_at: string;
  created_by: string;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  por_eve_profiles?: {
    display_name: string;
    email: string;
  };
}

interface StagingEvent {
  id: string;
  title: string;
  description?: string;
  category: string;
  start_date: string;
  start_time?: string;
  end_time?: string;
  is_recurring: boolean;
  recurrence_type?: string;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  price_display?: string;
  ticket_url?: string;
  website_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  image_url?: string;
  venue_name: string;
  venue_address?: string;
  venue_city?: string;
  venue_state?: string;
  venue_zip?: string;
  api_source?: string;
  external_id?: string;
}

interface StagingVenue {
  id: string;
  name: string;
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
  image_urls?: string[];
  ages?: string;
  api_source?: string;
}

interface ImportManagerProps {
  onRefresh?: () => void;
}

const ImportManager = ({ onRefresh }: ImportManagerProps) => {
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);
  const [stagingEvents, setStagingEvents] = useState<StagingEvent[]>([]);
  const [stagingVenues, setStagingVenues] = useState<StagingVenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchImportBatches();
  }, []);

  const fetchImportBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('import_batches')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      const batchesWithProfiles = await Promise.all(
        (data || []).map(async (batch) => {
          const { data: profile } = await supabase
            .from('por_eve_profiles')
            .select('display_name, email')
            .eq('id', batch.created_by)
            .single();
          
          return {
            ...batch,
            por_eve_profiles: profile
          };
        })
      );
      
      setImportBatches(batchesWithProfiles);
    } catch (error) {
      console.error('Error fetching import batches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch import batches",
        variant: "destructive",
      });
    }
  };

  const fetchBatchDetails = async (batchId: string) => {
    try {
      const [eventsResponse, venuesResponse] = await Promise.all([
        supabase
          .from('staging_events')
          .select('*')
          .eq('import_batch_id', batchId),
        supabase
          .from('staging_venues')
          .select('*')
          .eq('import_batch_id', batchId)
      ]);

      if (eventsResponse.error) throw eventsResponse.error;
      if (venuesResponse.error) throw venuesResponse.error;

      setStagingEvents(eventsResponse.data || []);
      setStagingVenues(venuesResponse.data || []);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch batch details",
        variant: "destructive",
      });
    }
  };

  const handleReviewBatch = async (batchId: string, action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      if (action === 'approve') {
        const { error } = await supabase.rpc('approve_import_batch', {
          batch_id: batchId
        });
        if (error) throw error;
        
        toast({
          title: "Import Approved!",
          description: "Events and venues have been moved to the live site",
        });
      } else {
        const { error } = await supabase
          .from('import_batches')
          .update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
            notes: reviewNotes
          })
          .eq('id', batchId);

        if (error) throw error;
        
        toast({
          title: "Import Rejected",
          description: "The import has been rejected and will not go live",
        });
      }

      setReviewNotes('');
      setSelectedBatch(null);
      fetchImportBatches();
      onRefresh?.();
    } catch (error) {
      console.error('Error reviewing batch:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} import`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Pending Imports
            </div>
            <Button variant="outline" onClick={() => navigate('/admin/imports')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View All Imports
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {importBatches.length === 0 ? (
            <Alert>
              <AlertDescription>
                No pending imports. All imports have been reviewed.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {importBatches.map((batch) => (
                <div key={batch.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(batch.status)}
                      <div>
                        <p className="font-medium">{batch.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted by {batch.por_eve_profiles?.display_name || 'Unknown'} • {new Date(batch.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(batch.status)}>
                      {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {batch.total_events} events
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {batch.total_venues} venues
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {batch.file_type.toUpperCase()}
                    </div>
                  </div>

                  {batch.notes && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm"><strong>Review Notes:</strong> {batch.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBatch(batch);
                            fetchBatchDetails(batch.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Import Batch Details: {batch.filename}</DialogTitle>
                        </DialogHeader>
                        
                          <div className="space-y-6">
                            {/* Event-by-Event Review */}
                            <div>
                              <h4 className="font-medium mb-3">Import Review ({stagingEvents.length} events)</h4>
                              <div className="max-h-[60vh] overflow-y-auto border rounded-md">
                                {stagingEvents.map((event, index) => {
                                  const associatedVenue = stagingVenues.find(v => 
                                    v.name === event.venue_name && 
                                    v.city === event.venue_city
                                  );
                                  
                                  return (
                                    <Dialog key={event.id}>
                                      <DialogTrigger asChild>
                                        <div className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors">
                                          <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                              <h5 className="font-semibold text-base text-blue-600 hover:text-blue-800">
                                                {event.title}
                                              </h5>
                                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>📅 {event.start_date}</span>
                                                <span>📍 {event.venue_name}</span>
                                                <span>🏷️ {event.category}</span>
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <Badge variant="outline">Click to Review</Badge>
                                            </div>
                                          </div>
                                        </div>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle>Event #{index + 1}: {event.title}</DialogTitle>
                                        </DialogHeader>
                                        
                                        <div className="space-y-6">
                                          {/* Event Information */}
                                          <div className="bg-blue-50 p-4 rounded-lg">
                                            <h6 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                              <Calendar className="h-4 w-4" />
                                              Event Information
                                            </h6>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                              <div><span className="font-medium text-blue-700">Title:</span> <span className="break-words">{event.title}</span></div>
                                              <div><span className="font-medium text-blue-700">Category:</span> {event.category}</div>
                                              <div><span className="font-medium text-blue-700">Start Date:</span> {event.start_date}</div>
                                              {event.start_time && <div><span className="font-medium text-blue-700">Start Time:</span> {event.start_time}</div>}
                                              {event.end_time && <div><span className="font-medium text-blue-700">End Time:</span> {event.end_time}</div>}
                                              {event.price_display && <div><span className="font-medium text-blue-700">Price:</span> {event.price_display}</div>}
                                              <div><span className="font-medium text-blue-700">Recurring:</span> {event.is_recurring ? 'Yes' : 'No'}</div>
                                              {event.recurrence_type && <div><span className="font-medium text-blue-700">Recurrence Type:</span> {event.recurrence_type}</div>}
                                              {event.recurrence_pattern && <div><span className="font-medium text-blue-700">Recurrence Pattern:</span> {event.recurrence_pattern}</div>}
                                              {event.recurrence_end_date && <div><span className="font-medium text-blue-700">Recurrence End:</span> {event.recurrence_end_date}</div>}
                                              {event.api_source && <div><span className="font-medium text-blue-700">Source:</span> {event.api_source}</div>}
                                              {event.external_id && <div><span className="font-medium text-blue-700">External ID:</span> {event.external_id}</div>}
                                            </div>
                                            {event.description && (
                                              <div className="mt-3">
                                                <span className="font-medium text-blue-700">Description:</span>
                                                <p className="mt-1 text-sm text-gray-700 bg-white p-2 rounded border">{event.description}</p>
                                              </div>
                                            )}
                                          </div>

                                          {/* Venue Information */}
                                          <div className="bg-green-50 p-4 rounded-lg">
                                            <h6 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                              <Users className="h-4 w-4" />
                                              Venue Information
                                            </h6>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                              <div><span className="font-medium text-green-700">Name:</span> <span className="break-words">{event.venue_name}</span></div>
                                              {event.venue_city && <div><span className="font-medium text-green-700">City:</span> {event.venue_city}</div>}
                                              {event.venue_address && <div><span className="font-medium text-green-700">Address:</span> <span className="break-words">{event.venue_address}</span></div>}
                                              {event.venue_state && <div><span className="font-medium text-green-700">State:</span> {event.venue_state}</div>}
                                              {event.venue_zip && <div><span className="font-medium text-green-700">ZIP:</span> {event.venue_zip}</div>}
                                              {associatedVenue?.phone && <div><span className="font-medium text-green-700">Phone:</span> {associatedVenue.phone}</div>}
                                              {associatedVenue?.ages && <div><span className="font-medium text-green-700">Age Restriction:</span> {associatedVenue.ages}</div>}
                                              {associatedVenue?.api_source && <div><span className="font-medium text-green-700">Source:</span> {associatedVenue.api_source}</div>}
                                            </div>
                                          </div>

                                          {/* URLs and Social Media */}
                                          {(event.website_url || event.ticket_url || event.facebook_url || event.instagram_url || event.twitter_url || event.youtube_url || event.image_url || associatedVenue?.website || associatedVenue?.facebook_url || associatedVenue?.instagram_url || associatedVenue?.twitter_url || associatedVenue?.youtube_url) && (
                                            <div className="bg-purple-50 p-4 rounded-lg">
                                              <h6 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                                <ExternalLink className="h-4 w-4" />
                                                URLs & Social Media
                                              </h6>
                                              <div className="space-y-2">
                                                {/* Event URLs */}
                                                {(event.website_url || event.ticket_url || event.facebook_url || event.instagram_url || event.twitter_url || event.youtube_url || event.image_url) && (
                                                  <div>
                                                    <span className="font-medium text-purple-700 text-sm">Event Links:</span>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1 text-sm">
                                                      {event.website_url && <div><span className="font-medium">Website:</span> <a href={event.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{event.website_url}</a></div>}
                                                      {event.ticket_url && <div><span className="font-medium">Tickets:</span> <a href={event.ticket_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{event.ticket_url}</a></div>}
                                                      {event.facebook_url && <div><span className="font-medium">Facebook:</span> <a href={event.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{event.facebook_url}</a></div>}
                                                      {event.instagram_url && <div><span className="font-medium">Instagram:</span> <a href={event.instagram_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{event.instagram_url}</a></div>}
                                                      {event.twitter_url && <div><span className="font-medium">Twitter:</span> <a href={event.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{event.twitter_url}</a></div>}
                                                      {event.youtube_url && <div><span className="font-medium">YouTube:</span> <a href={event.youtube_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{event.youtube_url}</a></div>}
                                                      {event.image_url && <div><span className="font-medium">Image:</span> <a href={event.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{event.image_url}</a></div>}
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {/* Venue URLs */}
                                                {associatedVenue && (associatedVenue.website || associatedVenue.facebook_url || associatedVenue.instagram_url || associatedVenue.twitter_url || associatedVenue.youtube_url) && (
                                                  <div className="mt-3">
                                                    <span className="font-medium text-purple-700 text-sm">Venue Links:</span>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1 text-sm">
                                                      {associatedVenue.website && <div><span className="font-medium">Website:</span> <a href={associatedVenue.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{associatedVenue.website}</a></div>}
                                                      {associatedVenue.facebook_url && <div><span className="font-medium">Facebook:</span> <a href={associatedVenue.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{associatedVenue.facebook_url}</a></div>}
                                                      {associatedVenue.instagram_url && <div><span className="font-medium">Instagram:</span> <a href={associatedVenue.instagram_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{associatedVenue.instagram_url}</a></div>}
                                                      {associatedVenue.twitter_url && <div><span className="font-medium">Twitter:</span> <a href={associatedVenue.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{associatedVenue.twitter_url}</a></div>}
                                                      {associatedVenue.youtube_url && <div><span className="font-medium">YouTube:</span> <a href={associatedVenue.youtube_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{associatedVenue.youtube_url}</a></div>}
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {/* Venue Images */}
                                                {associatedVenue?.image_urls && associatedVenue.image_urls.length > 0 && (
                                                  <div className="mt-3">
                                                    <span className="font-medium text-purple-700 text-sm">Venue Images ({associatedVenue.image_urls.length}):</span>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                      {associatedVenue.image_urls.slice(0, 3).map((url, i) => (
                                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline bg-white px-2 py-1 rounded border">
                                                          Image {i + 1}
                                                        </a>
                                                      ))}
                                                      {associatedVenue.image_urls.length > 3 && (
                                                        <span className="text-xs text-gray-500 px-2 py-1">
                                                          +{associatedVenue.image_urls.length - 3} more
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  );
                                })}
                             </div>
                           </div>

                          {/* Review Actions */}
                          {batch.status === 'pending' && (
                            <div className="space-y-4 pt-4 border-t">
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Review Notes (optional)
                                </label>
                                <Textarea
                                  placeholder="Add any notes about this import..."
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  className="min-h-20"
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleReviewBatch(batch.id, 'approve')}
                                  disabled={loading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve Import
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReviewBatch(batch.id, 'reject')}
                                  disabled={loading}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject Import
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {batch.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleReviewBatch(batch.id, 'approve')}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Quick Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReviewBatch(batch.id, 'reject')}
                          disabled={loading}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportManager;