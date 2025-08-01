import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Upload, FileUp, CheckCircle } from 'lucide-react';
import { getNextUpcomingDateForPattern } from '@/hooks/events/eventTransformers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadImageFromUrl } from '@/utils/imageUpload';

interface SpreadsheetEventImporterProps {
  onEventsImported?: (events: any[]) => void;
  onImportSubmitted?: () => void;
}

const SpreadsheetEventImporter = ({ onEventsImported, onImportSubmitted }: SpreadsheetEventImporterProps) => {
  const [spreadsheetData, setSpreadsheetData] = useState('');
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
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
      '"Live Music Night"',
      '"Weekly live music featuring local artists, acoustic performances, and open mic"',
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
      
      '"The Music Venue"',
      '"123 Main St, Suite 100"',
      '"Portland"',
      '"Oregon"',
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

    const escapeCSVField = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const csvContent = [
      templateHeaders.map(escapeCSVField).join(','),
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

  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    console.log('🔍 PARSING LINE:', JSON.stringify(line));
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    fields.push(currentField.trim());
    
    const cleanedFields = fields.map((field, index) => {
      let cleaned = field;
      
      if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length >= 2) {
        cleaned = cleaned.slice(1, -1);
      }
      
      if (cleaned.toLowerCase().includes('portland') || field.toLowerCase().includes('portland')) {
        console.log(`🚨 PORTLAND FIELD ${index}:`);
        console.log(`  Raw: "${field}"`);
        console.log(`  Cleaned: "${cleaned}"`);
        console.log(`  Length: ${cleaned.length}`);
      }
      
      return cleaned;
    });
    
    console.log('📋 PARSED FIELDS:', cleanedFields.map((f, i) => `${i}:"${f}"`));
    return cleanedFields;
  };

  const parseSpreadsheetData = (data: string) => {
    const lines = data.trim().split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 1) {
      throw new Error('No data found');
    }
    
    const minimumRequiredLines = hasHeaderRow ? 2 : 1;
    if (lines.length < minimumRequiredLines) {
      throw new Error(`Data must have ${hasHeaderRow ? 'at least a header row and one data row' : 'at least one data row'}`);
    }

    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delimiter = tabCount > commaCount ? '\t' : ',';

    console.log('Detected delimiter:', delimiter === '\t' ? 'TAB' : 'COMMA');
    console.log('First line:', firstLine);
    console.log('Has header row:', hasHeaderRow);

    let headers: string[] = [];
    let startIndex = 0;

    if (hasHeaderRow) {
      headers = parseCSVLine(lines[0], delimiter);
      startIndex = 1;
    } else {
      headers = [
        'Event Title', 'Event Description', 'Event Category', 'Event Start Date (YYYY-MM-DD)',
        'Event Start Time (HH:MM)', 'Event End Time (HH:MM)', 'Event Is Recurring (TRUE/FALSE)',
        'Event Recurrence Type (weekly/monthly)', 'Event Recurrence Pattern (every/1st/2nd/3rd/4th/last)',
        'Event Recurrence End Date (YYYY-MM-DD)', 'Event Price Display', 'Event Ticket URL',
        'Event Website URL', 'Event Facebook URL', 'Event Instagram URL', 'Event Twitter URL',
        'Event YouTube URL', 'Event Image URL', 'Venue Name', 'Venue Address', 'Venue City',
        'Venue State', 'Venue Zip', 'Venue Phone', 'Venue Website', 'Venue Facebook URL',
        'Venue Instagram URL', 'Venue Twitter URL', 'Venue YouTube URL', 'Venue Image URL',
        'Venue Ages (21+/18+/All Ages)'
      ];
      startIndex = 0;
    }
    
    console.log('Parsed headers:', headers);
    console.log('Header count:', headers.length);

    const events = [];

    for (let i = startIndex; i < lines.length; i++) {
      console.log(`Row ${i + 1} raw line:`, lines[i]);
      
      const cleanedValues = parseCSVLine(lines[i], delimiter);
      
      const venueCityIndex = headers.findIndex(h => h === 'Venue City');
      const venueAgesIndex = headers.findIndex(h => h === 'Venue Ages (21+/18+/All Ages)');
      
      if (venueCityIndex !== -1) {
        console.log(`🏙️ VENUE_CITY (index ${venueCityIndex}): "${cleanedValues[venueCityIndex]}"`);
      }
      if (venueAgesIndex !== -1) {
        console.log(`🎂 VENUE_AGES (index ${venueAgesIndex}): "${cleanedValues[venueAgesIndex]}"`);
      }
      
      if (cleanedValues.length !== headers.length) {
        console.warn(`Row ${i + 1} has ${cleanedValues.length} columns but expected ${headers.length}`);
        console.warn(`Missing fields will be defaulted. Headers:`, headers);
        console.warn(`Values received:`, cleanedValues);
        
        while (cleanedValues.length < headers.length) {
          cleanedValues.push('');
          console.log(`Padded column ${cleanedValues.length - 1} with empty string`);
        }
        
        if (cleanedValues.length > headers.length) {
          const extraValues = cleanedValues.splice(headers.length);
          console.warn(`Truncated extra values:`, extraValues);
        }
      }

      const eventData: any = {};
      headers.forEach((header, index) => {
        const value = cleanedValues[index] || '';
        eventData[header] = value === '' ? null : value;
        
        if (header === 'Venue Ages (21+/18+/All Ages)') {
          console.log(`VENUE_AGES DEBUG - Header: "${header}", Index: ${index}, Raw Value: "${cleanedValues[index]}", Final Value: "${eventData[header]}"`);
        }
      });

      console.log('Parsed event data:', eventData);
      
      const venueAgesValue = eventData['Venue Ages (21+/18+/All Ages)'];
      console.log(`FINAL VENUE_AGES CHECK: "${venueAgesValue}" (type: ${typeof venueAgesValue})`);
      
      events.push(eventData);
    }

    return events;
  };

  const transformEventForStaging = async (eventData: any) => {
    const isRecurring = eventData['Event Is Recurring (TRUE/FALSE)']?.toLowerCase() === 'true';
    const recurrenceType = eventData['Event Recurrence Type (weekly/monthly)'];
    const recurrencePattern = eventData['Event Recurrence Pattern (every/1st/2nd/3rd/4th/last)'];
    const providedStartDate = eventData['Event Start Date (YYYY-MM-DD)'];
    
    let startDate = providedStartDate;
    
    const dayOfWeekPattern = /^(sun|mon|tue|wed|thu|fri|sat)$/i;
    
    if (isRecurring && recurrenceType && recurrencePattern) {
      if (!startDate || dayOfWeekPattern.test(startDate)) {
        const dayOfWeek = dayOfWeekPattern.test(startDate || '') ? startDate : undefined;
        startDate = getNextUpcomingDateForPattern(recurrenceType, recurrencePattern, dayOfWeek);
      }
    } else if (!startDate) {
      startDate = new Date().toISOString().split('T')[0];
    }
    
    let uploadedEventImageUrl = null;
    const eventImageUrl = eventData['Event Image URL'];
    if (eventImageUrl && eventImageUrl.trim() !== '') {
      console.log('Uploading event image:', eventImageUrl);
      uploadedEventImageUrl = await uploadImageFromUrl(eventImageUrl, 'event-images', 'events');
      if (uploadedEventImageUrl) {
        console.log('Event image uploaded successfully:', uploadedEventImageUrl);
      } else {
        console.warn('Failed to upload event image:', eventImageUrl);
      }
    }
    
    const venueName = eventData['Venue Name'];
    const venueCity = eventData['Venue City'];
    const venueState = eventData['Venue State'];
    const venueZip = eventData['Venue Zip'];
    
    console.log('DEBUG Event transformation - venue fields:', {
      'venueName': venueName,
      'venueCity': venueCity,
      'venueState': venueState,
      'venueZip': venueZip,
      'venueName_type': typeof venueName,
      'venueCity_type': typeof venueCity,
      'venueState_type': typeof venueState,
      'venueZip_type': typeof venueZip,
      'allEventDataKeys': Object.keys(eventData),
      'allEventDataValues': Object.values(eventData)
    });
    
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
      image_url: uploadedEventImageUrl || null,
      venue_name: venueName || 'TBA',
      venue_address: eventData['Venue Address'] || null,
      venue_city: venueCity && typeof venueCity === 'string' && venueCity.trim() !== '' ? venueCity.trim() : 'Portland',
      venue_state: venueState && typeof venueState === 'string' && venueState.trim() !== '' ? venueState.trim() : 'Oregon',
      venue_zip: venueZip && typeof venueZip === 'string' && venueZip.trim() !== '' ? venueZip.trim() : null,
      venue_phone: eventData['Venue Phone'] || null,
      venue_website: eventData['Venue Website'] || null,
      venue_facebook_url: eventData['Venue Facebook URL'] || null,
      venue_instagram_url: eventData['Venue Instagram URL'] || null,
      venue_twitter_url: eventData['Venue Twitter URL'] || null,
      venue_youtube_url: eventData['Venue YouTube URL'] || null,
      venue_image_url: eventData['Venue Image URL'] || null,
      venue_ages: eventData['Venue Ages (21+/18+/All Ages)'] || '21+',
      api_source: 'import',
      external_id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  };

  const transformVenueForStaging = async (eventData: any) => {
    const venueName = eventData['Venue Name'];
    const venueCity = eventData['Venue City'];
    const venueAges = eventData['Venue Ages (21+/18+/All Ages)'];
    
    console.log('DEBUG Venue transformation:', {
      'venueName': venueName,
      'venueCity': venueCity,
      'venueAges': venueAges,
      'venueName_type': typeof venueName,
      'venueCity_type': typeof venueCity,
      'venueAges_type': typeof venueAges,
      'allEventDataKeys': Object.keys(eventData),
      'allEventDataValues': Object.values(eventData)
    });
    
    if (!venueName || venueName === 'TBA' || (typeof venueName === 'string' && venueName.trim() === '')) {
      console.log('Skipping venue - no valid name');
      return null;
    }

    let uploadedVenueImages = null;
    const venueImageUrl = eventData['Venue Image URL'];
    if (venueImageUrl && venueImageUrl.trim() !== '') {
      console.log('Uploading venue image:', venueImageUrl);
      const uploadedVenueImageUrl = await uploadImageFromUrl(venueImageUrl, 'venue-images', 'venues');
      if (uploadedVenueImageUrl) {
        uploadedVenueImages = [uploadedVenueImageUrl];
        console.log('Venue image uploaded successfully:', uploadedVenueImageUrl);
      } else {
        console.warn('Failed to upload venue image:', venueImageUrl);
      }
    }

    let processedVenueCity = 'Portland';
    if (venueCity && typeof venueCity === 'string' && venueCity.trim() !== '') {
      processedVenueCity = venueCity.trim();
    } else if (venueCity) {
      processedVenueCity = String(venueCity).trim() || 'Portland';
    }

    let processedVenueAges = '21+';
    if (venueAges && typeof venueAges === 'string' && venueAges.trim() !== '') {
      processedVenueAges = venueAges.trim();
    } else if (venueAges) {
      processedVenueAges = String(venueAges).trim() || '21+';
    }

    const venueData = {
      name: typeof venueName === 'string' ? venueName.trim() : String(venueName).trim(),
      address: eventData['Venue Address'] && typeof eventData['Venue Address'] === 'string' ? eventData['Venue Address'].trim() || null : null,
      city: processedVenueCity,
      state: eventData['Venue State'] && typeof eventData['Venue State'] === 'string' ? eventData['Venue State'].trim() || 'Oregon' : 'Oregon',
      zip_code: eventData['Venue Zip'] && typeof eventData['Venue Zip'] === 'string' ? eventData['Venue Zip'].trim() || null : null,
      phone: eventData['Venue Phone'] && typeof eventData['Venue Phone'] === 'string' ? eventData['Venue Phone'].trim() || null : null,
      website: eventData['Venue Website'] && typeof eventData['Venue Website'] === 'string' ? eventData['Venue Website'].trim() || null : null,
      facebook_url: eventData['Venue Facebook URL'] && typeof eventData['Venue Facebook URL'] === 'string' ? eventData['Venue Facebook URL'].trim() || null : null,
      instagram_url: eventData['Venue Instagram URL'] && typeof eventData['Venue Instagram URL'] === 'string' ? eventData['Venue Instagram URL'].trim() || null : null,
      twitter_url: eventData['Venue Twitter URL'] && typeof eventData['Venue Twitter URL'] === 'string' ? eventData['Venue Twitter URL'].trim() || null : null,
      youtube_url: eventData['Venue YouTube URL'] && typeof eventData['Venue YouTube URL'] === 'string' ? eventData['Venue YouTube URL'].trim() || null : null,
      image_urls: uploadedVenueImages,
      ages: processedVenueAges,
      api_source: 'import'
    };
    
    console.log('DEBUG Transformed venue data:', venueData);
    return venueData;
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
      console.log('Starting import process with data:', spreadsheetData.substring(0, 200) + '...');
      const parsedEvents = parseSpreadsheetData(spreadsheetData);
      console.log('Parsed events:', parsedEvents);
      
      const firstLine = spreadsheetData.trim().split('\n')[0];
      const tabCount = (firstLine.match(/\t/g) || []).length;
      const commaCount = (firstLine.match(/,/g) || []).length;
      const fileType = tabCount > commaCount ? 'tsv' : 'csv';
      
      const actualEventsCount = parsedEvents.length;
      
      const { data: batchData, error: batchError } = await supabase
        .from('import_batches')
        .insert({
          filename: `manual_import_${Date.now()}.${fileType}`,
          file_type: fileType,
          total_events: actualEventsCount,
          total_venues: 0,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (batchError) throw batchError;

      const batchId = batchData.id;
      let eventsCreated = 0;
      let venuesCreated = 0;
      const venueMap = new Map();

      for (const eventData of parsedEvents) {
        const venueData = await transformVenueForStaging(eventData);
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

      for (const eventData of parsedEvents) {
        const transformedEvent = await transformEventForStaging(eventData);
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
        description: `${eventsCreated} events and ${venuesCreated} venues with images are now pending admin approval`,
      });

      setSpreadsheetData('');
      onImportSubmitted?.();
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
              {importResult.eventsCount} events and {importResult.venuesCount} venues with images are now pending admin approval.
              <br />
              <span className="text-sm">Batch ID: {importResult.batchId}</span>
            </AlertDescription>
          </Alert>
        )}

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

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={hasHeaderRow}
              onChange={(e) => setHasHeaderRow(e.target.checked)}
              className="rounded border-gray-300"
            />
            Data includes header row
          </label>
          <p className="text-xs text-gray-500">
            Uncheck if your data starts with actual event data (no column headers)
          </p>
        </div>

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
            <li>Include image URLs in the Event Image URL and Venue Image URL columns</li>
            <li>Upload the file or copy/paste the data</li>
            <li>Click Import to stage your data for review (images will be automatically uploaded)</li>
            <li>Admin will review and approve the import</li>
            <li>Approved events will go live on the site</li>
          </ol>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg">
          <h4 className="font-medium text-amber-900 mb-2">Important Notes:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
            <li><strong>All imports require admin approval</strong> - nothing goes live immediately</li>
            <li><strong>Images are automatically uploaded</strong> - provide URLs and they'll be downloaded and stored</li>
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
          {loading ? "Staging Import with Images..." : "Stage Import for Review"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetEventImporter;
