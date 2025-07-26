import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Upload } from 'lucide-react';
import { getNextUpcomingDateForPattern } from '@/hooks/events/eventTransformers';

const SpreadsheetEventImporter = () => {
  const [spreadsheetData, setSpreadsheetData] = useState('');
  const [loading, setLoading] = useState(false);
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

  const transformEventData = (eventData: any) => {
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
      status: 'approved',
      api_source: 'spreadsheet_import',
      external_id: `spreadsheet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  };

  const transformVenueData = (eventData: any) => {
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
      status: 'approved',
      api_source: 'spreadsheet_import'
    };
  };

  const handleImport = async () => {
    if (!spreadsheetData.trim()) {
      toast({
        title: "Error",
        description: "Please paste spreadsheet data",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const parsedEvents = parseSpreadsheetData(spreadsheetData);
      let eventsCreated = 0;
      let venuesCreated = 0;
      const venueMap = new Map(); // Track unique venues

      for (const eventData of parsedEvents) {
        // Create venue if it doesn't exist
        const venueData = transformVenueData(eventData);
        if (venueData && !venueMap.has(venueData.name)) {
          const { error: venueError } = await supabase
            .from('venues')
            .upsert(venueData, { onConflict: 'name' });
          
          if (!venueError) {
            venueMap.set(venueData.name, true);
            venuesCreated++;
          }
        }

        // Create event
        const transformedEvent = transformEventData(eventData);
        const { error: eventError } = await supabase
          .from('user_events')
          .insert(transformedEvent);

        if (!eventError) {
          eventsCreated++;
        }
      }

      toast({
        title: "Success!",
        description: `Imported ${eventsCreated} events and ${venuesCreated} venues`,
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
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Spreadsheet Data (CSV or Tab-separated)</label>
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
          <Textarea
            placeholder="Paste your spreadsheet data here (copy from Excel/Google Sheets and paste)..."
            value={spreadsheetData}
            onChange={(e) => setSpreadsheetData(e.target.value)}
            className="min-h-40 font-mono text-sm"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Download the template to set up your spreadsheet correctly</li>
            <li>Fill in your event and venue data in the spreadsheet</li>
            <li>Copy all data (including headers) from your spreadsheet</li>
            <li>Paste it in the text area above</li>
            <li>Click Import to add events and venues to the database</li>
          </ol>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg">
          <h4 className="font-medium text-amber-900 mb-2">Important Notes:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
            <li>All imported events will be auto-approved</li>
            <li>Venues with the same name will be merged</li>
            <li>Use TRUE/FALSE for recurring events</li>
            <li>Dates must be in YYYY-MM-DD format</li>
            <li>Times must be in HH:MM format (24-hour)</li>
          </ul>
        </div>

        <Button 
          onClick={handleImport} 
          disabled={loading || !spreadsheetData.trim()}
          className="w-full"
        >
          {loading ? "Importing..." : "Import Events & Venues"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetEventImporter;