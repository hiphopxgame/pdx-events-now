
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EventDateTimeStep } from './event-form/EventDateTimeStep';
import { EventDetailsStep } from './event-form/EventDetailsStep';
import { EventFormData } from './event-form/types';
import { 
  compressImage, 
  isValidImageFile, 
  formatFileSize, 
  createFileFromBlob, 
  DEFAULT_COMPRESSION_OPTIONS 
} from '@/lib/imageUtils';

export const SubmitEventForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EventFormData>();

  const handleImageUpload = async (file: File) => {
    try {
      // Validate file type
      if (!isValidImageFile(file)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid image file (JPEG, PNG, WebP, or GIF)",
          variant: "destructive",
        });
        return null;
      }

      // Show compression progress
      const originalSize = formatFileSize(file.size);
      console.log(`Compressing image: ${file.name} (${originalSize})`);

      // Compress the image
      const compressedBlob = await compressImage(file, DEFAULT_COMPRESSION_OPTIONS.event);
      const compressedSize = formatFileSize(compressedBlob.size);
      
      console.log(`Compression complete: ${originalSize} → ${compressedSize}`);

      // Create file from compressed blob
      const compressedFile = createFileFromBlob(compressedBlob, file.name, 'jpeg');
      
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, compressedFile);

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
    }
  };

  const handleMultipleImageUpload = async (files: File[]) => {
    try {
      const uploadPromises = files.map(file => handleImageUpload(file));
      const results = await Promise.all(uploadPromises);
      return results.filter(url => url !== null) as string[];
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload some images",
        variant: "destructive",
      });
      return [];
    }
  };

  const onSubmit = async (data: EventFormData, imageFiles?: File[]) => {
    try {
      let imageUrl = null;
      let imageUrls: string[] = [];

      // Upload images if provided
      if (imageFiles && imageFiles.length > 0) {
        if (imageFiles.length === 1) {
          // Single image for backward compatibility
          imageUrl = await handleImageUpload(imageFiles[0]);
          imageUrls = imageUrl ? [imageUrl] : [];
        } else {
          // Multiple images for recurring events
          imageUrls = await handleMultipleImageUpload(imageFiles);
          imageUrl = imageUrls[0] || null; // Use first image as primary for backward compatibility
        }
      }
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit an event.",
          variant: "destructive",
        });
        return;
      }

      console.log('User authenticated:', user.id);

      // Check if user profile exists, create if it doesn't
      const { data: profile, error: profileError } = await supabase
        .from('por_eve_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      console.log('Profile check result:', profile, profileError);

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating profile for user:', user.id);
        const { error: createProfileError } = await supabase
          .from('por_eve_profiles')
          .insert([{
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
            username: user.user_metadata?.full_name 
              ? user.user_metadata.full_name.toLowerCase().replace(/\s+/g, '_')
              : user.email?.split('@')[0]
          }]);

        if (createProfileError) {
          console.error('Error creating profile:', createProfileError);
          toast({
            title: "Profile Error",
            description: "Failed to create user profile. Please try again.",
            variant: "destructive",
          });
          return;
        }
        console.log('Profile created successfully');
      }

      // Handle venue creation if it's a new venue with social media
      if (data.venue_website_url || data.venue_facebook_url || data.venue_instagram_url || 
          data.venue_twitter_url || data.venue_youtube_url) {
        
        // Create or update venue with social media
        const venueData = {
          name: data.venue_name,
          address: data.venue_address,
          city: data.venue_city,
          state: data.venue_state,
          zip_code: data.venue_zip,
          website: data.venue_website_url,
          facebook_url: data.venue_facebook_url,
          instagram_url: data.venue_instagram_url,
          twitter_url: data.venue_twitter_url,
          youtube_url: data.venue_youtube_url,
        };

        console.log('Creating/updating venue with social media:', venueData);

        // Check if venue already exists
        const { data: existingVenue } = await supabase
          .from('venues')
          .select('id')
          .eq('name', data.venue_name)
          .eq('address', data.venue_address)
          .single();

        let venueResult;
        if (existingVenue) {
          // Update existing venue
          venueResult = await supabase
            .from('venues')
            .update(venueData)
            .eq('id', existingVenue.id);
        } else {
          // Insert new venue
          venueResult = await supabase
            .from('venues')
            .insert([venueData]);
        }

        const { error: venueError } = venueResult;

        if (venueError) {
          console.error('Error creating/updating venue:', venueError);
          toast({
            title: "Venue Error",
            description: "Failed to save venue information. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Remove venue social media fields from event data
      const { venue_website_url, venue_facebook_url, venue_instagram_url, 
              venue_twitter_url, venue_youtube_url, ...eventDataWithoutVenueSocial } = data;

      const eventData = {
        ...eventDataWithoutVenueSocial,
        image_url: imageUrl,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        start_date: startDate?.toISOString().split('T')[0],
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? 'weekly' : null,
        recurrence_pattern: isRecurring ? recurringType : null,
        recurrence_end_date: endDate?.toISOString().split('T')[0] || null,
        created_by: user.id,
      };

      console.log('Submitting event data:', eventData);

      const { error } = await supabase
        .from('user_events')
        .insert([eventData]);

      if (error) {
        console.error('Error submitting event:', error);
        toast({
          title: "Error",
          description: "Failed to submit event. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "Your event has been submitted for review.",
        });
        
        // Store event data in sessionStorage for the summary display
        sessionStorage.setItem('recentlySubmittedEvent', JSON.stringify({
          ...eventData,
          submittedAt: new Date().toISOString()
        }));
        
        // Navigate to My Events page
        navigate('/my-events');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const nextStep = () => setStep(2);
  const prevStep = () => setStep(1);

  if (step === 1) {
    return (
      <EventDateTimeStep
        register={register}
        startDate={startDate}
        setStartDate={setStartDate}
        isRecurring={isRecurring}
        setIsRecurring={setIsRecurring}
        recurringType={recurringType}
        setRecurringType={setRecurringType}
        endDate={endDate}
        setEndDate={setEndDate}
        onNext={nextStep}
      />
    );
  }

  return (
    <EventDetailsStep
      register={register}
      setValue={setValue}
      watch={watch}
      errors={errors}
      onPrevious={prevStep}
      isRecurring={isRecurring}
      onSubmit={(imageFiles) => handleSubmit((data) => onSubmit(data, imageFiles))()}
    />
  );
};
