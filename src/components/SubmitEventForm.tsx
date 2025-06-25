
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EventFormData {
  title: string;
  description: string;
  category: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_zip: string;
  price_display: string;
  price_min: number;
  price_max: number;
  organizer_name: string;
  organizer_email: string;
  organizer_phone: string;
  ticket_url: string;
  start_date: Date;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_type: string;
  recurrence_pattern: string;
  recurrence_end_date: Date;
}

export const SubmitEventForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EventFormData>();

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

      const eventData = {
        ...data,
        start_date: startDate?.toISOString().split('T')[0],
        is_recurring: isRecurring,
        recurrence_type: recurringType,
        recurrence_pattern: data.recurrence_pattern || null,
        recurrence_end_date: endDate?.toISOString().split('T')[0] || null,
        created_by: user.id,
      };

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
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Submit New Event - Step 1: Date & Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Event Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input id="start_time" type="time" {...register('start_time')} />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input id="end_time" type="time" {...register('end_time')} />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="recurring" 
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
              <Label htmlFor="recurring">This is a recurring event</Label>
            </div>

            {isRecurring && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div>
                  <Label>Recurrence Pattern</Label>
                  <Select value={recurringType} onValueChange={setRecurringType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recurrence pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Every Week</SelectItem>
                      <SelectItem value="monthly">Every Month</SelectItem>
                      <SelectItem value="first-monday">First Monday of Month</SelectItem>
                      <SelectItem value="first-tuesday">First Tuesday of Month</SelectItem>
                      <SelectItem value="first-wednesday">First Wednesday of Month</SelectItem>
                      <SelectItem value="first-thursday">First Thursday of Month</SelectItem>
                      <SelectItem value="first-friday">First Friday of Month</SelectItem>
                      <SelectItem value="first-saturday">First Saturday of Month</SelectItem>
                      <SelectItem value="first-sunday">First Sunday of Month</SelectItem>
                      <SelectItem value="second-monday">Second Monday of Month</SelectItem>
                      <SelectItem value="second-tuesday">Second Tuesday of Month</SelectItem>
                      <SelectItem value="second-wednesday">Second Wednesday of Month</SelectItem>
                      <SelectItem value="second-thursday">Second Thursday of Month</SelectItem>
                      <SelectItem value="second-friday">Second Friday of Month</SelectItem>
                      <SelectItem value="second-saturday">Second Saturday of Month</SelectItem>
                      <SelectItem value="second-sunday">Second Sunday of Month</SelectItem>
                      <SelectItem value="third-monday">Third Monday of Month</SelectItem>
                      <SelectItem value="third-tuesday">Third Tuesday of Month</SelectItem>
                      <SelectItem value="third-wednesday">Third Wednesday of Month</SelectItem>
                      <SelectItem value="third-thursday">Third Thursday of Month</SelectItem>
                      <SelectItem value="third-friday">Third Friday of Month</SelectItem>
                      <SelectItem value="third-saturday">Third Saturday of Month</SelectItem>
                      <SelectItem value="third-sunday">Third Sunday of Month</SelectItem>
                      <SelectItem value="last-monday">Last Monday of Month</SelectItem>
                      <SelectItem value="last-tuesday">Last Tuesday of Month</SelectItem>
                      <SelectItem value="last-wednesday">Last Wednesday of Month</SelectItem>
                      <SelectItem value="last-thursday">Last Thursday of Month</SelectItem>
                      <SelectItem value="last-friday">Last Friday of Month</SelectItem>
                      <SelectItem value="last-saturday">Last Saturday of Month</SelectItem>
                      <SelectItem value="last-sunday">Last Sunday of Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Recurrence End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick end date (optional)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={nextStep} 
            className="w-full"
            disabled={!startDate}
          >
            Next: Event Details <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Submit New Event - Step 2: Event & Venue Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button type="submit" className="flex-1">
              Submit Event for Review
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
