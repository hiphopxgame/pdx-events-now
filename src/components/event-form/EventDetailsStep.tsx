
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { EventFormData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EventDetailsStepProps {
  register: UseFormRegister<EventFormData>;
  setValue: UseFormSetValue<EventFormData>;
  errors: FieldErrors<EventFormData>;
  onPrevious: () => void;
  onSubmit: (imageFile?: File) => void;
}

export const EventDetailsStep: React.FC<EventDetailsStepProps> = ({
  register,
  setValue,
  errors,
  onPrevious,
  onSubmit,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = () => {
    onSubmit(imageFile || undefined);
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
            <Label>Event Image</Label>
            
            {previewUrl ? (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Event preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Upload an event image</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  Choose Image
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input 
                id="title" 
                {...register('title', { required: 'Event title is required' })}
                placeholder="Enter event title"
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Event Description</Label>
              <Textarea 
                id="description" 
                {...register('description')}
                placeholder="Describe your event"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="Food & Drink">Food & Drink</SelectItem>
                  <SelectItem value="Arts & Culture">Arts & Culture</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Outdoor">Outdoor</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="venue_name">Venue Name *</Label>
              <Input 
                id="venue_name" 
                {...register('venue_name', { required: 'Venue name is required' })}
                placeholder="Enter venue name"
              />
              {errors.venue_name && <p className="text-red-500 text-sm">{errors.venue_name.message}</p>}
            </div>

            <div>
              <Label htmlFor="venue_address">Venue Address</Label>
              <Input 
                id="venue_address" 
                {...register('venue_address')}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="venue_city">City</Label>
                <Input 
                  id="venue_city" 
                  {...register('venue_city')}
                  defaultValue="Portland"
                />
              </div>
              <div>
                <Label htmlFor="venue_state">State</Label>
                <Input 
                  id="venue_state" 
                  {...register('venue_state')}
                  defaultValue="Oregon"
                />
              </div>
              <div>
                <Label htmlFor="venue_zip">ZIP Code</Label>
                <Input 
                  id="venue_zip" 
                  {...register('venue_zip')}
                  placeholder="97201"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price_display">Price Display</Label>
              <Input 
                id="price_display" 
                {...register('price_display')}
                placeholder="e.g., Free, $25, $20-$50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_min">Min Price ($)</Label>
                <Input 
                  id="price_min" 
                  type="number" 
                  step="0.01"
                  {...register('price_min', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="price_max">Max Price ($)</Label>
                <Input 
                  id="price_max" 
                  type="number" 
                  step="0.01"
                  {...register('price_max', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="organizer_name">Organizer Name</Label>
              <Input 
                id="organizer_name" 
                {...register('organizer_name')}
                placeholder="Your name or organization"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organizer_email">Contact Email</Label>
                <Input 
                  id="organizer_email" 
                  type="email"
                  {...register('organizer_email')}
                  placeholder="contact@example.com"
                />
              </div>
              <div>
                <Label htmlFor="organizer_phone">Contact Phone</Label>
                <Input 
                  id="organizer_phone" 
                  {...register('organizer_phone')}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ticket_url">Ticket/Registration URL</Label>
              <Input 
                id="ticket_url" 
                {...register('ticket_url')}
                placeholder="https://example.com/tickets"
              />
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
