import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Download } from 'lucide-react';

export const BatchEventImporter: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [apiSource, setApiSource] = useState('');
  const { toast } = useToast();

  const handleBatchImport = async () => {
    if (!jsonInput.trim() || !apiSource.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both JSON data and API source",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const events = JSON.parse(jsonInput);
      
      if (!Array.isArray(events)) {
        throw new Error('JSON must be an array of events');
      }

      const { data, error } = await supabase.functions.invoke('batch-import-events', {
        body: {
          events,
          api_source: apiSource
        }
      });

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: `${data.stats.processed} events processed, ${data.stats.added} added successfully`,
        variant: "default"
      });

      // Clear form
      setJsonInput('');
      setApiSource('');

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sampleEventFormat = {
    title: "Sample Event",
    description: "Event description",
    category: "entertainment",
    venue_name: "Sample Venue",
    venue_address: "123 Main St",
    venue_city: "Portland",
    venue_state: "Oregon",
    venue_zip: "97201",
    start_date: "2024-12-31",
    start_time: "19:00",
    end_time: "22:00",
    price_display: "$25",
    ticket_url: "https://example.com/tickets",
    website_url: "https://example.com",
    image_url: "https://example.com/image.jpg",
    external_id: "unique-event-id"
  };

  const handleDownloadSample = () => {
    const sampleData = [sampleEventFormat, { ...sampleEventFormat, title: "Another Event", external_id: "unique-event-id-2" }];
    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-events.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Batch Event Importer
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Import multiple events at once using JSON format. Perfect for bulk imports from APIs or CSV conversions.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="api_source">API Source Name</Label>
          <Input
            id="api_source"
            placeholder="e.g., eventbrite, manual, custom-api"
            value={apiSource}
            onChange={(e) => setApiSource(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This helps track where events came from
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="json_input">Event Data (JSON Array)</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadSample}
              className="flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Download Sample
            </Button>
          </div>
          <Textarea
            id="json_input"
            placeholder="Paste your JSON array of events here..."
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Each event should have at least: title, venue_name, start_date, category
          </p>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Required Fields:</h4>
          <div className="text-sm text-muted-foreground grid grid-cols-2 gap-1">
            <span>• title</span>
            <span>• venue_name</span>
            <span>• start_date (YYYY-MM-DD)</span>
            <span>• category</span>
          </div>
          <h4 className="font-medium mb-2 mt-3">Optional Fields:</h4>
          <div className="text-sm text-muted-foreground grid grid-cols-2 gap-1">
            <span>• description</span>
            <span>• venue_address</span>
            <span>• start_time (HH:MM)</span>
            <span>• end_time (HH:MM)</span>
            <span>• price_display</span>
            <span>• ticket_url</span>
            <span>• website_url</span>
            <span>• image_url</span>
            <span>• external_id</span>
            <span>• facebook_url</span>
          </div>
        </div>

        <Button 
          onClick={handleBatchImport} 
          disabled={loading || !jsonInput.trim() || !apiSource.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing Events...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import Events
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};