
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EventDateTimeStep } from './event-form/EventDateTimeStep';
import { EventDetailsStep } from './event-form/EventDetailsStep';
import { EventFormData } from './event-form/types';

export const SubmitEventForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EventFormData>();

  const onSubmit = async (data: EventFormData) => {
    try {
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

      const eventData = {
        ...data,
        start_date: startDate?.toISOString().split('T')[0],
        is_recurring: isRecurring,
        recurrence_type: recurringType,
        recurrence_pattern: data.recurrence_pattern || null,
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
        // Reset form
        setStep(1);
        setIsRecurring(false);
        setRecurringType('');
        setStartDate(undefined);
        setEndDate(undefined);
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
      errors={errors}
      onPrevious={prevStep}
      onSubmit={handleSubmit(onSubmit)}
    />
  );
};
