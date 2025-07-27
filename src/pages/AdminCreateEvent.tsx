import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import { Calendar, Copy, Wand2 } from 'lucide-react';
import { getRecurrenceTypeFromPattern } from '@/utils/recurrenceUtils';

interface AdminEventFormData {
  title: string;
  description: string;
  category: string;
  start_date: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_type: string;
  recurrence_pattern: string;
  recurrence_end_date: string;
  price_display: string;
  ticket_url: string;
  website_url: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  youtube_url: string;
  image_url: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_zip: string;
  venue_phone: string;
  venue_website: string;
  venue_facebook_url: string;
  venue_instagram_url: string;
  venue_twitter_url: string;
  venue_youtube_url: string;
  venue_image_url: string;
  venue_ages: string;
}

const TEMPLATE_FIELDS = [
  'title', 'description', 'category', 'start_date', 'start_time', 'end_time',
  'is_recurring', 'recurrence_type', 'recurrence_pattern', 'recurrence_end_date',
  'price_display', 'ticket_url', 'website_url', 'facebook_url', 'instagram_url',
  'twitter_url', 'youtube_url', 'image_url', 'venue_name', 'venue_address',
  'venue_city', 'venue_state', 'venue_zip', 'venue_phone', 'venue_website',
  'venue_facebook_url', 'venue_instagram_url', 'venue_twitter_url', 'venue_youtube_url',
  'venue_image_url', 'venue_ages'
];

