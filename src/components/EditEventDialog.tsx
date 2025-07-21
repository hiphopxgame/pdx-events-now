import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Upload, X } from 'lucide-react';
import { RecurrenceSelector } from './event-form/RecurrenceSelector';

interface EditEventDialogProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditEventDialog: React.FC<EditEventDialogProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    event.image_urls && event.image_urls.length > 0 
      ? event.image_urls 
      : event.image_url 
        ? [event.image_url] 
        : []
  );
  const [isRecurring, setIsRecurring] = useState(event.is_recurring || false);
  const [recurringType, setRecurringType] = useState(event.recurrence_pattern || '');
  const [endDate, setEndDate] = useState<Date | undefined>(
    event.recurrence_end_date ? new Date(event.recurrence_end_date) : undefined
  );
  const [isFeatured, setIsFeatured] = useState(event.is_featured || false);
  const [selectedDate, setSelectedDate] = useState(new Date(event.start_date));
  const { toast } = useToast();
  const { isAdmin } = useUserRoles();

  const getAvailableRecurrenceOptions = (selectedDate: Date) => {
    const dayOfWeek = selectedDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    const options = [`every-${dayName}`];
    
    // Calculate which occurrence of the day this is in the month
    const date = selectedDate.getDate();
    const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    
    const actualOccurrence = Math.ceil(date / 7);
    
    // Add the occurrence-based option
    const occurrenceNames = ['first', 'second', 'third', 'fourth'];
    if (actualOccurrence <= 4) {
      options.push(`${occurrenceNames[actualOccurrence - 1]}-${dayName}`);
    }
    
    // Check if this is also the last occurrence of this day in the month
    const isLast = date + 7 > lastDayOfMonth.getDate();
    if (isLast) {
      options.push(`last-${dayName}`);
    }
    
    return options;
  };
  
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      title: event.title,
      description: event.description || '',
      category: event.category,
      venue_name: event.venue_name,
      venue_address: event.venue_address || '',
      venue_city: event.venue_city || 'Portland',
      venue_state: event.venue_state || 'Oregon',
      venue_zip: event.venue_zip || '',
      price_display: event.price_display || '',
      price_min: event.price_min || '',
      price_max: event.price_max || '',
      organizer_name: event.organizer_name || '',
      organizer_email: event.organizer_email || '',
      organizer_phone: event.organizer_phone || '',
      ticket_url: event.ticket_url || '',
      website_url: event.website_url || '',
      facebook_url: event.facebook_url || '',
      instagram_url: event.instagram_url || '',
      twitter_url: event.twitter_url || '',
      youtube_url: event.youtube_url || '',
      start_date: event.start_date,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
    }
  });

  const handleImageUpload = async (file: File) => {
    if (!file) return null;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // For recurring events, allow multiple images; for non-recurring, limit to one
      const newFiles = isRecurring ? [...imageFiles, ...files] : files.slice(0, 1);
      const newUrls = files.map(file => URL.createObjectURL(file));
      
      if (isRecurring) {
        setImageFiles(newFiles);
        setPreviewUrls([...previewUrls, ...newUrls]);
      } else {
        setImageFiles(newFiles);
        setPreviewUrls(newUrls);
      }
    }
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const onSubmit = async (data: any) => {
    try {
      const imageUrls: string[] = [];
      
      // Keep existing images that weren't removed
      const existingUrls = previewUrls.filter(url => !url.startsWith('blob:'));
      imageUrls.push(...existingUrls);

      // Upload new images if selected
      if (imageFiles.length > 0) {
        setIsUploading(true);
        for (const file of imageFiles) {
          const uploadedUrl = await handleImageUpload(file);
          if (uploadedUrl) {
            imageUrls.push(uploadedUrl);
          }
        }
        setIsUploading(false);
      }

      const updateData = {
        ...data,
        image_url: imageUrls.length > 0 ? imageUrls[0] : null, // Keep backward compatibility
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        price_min: data.price_min ? parseFloat(data.price_min) : null,
        price_max: data.price_max ? parseFloat(data.price_max) : null,
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? 'weekly' : null,
        recurrence_pattern: isRecurring ? recurringType : null,
        recurrence_end_date: endDate?.toISOString().split('T')[0] || null,
        ...(isAdmin && { is_featured: isFeatured }),
      };

      const { error } = await supabase
        .from('user_events')
        .update(updateData)
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Event updated successfully",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label>Event Image{isRecurring ? 's' : ''} {isRecurring && '(Multiple images for variety)'}</Label>
            
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={url} 
                      alt={`Event preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                {isRecurring ? 'Upload multiple images for variety' : 'Upload an event image'}
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
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : isRecurring ? 'Add Images' : 'Choose Image'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input {...register('title', { required: true })} />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea {...register('description')} rows={3} />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select onValueChange={(value) => setValue('category', value)} defaultValue={event.category}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="start_date">Start Date *</Label>
                <Input 
                  type="date" 
                  {...register('start_date', { required: true })} 
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setSelectedDate(date);
                    setValue('start_date', e.target.value);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input type="time" {...register('start_time')} />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input type="time" {...register('end_time')} />
                </div>
              </div>

              {/* Recurring Event Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="recurring" 
                    checked={isRecurring}
                    onCheckedChange={(checked) => setIsRecurring(checked === true)}
                  />
                  <Label htmlFor="recurring">This is a recurring event</Label>
                </div>

                {isRecurring && (
                  <RecurrenceSelector
                    recurringType={recurringType}
                    setRecurringType={setRecurringType}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    availableOptions={getAvailableRecurrenceOptions(selectedDate)}
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="venue_name">Venue Name *</Label>
                <Input {...register('venue_name', { required: true })} />
              </div>

              <div>
                <Label htmlFor="venue_address">Venue Address</Label>
                <Input {...register('venue_address')} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="venue_city">City</Label>
                  <Input {...register('venue_city')} />
                </div>
                <div>
                  <Label htmlFor="venue_state">State</Label>
                  <Input {...register('venue_state')} />
                </div>
                <div>
                  <Label htmlFor="venue_zip">ZIP</Label>
                  <Input {...register('venue_zip')} />
                </div>
              </div>

              <div>
                <Label htmlFor="price_display">Price Display</Label>
                <Input {...register('price_display')} placeholder="e.g., Free, $25, $20-$50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_min">Min Price ($)</Label>
                  <Input type="number" step="0.01" {...register('price_min')} />
                </div>
                <div>
                  <Label htmlFor="price_max">Max Price ($)</Label>
                  <Input type="number" step="0.01" {...register('price_max')} />
                </div>
              </div>

              <div>
                <Label htmlFor="organizer_name">Organizer Name</Label>
                <Input {...register('organizer_name')} />
              </div>

              <div>
                <Label htmlFor="organizer_email">Contact Email</Label>
                <Input type="email" {...register('organizer_email')} />
              </div>

              <div>
                <Label htmlFor="organizer_phone">Contact Phone</Label>
                <Input {...register('organizer_phone')} />
              </div>

              <div>
                <Label htmlFor="ticket_url">Ticket URL</Label>
                <Input {...register('ticket_url')} />
              </div>
            </div>
          </div>

          {/* Social Media & Links Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Social Media & Links</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input {...register('website_url')} placeholder="https://example.com" />
              </div>
              <div>
                <Label htmlFor="facebook_url">Facebook URL</Label>
                <Input {...register('facebook_url')} placeholder="https://facebook.com/page" />
              </div>
              <div>
                <Label htmlFor="instagram_url">Instagram URL</Label>
                <Input {...register('instagram_url')} placeholder="https://instagram.com/page" />
              </div>
              <div>
                <Label htmlFor="twitter_url">Twitter URL</Label>
                <Input {...register('twitter_url')} placeholder="https://twitter.com/page" />
              </div>
              <div>
                <Label htmlFor="youtube_url">YouTube URL</Label>
                <Input {...register('youtube_url')} placeholder="https://youtube.com/channel/..." />
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Switch
                id="featured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
              <Label htmlFor="featured" className="text-sm font-medium">
                Featured Event (appears highlighted on main page)
              </Label>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading} className="flex-1">
              {isSubmitting ? 'Updating...' : 'Update Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};