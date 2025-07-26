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
  venue_name: string;
  venue_city: string;
  is_recurring: boolean;
}

interface StagingVenue {
  id: string;
  name: string;
  address?: string;
  city: string;
  state: string;
  zip_code?: string;
  phone?: string;
  website?: string;
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
                          {/* Events Preview */}
                          <div>
                            <h4 className="font-medium mb-3">Events ({stagingEvents.length})</h4>
                            <div className="max-h-60 overflow-y-auto border rounded-md">
                              {stagingEvents.map((event) => (
                                <div key={event.id} className="p-3 border-b last:border-b-0">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">{event.title}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {event.venue_name} • {event.start_date} 
                                        {event.start_time && ` at ${event.start_time}`}
                                      </p>
                                      <Badge variant="outline" className="mt-1">
                                        {event.category}
                                      </Badge>
                                    </div>
                                    {event.is_recurring && (
                                      <Badge variant="secondary">Recurring</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Venues Preview */}
                          {stagingVenues.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3">Venues ({stagingVenues.length})</h4>
                              <div className="max-h-40 overflow-y-auto border rounded-md">
                                {stagingVenues.map((venue) => (
                                  <div key={venue.id} className="p-3 border-b last:border-b-0">
                                    <p className="font-medium">{venue.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {venue.address && `${venue.address}, `}
                                      {venue.city}, {venue.state} {venue.zip_code}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

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