const AdminCreateEvent = () => {
  const [autoImportData, setAutoImportData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AdminEventFormData>({
    defaultValues: {
      venue_city: 'Portland',
      venue_state: 'Oregon',
      venue_ages: '21+',
      is_recurring: false
    }
  });

  const parseRowData = (rowData: string) => {
    // Split by tabs first (Excel/Google Sheets format), then by commas as fallback
    const values = rowData.includes('\t') ? rowData.split('\t') : rowData.split(',');
    
    if (values.length !== TEMPLATE_FIELDS.length) {
      toast({
        title: "Format Error",
        description: `Expected ${TEMPLATE_FIELDS.length} fields, but got ${values.length}. Please ensure your data matches the template format.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Map values to form fields
    TEMPLATE_FIELDS.forEach((field, index) => {
      const value = values[index]?.trim() || '';
      
      // Handle boolean fields
      if (field === 'is_recurring') {
        setValue(field as keyof AdminEventFormData, value.toLowerCase() === 'true');
      } else if (field === 'recurrence_pattern') {
        // Auto-detect recurrence type from pattern
        const autoType = getRecurrenceTypeFromPattern(value);
        setValue('recurrence_pattern', value);
        if (autoType) {
          setValue('recurrence_type', autoType);
        }
      } else {
        setValue(field as keyof AdminEventFormData, value);
      }
    });

    setIsProcessing(false);
    toast({
      title: "Data Imported",
      description: "Event data has been populated from the imported row.",
    });
  };

  const handleAutoImport = () => {
    if (!autoImportData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste event data to import.",
        variant: "destructive",
      });
      return;
    }

    parseRowData(autoImportData);
  };

  const downloadTemplate = () => {
    const headers = [
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

    const csvContent = headers.join('\t') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const onSubmit = async (data: AdminEventFormData) => {
    try {
      setIsProcessing(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create events.",
          variant: "destructive",
        });
        return;
      }

      // Create or update venue if venue data is provided
      if (data.venue_name) {
        const venueData = {
          name: data.venue_name,
          address: data.venue_address || null,
          city: data.venue_city || 'Portland',
          state: data.venue_state || 'Oregon',
          zip_code: data.venue_zip || null,
          phone: data.venue_phone || null,
          website: data.venue_website || null,
          facebook_url: data.venue_facebook_url || null,
          instagram_url: data.venue_instagram_url || null,
          twitter_url: data.venue_twitter_url || null,
          youtube_url: data.venue_youtube_url || null,
          image_urls: data.venue_image_url ? [data.venue_image_url] : null,
          ages: data.venue_ages || '21+',
          status: 'approved' // Admin created venues are auto-approved
        };

        const { error: venueError } = await supabase
          .from('venues')
          .upsert(venueData, { 
            onConflict: 'name,city,state,zip_code',
            ignoreDuplicates: false 
          });

        if (venueError) {
          console.error('Error creating venue:', venueError);
          toast({
            title: "Venue Error",
            description: "Failed to create venue. Event will be created without venue association.",
            variant: "destructive",
          });
        }
      }

      // Create event
      const eventData = {
        title: data.title,
        description: data.description || null,
        category: data.category,
        start_date: data.start_date,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        is_recurring: data.is_recurring || false,
        recurrence_type: data.is_recurring ? data.recurrence_type : null,
        recurrence_pattern: data.is_recurring ? data.recurrence_pattern : null,
        recurrence_end_date: data.is_recurring ? data.recurrence_end_date : null,
        price_display: data.price_display || null,
        ticket_url: data.ticket_url || null,
        website_url: data.website_url || null,
        facebook_url: data.facebook_url || null,
        instagram_url: data.instagram_url || null,
        twitter_url: data.twitter_url || null,
        youtube_url: data.youtube_url || null,
        image_url: data.image_url || null,
        venue_name: data.venue_name,
        venue_address: data.venue_address || null,
        venue_city: data.venue_city || 'Portland',
        venue_state: data.venue_state || 'Oregon',
        venue_zip: data.venue_zip || null,
        status: 'approved', // Admin created events are auto-approved
        created_by: user.id
      };

      const { error: eventError } = await supabase
        .from('user_events')
        .insert([eventData]);

      if (eventError) {
        console.error('Error creating event:', eventError);
        toast({
          title: "Error",
          description: "Failed to create event. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Event has been created and approved.",
      });
      
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Create Event (Admin)
            </h1>
            <p className="text-gray-600 mt-2">
              Create events directly with auto-import functionality
            </p>
          </div>

          {/* Auto Import Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Auto Import from Template Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Download Template
                </Button>
                <Badge variant="secondary">
                  {TEMPLATE_FIELDS.length} fields expected
                </Badge>
              </div>
              
              <div>
                <Label htmlFor="import-data">Paste Row Data (Tab or Comma Separated)</Label>
                <Textarea
                  id="import-data"
                  value={autoImportData}
                  onChange={(e) => setAutoImportData(e.target.value)}
                  placeholder="Paste a complete row of event data here (from Excel, Google Sheets, etc.)"
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
              
              <Button
                type="button"
                onClick={handleAutoImport}
                disabled={!autoImportData.trim() || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Import Data'}
              </Button>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          {/* Manual Event Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Event Information */}
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="title">Event Title *</Label>
                    <Input {...register('title', { required: 'Title is required' })} />
                    {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea {...register('description')} rows={3} />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Input {...register('category', { required: 'Category is required' })} />
                    {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input {...register('image_url')} placeholder="https://example.com/image.jpg" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input 
                      {...register('start_date', { required: 'Start date is required' })} 
                      type="date" 
                    />
                    {errors.start_date && <p className="text-red-500 text-sm">{errors.start_date.message}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input {...register('start_time')} type="time" />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input {...register('end_time')} type="time" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="is_recurring">Recurring Event</Label>
                    <Select 
                      onValueChange={(value) => setValue('is_recurring', value === 'true')}
                      value={watch('is_recurring') ? 'true' : 'false'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {watch('is_recurring') && (
                    <>
                      <div>
                        <Label htmlFor="recurrence_type">Recurrence Type</Label>
                        <Input {...register('recurrence_type')} placeholder="weekly/monthly" />
                      </div>
                      
                      <div>
                        <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
                        <Input 
                          {...register('recurrence_pattern')} 
                          placeholder="every-monday, first-tuesday, last-friday"
                          onChange={(e) => {
                            const pattern = e.target.value;
                            setValue('recurrence_pattern', pattern);
                            // Auto-detect type from pattern
                            const autoType = getRecurrenceTypeFromPattern(pattern);
                            if (autoType) {
                              setValue('recurrence_type', autoType);
                            }
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="recurrence_end_date">Recurrence End Date</Label>
                        <Input {...register('recurrence_end_date')} type="date" />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Venue Information */}
            <Card>
              <CardHeader>
                <CardTitle>Venue Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="venue_name">Venue Name *</Label>
                    <Input {...register('venue_name', { required: 'Venue name is required' })} />
                    {errors.venue_name && <p className="text-red-500 text-sm">{errors.venue_name.message}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="venue_ages">Age Restriction</Label>
                    <Select 
                      onValueChange={(value) => setValue('venue_ages', value)}
                      value={watch('venue_ages')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Ages">All Ages</SelectItem>
                        <SelectItem value="18+">18+</SelectItem>
                        <SelectItem value="21+">21+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="venue_address">Address</Label>
                    <Input {...register('venue_address')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="venue_city">City</Label>
                    <Input {...register('venue_city')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="venue_state">State</Label>
                    <Input {...register('venue_state')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="venue_zip">ZIP Code</Label>
                    <Input {...register('venue_zip')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="venue_phone">Phone</Label>
                    <Input {...register('venue_phone')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="venue_website">Website</Label>
                    <Input {...register('venue_website')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="venue_image_url">Venue Image URL</Label>
                    <Input {...register('venue_image_url')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="venue_facebook_url">Venue Facebook</Label>
                    <Input {...register('venue_facebook_url')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="venue_instagram_url">Venue Instagram</Label>
                    <Input {...register('venue_instagram_url')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="venue_twitter_url">Venue Twitter</Label>
                    <Input {...register('venue_twitter_url')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="venue_youtube_url">Venue YouTube</Label>
                    <Input {...register('venue_youtube_url')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Links & Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Links & Social Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_display">Price Display</Label>
                    <Input {...register('price_display')} placeholder="Free, $25, $20-$50" />
                  </div>
                  
                  <div>
                    <Label htmlFor="ticket_url">Ticket URL</Label>
                    <Input {...register('ticket_url')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input {...register('website_url')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="facebook_url">Facebook URL</Label>
                    <Input {...register('facebook_url')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="instagram_url">Instagram URL</Label>
                    <Input {...register('instagram_url')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="twitter_url">Twitter URL</Label>
                    <Input {...register('twitter_url')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="youtube_url">YouTube URL</Label>
                    <Input {...register('youtube_url')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </main>
        
        <Footer />
      </div>
    </AdminProtectedRoute>
  );
};

export default AdminCreateEvent;