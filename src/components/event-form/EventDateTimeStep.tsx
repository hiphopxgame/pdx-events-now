
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
import { getRecurrenceTypeFromPattern } from '@/utils/recurrenceUtils';

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
  setValue?: (name: keyof EventFormData, value: any) => void;
  watch?: (name: keyof EventFormData) => any;
  recurrenceType?: string;
  setRecurrenceType?: (value: string) => void;
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
  setValue,
  watch,
  recurrenceType,
  setRecurrenceType,
}) => {
  // Automatically determine recurrence type from pattern
  useEffect(() => {
    if (recurringType && setRecurrenceType) {
      const autoType = getRecurrenceTypeFromPattern(recurringType);
      if (autoType && autoType !== recurrenceType) {
        setRecurrenceType(autoType);
      }
    }
  }, [recurringType, recurrenceType, setRecurrenceType]);
  // Set default date to today if not set
  useEffect(() => {
    if (!startDate) {
      setStartDate(new Date());
    }
  }, [startDate, setStartDate]);

  // Adjust start date to match the recurrence pattern
  useEffect(() => {
    if (isRecurring && recurringType && startDate) {
      const adjustedDate = getNextDateForPattern(startDate, recurringType);
      if (adjustedDate && adjustedDate.getTime() !== startDate.getTime()) {
        // Use setTimeout to prevent infinite re-renders
        setTimeout(() => {
          setStartDate(adjustedDate);
        }, 0);
      }
    }
  }, [isRecurring, recurringType]); // Remove startDate and setStartDate from dependencies

  const getAvailableRecurrenceOptions = (selectedDate: Date) => {
    const dayOfWeek = selectedDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // Start with single day as default option
    const options = ['single'];
    
    // Add weekly recurrence option
    options.push(`every-${dayName}`);
    
    // Calculate which occurrence of this day it is in the month
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // Count how many of this day of week have occurred up to and including the selected date
    let occurrenceCount = 0;
    for (let day = 1; day <= selectedDate.getDate(); day++) {
      const testDate = new Date(year, month, day);
      if (testDate.getDay() === dayOfWeek) {
        occurrenceCount++;
      }
    }
    
    // Add the occurrence-based option if it's within the first 5
    const occurrenceNames = ['first', 'second', 'third', 'fourth', 'fifth'];
    if (occurrenceCount <= 5) {
      options.push(`${occurrenceNames[occurrenceCount - 1]}-${dayName}`);
    }
    
    // Check if this is actually the last occurrence of this day in the month
    const isLastOccurrence = findNthDayOfMonth(year, month, 'last', dayOfWeek)?.getDate() === selectedDate.getDate();
    if (isLastOccurrence) {
      options.push(`last-${dayName}`);
    }
    
    return options;
  };

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
        'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5
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
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h3 className="text-lg font-medium">When is your event?</h3>
            
            <div>
              <Label className="text-base">Event Date *</Label>
              <p className="text-sm text-muted-foreground mb-2">Select the date your event will take place</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-12">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "EEEE, MMMM do, yyyy") : "Click to select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-background border" align="start">
                  <Calendar 
                    mode="single" 
                    selected={startDate} 
                    onSelect={(date) => {
                      setStartDate(date);
                      // Close the popover by removing focus
                      if (date) {
                        document.body.click();
                      }
                    }} 
                    initialFocus 
                    className="p-3 pointer-events-auto bg-background" 
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-base">Event Time</Label>
              <p className="text-sm text-muted-foreground mb-2">When does your event start and end?</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time" className="text-sm">Start Time</Label>
                  <Input 
                    id="start_time" 
                    type="time" 
                    {...register('start_time')} 
                    value={watch ? watch('start_time') || '' : ''}
                    onChange={(e) => setValue && setValue('start_time', e.target.value)}
                    placeholder="12:00"
                    className="h-12" 
                  />
                </div>
                <div>
                  <Label htmlFor="end_time" className="text-sm">End Time</Label>
                  <Input 
                    id="end_time" 
                    type="time" 
                    {...register('end_time')} 
                    value={watch ? watch('end_time') || '' : ''}
                    onChange={(e) => setValue && setValue('end_time', e.target.value)}
                    placeholder="13:00"
                    className="h-12" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => {
                console.log('Checkbox changed:', checked);
                setIsRecurring(checked === true);
              }}
            />
            <Label 
              htmlFor="recurring" 
              className="cursor-pointer select-none"
            >
              This is a recurring event
            </Label>
          </div>

          {isRecurring && startDate && (
            <RecurrenceSelector
              recurringType={recurringType}
              setRecurringType={setRecurringType}
              endDate={endDate}
              setEndDate={setEndDate}
              availableOptions={getAvailableRecurrenceOptions(startDate)}
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
