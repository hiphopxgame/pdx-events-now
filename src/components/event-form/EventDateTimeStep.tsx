
import React, { useEffect } from 'react';
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
  // Adjust start date to match the recurrence pattern
  useEffect(() => {
    if (isRecurring && recurringType && startDate) {
      const adjustedDate = getNextDateForPattern(startDate, recurringType);
      if (adjustedDate && adjustedDate.getTime() !== startDate.getTime()) {
        setStartDate(adjustedDate);
      }
    }
  }, [isRecurring, recurringType, startDate, setStartDate]);

  const getNextDateForPattern = (fromDate: Date, pattern: string): Date | null => {
    if (pattern.startsWith('every-')) {
      const dayName = pattern.replace('every-', '');
      const dayMap: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };
      
      const targetDay = dayMap[dayName];
      if (targetDay !== undefined) {
        const currentDate = new Date(fromDate);
        // If already on the right day, return as is, otherwise find next occurrence
        if (currentDate.getDay() === targetDay) {
          return currentDate;
        }
        
        while (currentDate.getDay() !== targetDay) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return currentDate;
      }
    } else if (pattern.includes('-')) {
      // For monthly patterns, find the next occurrence
      const [occurrence, dayName] = pattern.split('-');
      const dayMap: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };
      
      const targetDay = dayMap[dayName];
      if (targetDay !== undefined) {
        const currentDate = new Date(fromDate);
        const monthDate = findNthDayOfMonth(currentDate.getFullYear(), currentDate.getMonth(), occurrence, targetDay);
        if (monthDate && monthDate >= currentDate) {
          return monthDate;
        }
        // If no valid date this month, try next month
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        return findNthDayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth(), occurrence, targetDay);
      }
    }
    return null;
  };

  const findNthDayOfMonth = (year: number, month: number, occurrence: string, dayOfWeek: number): Date | null => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    if (occurrence === 'last') {
      for (let day = lastDay.getDate(); day >= 1; day--) {
        const date = new Date(year, month, day);
        if (date.getDay() === dayOfWeek) {
          return date;
        }
      }
    } else {
      const occurrenceMap: { [key: string]: number } = {
        'first': 1, 'second': 2, 'third': 3, 'fourth': 4
      };
      
      const nthOccurrence = occurrenceMap[occurrence];
      if (nthOccurrence) {
        let count = 0;
        for (let day = 1; day <= lastDay.getDate(); day++) {
          const date = new Date(year, month, day);
          if (date.getDay() === dayOfWeek) {
            count++;
            if (count === nthOccurrence) {
              return date;
            }
          }
        }
      }
    }
    return null;
  };
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
