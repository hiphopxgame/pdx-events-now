
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UseFormRegister } from 'react-hook-form';
import { RecurrenceSelector } from './RecurrenceSelector';
import { EventFormData } from './types';

interface EventDateTimeStepProps {
  register: UseFormRegister<EventFormData>;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  isRecurring: boolean;
  setIsRecurring: (value: boolean) => void;
  recurringType: string;
  setRecurringType: (value: string) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  onNext: () => void;
}

export const EventDateTimeStep: React.FC<EventDateTimeStepProps> = ({
  register,
  startDate,
  setStartDate,
  isRecurring,
  setIsRecurring,
  recurringType,
  setRecurringType,
  endDate,
  setEndDate,
  onNext,
}) => {
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

        <Button 
          onClick={onNext} 
          className="w-full"
          disabled={!startDate}
        >
          Next: Event Details <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
