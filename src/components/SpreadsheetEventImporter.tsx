import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Upload, FileUp, CheckCircle } from 'lucide-react';
import { getNextUpcomingDateForPattern } from '@/hooks/events/eventTransformers';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SpreadsheetEventImporter = () => {
  const [spreadsheetData, setSpreadsheetData] = useState('');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    batchId: string;
    eventsCount: number;
    venuesCount: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const templateHeaders = [
      // Event Details
      'Event Title',
      'Event Description', 
      'Event Category',
      'Event Start Date (YYYY-MM-DD)',
      'Event Start Time (HH:MM)',
      'Event End Time (HH:MM)',
      'Event Is Recurring (TRUE/FALSE)',
      'Event Recurrence Type (weekly/monthly)',
      'Event Recurrence Pattern (every/1st/2nd/3rd/4th/last)',
      'Event Recurrence End Date (YYYY-MM-DD)',
      'Event Price Display',
      'Event Ticket URL',
      'Event Website URL',
      'Event Facebook URL',
      'Event Instagram URL',
      'Event Twitter URL',
      'Event YouTube URL',
      'Event Image URL',
      
      // Venue Details
      'Venue Name',
      'Venue Address',
      'Venue City',
      'Venue State',
      'Venue Zip',
      'Venue Phone',
      'Venue Website',
      'Venue Facebook URL',
      'Venue Instagram URL',
      'Venue Twitter URL',
      'Venue YouTube URL',
      'Venue Image URL',
      'Venue Ages (21+/18+/All Ages)'
    ];

    const sampleData = [
      'Live Music Night',
      'Weekly live music featuring local artists',
      'Music',
      '2024-02-01',
      '19:00',
      '23:00',
      'TRUE',
      'weekly',
      'every',
      '2024-12-31',
      'Free',
      '',
      'https://example.com/event',
      'https://facebook.com/event',
      'https://instagram.com/event',
      '',
      '',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
      
      'The Music Venue',
      '123 Main St',
      'Portland',
      'Oregon',
      '97201',
      '(503) 555-0123',
      'https://themusicvenue.com',
      'https://facebook.com/themusicvenue',
      'https://instagram.com/themusicvenue',
      '',
      '',
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
      '21+'
    ];

    const csvContent = [
      templateHeaders.join(','),
      sampleData.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSpreadsheetData(content);
    };
    reader.readAsText(file);
  };

  const parseSpreadsheetData = (data: string) => {
    const lines = data.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Data must have at least a header row and one data row');
    }

    // Detect delimiter by checking the first line
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delimiter = tabCount > commaCount ? '\t' : ',';

    const headers = lines[0].split(delimiter).map(h => h.trim());
    const events = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim());
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}`);
      }

      const eventData: any = {};
      headers.forEach((header, index) => {
        eventData[header] = values[index] || null;
      });

      events.push(eventData);
    }

    return events;
  };

  const transformEventForStaging = (eventData: any) => {
    const isRecurring = eventData['Event Is Recurring (TRUE/FALSE)']?.toLowerCase() === 'true';
    const recurrenceType = eventData['Event Recurrence Type (weekly/monthly)'];
    const recurrencePattern = eventData['Event Recurrence Pattern (every/1st/2nd/3rd/4th/last)'];
    const providedStartDate = eventData['Event Start Date (YYYY-MM-DD)'];
    
    // Calculate start date: use provided date, or for recurring events with empty date, calculate next upcoming date
    let startDate = providedStartDate;
    
    // Check if providedStartDate is a day of week (sun,mon,tue,wed,thu,fri,sat)
    const dayOfWeekPattern = /^(sun|mon|tue|wed|thu|fri|sat)$/i;
    
    if (isRecurring && recurrenceType && recurrencePattern) {
      if (!startDate || dayOfWeekPattern.test(startDate)) {
        // Either no date provided or a day of week provided
        const dayOfWeek = dayOfWeekPattern.test(startDate || '') ? startDate : undefined;
        startDate = getNextUpcomingDateForPattern(recurrenceType, recurrencePattern, dayOfWeek);
      }
    } else if (!startDate) {
      startDate = new Date().toISOString().split('T')[0];
    }
    
    return {
      title: eventData['Event Title'] || 'Untitled Event',
      description: eventData['Event Description'] || null,
      category: eventData['Event Category'] || 'other',
      start_date: startDate,
      start_time: eventData['Event Start Time (HH:MM)'] || null,
      end_time: eventData['Event End Time (HH:MM)'] || null,
      is_recurring: isRecurring,
      recurrence_type: recurrenceType || null,
      recurrence_pattern: recurrencePattern || null,
      recurrence_end_date: eventData['Event Recurrence End Date (YYYY-MM-DD)'] || null,
      price_display: eventData['Event Price Display'] || null,
      ticket_url: eventData['Event Ticket URL'] || null,
      website_url: eventData['Event Website URL'] || null,
      facebook_url: eventData['Event Facebook URL'] || null,
      instagram_url: eventData['Event Instagram URL'] || null,
      twitter_url: eventData['Event Twitter URL'] || null,
      youtube_url: eventData['Event YouTube URL'] || null,
      image_url: eventData['Event Image URL'] || null,
      venue_name: eventData['Venue Name'] || 'TBA',
      venue_address: eventData['Venue Address'] || null,
      venue_city: eventData['Venue City'] || 'Portland',
      venue_state: eventData['Venue State'] || 'Oregon',
      venue_zip: eventData['Venue Zip'] || null,
      api_source: 'import',
      external_id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  };

  const transformVenueForStaging = (eventData: any) => {
    const venueName = eventData['Venue Name'];
    if (!venueName || venueName === 'TBA') return null;

    return {
      name: venueName,
      address: eventData['Venue Address'] || null,
      city: eventData['Venue City'] || 'Portland',
      state: eventData['Venue State'] || 'Oregon',
      zip_code: eventData['Venue Zip'] || null,
      phone: eventData['Venue Phone'] || null,
      website: eventData['Venue Website'] || null,
      facebook_url: eventData['Venue Facebook URL'] || null,
      instagram_url: eventData['Venue Instagram URL'] || null,
      twitter_url: eventData['Venue Twitter URL'] || null,
      youtube_url: eventData['Venue YouTube URL'] || null,
      image_urls: eventData['Venue Image URL'] ? [eventData['Venue Image URL']] : null,
      ages: eventData['Venue Ages (21+/18+/All Ages)'] || '21+',
      api_source: 'import'
    };
  };

  const handleImport = async () => {
    if (!spreadsheetData.trim()) {
      toast({
        title: "Error",
        description: "Please paste spreadsheet data or upload a file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const parsedEvents = parseSpreadsheetData(spreadsheetData);
      
      // Determine file type
      const firstLine = spreadsheetData.trim().split('\n')[0];
      const tabCount = (firstLine.match(/\t/g) || []).length;
      const commaCount = (firstLine.match(/,/g) || []).length;
      const fileType = tabCount > commaCount ? 'tsv' : 'csv';
      
      // Create import batch
      const { data: batchData, error: batchError } = await supabase
        .from('import_batches')
        .insert({
          filename: `manual_import_${Date.now()}.${fileType}`,
          file_type: fileType,
          total_events: parsedEvents.length,
          total_venues: 0, // Will be calculated
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (batchError) throw batchError;

      const batchId = batchData.id;
      let eventsCreated = 0;
      let venuesCreated = 0;
      const venueMap = new Map(); // Track unique venues

      // Process venues first
      for (const eventData of parsedEvents) {
        const venueData = transformVenueForStaging(eventData);
        if (venueData) {
          const venueKey = `${venueData.name}_${venueData.city}_${venueData.state}_${venueData.zip_code}`;
          if (!venueMap.has(venueKey)) {
            const { error: venueError } = await supabase
              .from('staging_venues')
              .insert({
                ...venueData,
                import_batch_id: batchId
              });
            
            if (!venueError) {
              venueMap.set(venueKey, true);
              venuesCreated++;
            }
          }
        }
      }

      // Process events
      for (const eventData of parsedEvents) {
        const transformedEvent = transformEventForStaging(eventData);
        const { error: eventError } = await supabase
          .from('staging_events')
          .insert({
            ...transformedEvent,
            import_batch_id: batchId
          });

        if (!eventError) {
          eventsCreated++;
        }
      }

      // Update batch with final counts
      await supabase
        .from('import_batches')
        .update({
          total_events: eventsCreated,
          total_venues: venuesCreated
        })
        .eq('id', batchId);

      setImportResult({
        batchId,
        eventsCount: eventsCreated,
        venuesCount: venuesCreated
      });

      toast({
        title: "Import Staged Successfully!",
        description: `${eventsCreated} events and ${venuesCreated} venues are now pending admin approval`,
      });

      setSpreadsheetData('');
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Spreadsheet Events Importer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {importResult && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Import Staged Successfully!</strong>
              <br />
              {importResult.eventsCount} events and {importResult.venuesCount} venues are now pending admin approval.
              <br />
              <span className="text-sm">Batch ID: {importResult.batchId}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* File Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Upload CSV/TSV File</label>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">
              Upload your CSV or TSV file here
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mb-2"
            >
              Choose File
            </Button>
            <p className="text-xs text-gray-500">
              Supported formats: .csv, .tsv, .txt
            </p>
          </div>
        </div>

        {/* Manual Input Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Or Paste Spreadsheet Data</label>
          </div>
          <Textarea
            placeholder="Copy from Excel/Google Sheets and paste here..."
            value={spreadsheetData}
            onChange={(e) => setSpreadsheetData(e.target.value)}
            className="min-h-32 font-mono text-sm"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Download the template and fill it with your data</li>
            <li>Upload the file or copy/paste the data</li>
            <li>Click Import to stage your data for review</li>
            <li>Admin will review and approve the import</li>
            <li>Approved events will go live on the site</li>
          </ol>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg">
          <h4 className="font-medium text-amber-900 mb-2">Important Notes:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
            <li><strong>All imports require admin approval</strong> - nothing goes live immediately</li>
            <li>Venues with same name, city, state, and zip will be merged</li>
            <li>Use TRUE/FALSE for recurring events</li>
            <li>Dates must be in YYYY-MM-DD format</li>
            <li>Times must be in HH:MM format (24-hour)</li>
            <li>For recurring events without a start date, use day abbreviations (sun, mon, tue, etc.)</li>
          </ul>
        </div>

        <Button 
          onClick={handleImport} 
          disabled={loading || !spreadsheetData.trim()}
          className="w-full"
        >
          {loading ? "Staging Import..." : "Stage Import for Review"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetEventImporter;