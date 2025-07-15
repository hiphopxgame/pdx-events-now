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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(event.image_url || '');
  const [isRecurring, setIsRecurring] = useState(event.is_recurring || false);
  const [recurringType, setRecurringType] = useState(event.recurrence_pattern || '');
  const [endDate, setEndDate] = useState<Date | undefined>(
    event.recurrence_end_date ? new Date(event.recurrence_end_date) : undefined
  );
  const [isFeatured, setIsFeatured] = useState(event.is_featured || false);
  const { toast } = useToast();
  const { isAdmin } = useUserRoles();
  
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

  const onSubmit = async (data: any) => {
    try {
      let imageUrl = event.image_url;

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await handleImageUpload(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      } else if (!previewUrl) {
        // Image was removed
        imageUrl = null;
      }

      const updateData = {
        ...data,
        image_url: imageUrl,
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
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Choose Image'}
                </Button>
              </div>
            )}
            
            {!previewUrl && (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
              />
            )}
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
                <Input type="date" {...register('start_date', { required: true })} />
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