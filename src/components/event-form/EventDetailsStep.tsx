
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, X, MapPin } from 'lucide-react';
import { UseFormRegister, UseFormSetValue, FieldErrors, UseFormWatch } from 'react-hook-form';
import { EventFormData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVenues } from '@/hooks/useVenues';
import { useCategories } from '@/hooks/events/useCategories';

interface EventDetailsStepProps {
  register: UseFormRegister<EventFormData>;
  setValue: UseFormSetValue<EventFormData>;
  watch: UseFormWatch<EventFormData>;
  errors: FieldErrors<EventFormData>;
  onPrevious: () => void;
  onSubmit: (imageFiles?: File[]) => void;
  isRecurring?: boolean;
}

export const EventDetailsStep: React.FC<EventDetailsStepProps> = ({
  register,
  setValue,
  watch,
  errors,
  onPrevious,
  onSubmit,
  isRecurring = false,
}) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [useExistingVenue, setUseExistingVenue] = useState(true);
  const { toast } = useToast();
  const { data: venues = [], isLoading: venuesLoading } = useVenues();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      
      if (isRecurring) {
        // For recurring events, allow multiple images
        setImageFiles(prev => [...prev, ...newFiles]);
        const newUrls = newFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newUrls]);
      } else {
        // For single events, only allow one image
        setImageFiles([newFiles[0]]);
        setPreviewUrls([URL.createObjectURL(newFiles[0])]);
      }
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      // Clean up the URL object to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleVenueSelect = (venueId: string) => {
    const selectedVenue = venues.find(v => v.id === venueId);
    if (selectedVenue) {
      setValue('venue_name', selectedVenue.name);
      setValue('venue_address', selectedVenue.address || '');
      setValue('venue_city', selectedVenue.city || 'Portland');
      setValue('venue_state', selectedVenue.state || 'Oregon');
      setValue('venue_zip', selectedVenue.zip_code || '');
    }
  };

  const handleSubmit = () => {
    onSubmit(imageFiles.length > 0 ? imageFiles : undefined);
  };
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Submit New Event - Step 2: Event & Venue Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label>
              {isRecurring ? 'Event Images (Multiple for variety)' : 'Event Image'}
            </Label>
            {isRecurring && (
              <p className="text-sm text-muted-foreground">
                Upload multiple images for your recurring event. Different images will be shown for each occurrence to add variety.
              </p>
            )}
            
            {previewUrls.length > 0 ? (
              <div className="space-y-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={url} 
                      alt={`Event preview ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {isRecurring && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple={isRecurring}
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload-additional"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload-additional')?.click()}
                    >
                      Add More Images
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  {isRecurring ? 'Upload event images' : 'Upload an event image'}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple={isRecurring}
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  {isRecurring ? 'Choose Images' : 'Choose Image'}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" isRequired={true} fieldValue={watch('title')}>Event Title</Label>
              <Input 
                id="title" 
                value={watch('title') || ''}
                onChange={(e) => setValue('title', e.target.value)}
                placeholder="Enter event title"
                isRequired={true}
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="description" fieldValue={watch('description')}>Event Description</Label>
              <Textarea 
                id="description" 
                value={watch('description') || ''}
                onChange={(e) => setValue('description', e.target.value)}
                placeholder="Describe your event"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="category" isRequired={true} fieldValue={watch('category')}>Category</Label>
              {categoriesLoading ? (
                <div className="text-sm text-muted-foreground">Loading categories...</div>
              ) : (
                <Select onValueChange={(value) => setValue('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Venue Selection */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg font-medium">Where is your event?</Label>
                  <p className="text-sm text-muted-foreground">Choose an existing venue or add a new one</p>
                </div>
                <Button
                  type="button"
                  variant={useExistingVenue ? "outline" : "default"}
                  size="sm"
                  onClick={() => setUseExistingVenue(!useExistingVenue)}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {useExistingVenue ? 'Add New Venue' : 'Select Existing Venue'}
                </Button>
              </div>

              {useExistingVenue ? (
                <div>
                  <Label htmlFor="venue_select" className="text-base">Select Venue *</Label>
                  {venuesLoading ? (
                    <div className="text-sm text-muted-foreground">Loading venues...</div>
                  ) : venues.length > 0 ? (
                    <Select onValueChange={handleVenueSelect}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Choose from approved venues" />
                      </SelectTrigger>
                      <SelectContent>
                        {venues.map((venue) => (
                          <SelectItem key={venue.id} value={venue.id}>
                            <div className="flex flex-col text-left">
                              <span className="font-medium">{venue.name}</span>
                              {venue.address && (
                                <span className="text-sm text-muted-foreground">
                                  {venue.address}, {venue.city}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 border rounded-md">
                      No approved venues available. Click "Add New Venue" to create one.
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="venue_name" isRequired={true} fieldValue={watch('venue_name')}>Venue Name</Label>
                  <Input 
                    id="venue_name" 
                    value={watch('venue_name') || ''}
                    onChange={(e) => setValue('venue_name', e.target.value)}
                    placeholder="Enter the venue name"
                    className="h-12"
                    isRequired={true}
                  />
                  {errors.venue_name && <p className="text-red-500 text-sm">{errors.venue_name.message}</p>}
                </div>
              )}
            </div>

            {!useExistingVenue && (
              <>
                <div>
                  <Label htmlFor="venue_address" fieldValue={watch('venue_address')}>Venue Address</Label>
                  <Input 
                    id="venue_address" 
                    value={watch('venue_address') || ''}
                    onChange={(e) => setValue('venue_address', e.target.value)}
                    placeholder="Street address"
                    className="h-12"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="venue_city">City</Label>
                    <Input 
                      id="venue_city" 
                      value={watch('venue_city') || 'Portland'}
                      onChange={(e) => setValue('venue_city', e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue_state">State</Label>
                    <Input 
                      id="venue_state" 
                      value={watch('venue_state') || 'Oregon'}
                      onChange={(e) => setValue('venue_state', e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue_zip">ZIP Code</Label>
                    <Input 
                      id="venue_zip" 
                      value={watch('venue_zip') || ''}
                      onChange={(e) => setValue('venue_zip', e.target.value)}
                      placeholder="97201"
                      className="h-12"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Venue Social Media Section */}
            {!useExistingVenue && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
                <h4 className="font-medium text-gray-700">Venue Social Media</h4>
                 <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="venue_website_url">Venue Website</Label>
                    <Input 
                      id="venue_website_url" 
                      value={watch('venue_website_url') || ''}
                      onChange={(e) => setValue('venue_website_url', e.target.value)}
                      placeholder="https://venue-website.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue_facebook_url">Venue Facebook</Label>
                    <Input 
                      id="venue_facebook_url" 
                      value={watch('venue_facebook_url') || ''}
                      onChange={(e) => setValue('venue_facebook_url', e.target.value)}
                      placeholder="https://facebook.com/venue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue_instagram_url">Venue Instagram</Label>
                    <Input 
                      id="venue_instagram_url" 
                      value={watch('venue_instagram_url') || ''}
                      onChange={(e) => setValue('venue_instagram_url', e.target.value)}
                      placeholder="https://instagram.com/venue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue_twitter_url">Venue Twitter</Label>
                    <Input 
                      id="venue_twitter_url" 
                      value={watch('venue_twitter_url') || ''}
                      onChange={(e) => setValue('venue_twitter_url', e.target.value)}
                      placeholder="https://twitter.com/venue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue_youtube_url">Venue YouTube</Label>
                    <Input 
                      id="venue_youtube_url" 
                      value={watch('venue_youtube_url') || ''}
                      onChange={(e) => setValue('venue_youtube_url', e.target.value)}
                      placeholder="https://youtube.com/venue"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="price_display" fieldValue={watch('price_display')}>Price Display</Label>
              <Input 
                id="price_display" 
                value={watch('price_display') || ''}
                onChange={(e) => setValue('price_display', e.target.value)}
                placeholder="e.g., Free, $25, $20-$50"
              />
            </div>

            {/* Removed organizer fields - Min Price, Max Price, Organizer Name, Contact Email, Contact Phone */}
            <div>
              <Label htmlFor="ticket_url" fieldValue={watch('ticket_url')}>Ticket/Registration URL</Label>
              <Input 
                id="ticket_url" 
                value={watch('ticket_url') || ''}
                onChange={(e) => setValue('ticket_url', e.target.value)}
                placeholder="https://example.com/tickets"
              />
            </div>

            <div>
              <Label htmlFor="website_url" fieldValue={watch('website_url')}>Website URL</Label>
              <Input 
                id="website_url" 
                value={watch('website_url') || ''}
                onChange={(e) => setValue('website_url', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Event Social Media</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facebook_url" fieldValue={watch('facebook_url')}>Facebook URL</Label>
                  <Input 
                    id="facebook_url" 
                    value={watch('facebook_url') || ''}
                    onChange={(e) => setValue('facebook_url', e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram_url" fieldValue={watch('instagram_url')}>Instagram URL</Label>
                  <Input 
                    id="instagram_url" 
                    value={watch('instagram_url') || ''}
                    onChange={(e) => setValue('instagram_url', e.target.value)}
                    placeholder="https://instagram.com/yourpage"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter_url" fieldValue={watch('twitter_url')}>Twitter URL</Label>
                  <Input 
                    id="twitter_url" 
                    value={watch('twitter_url') || ''}
                    onChange={(e) => setValue('twitter_url', e.target.value)}
                    placeholder="https://twitter.com/yourpage"
                  />
                </div>
                <div>
                  <Label htmlFor="youtube_url" fieldValue={watch('youtube_url')}>YouTube URL</Label>
                  <Input 
                    id="youtube_url" 
                    value={watch('youtube_url') || ''}
                    onChange={(e) => setValue('youtube_url', e.target.value)}
                    placeholder="https://youtube.com/channel/..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onPrevious} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button type="submit" onClick={handleSubmit} className="flex-1">
              Submit Event for Review
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
