
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface RecurrenceSelectorProps {
  recurringType: string;
  setRecurringType: (value: string) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  availableOptions: string[];
}

export const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({
  recurringType,
  setRecurringType,
  endDate,
  setEndDate,
  availableOptions,
}) => {
  const getOptionLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      'single': 'Single day',
      'every-sunday': 'Every Sunday',
      'every-monday': 'Every Monday',
      'every-tuesday': 'Every Tuesday',
      'every-wednesday': 'Every Wednesday',
      'every-thursday': 'Every Thursday',
      'every-friday': 'Every Friday',
      'every-saturday': 'Every Saturday',
      'first-sunday': 'First Sunday of Month',
      'first-monday': 'First Monday of Month',
      'first-tuesday': 'First Tuesday of Month',
      'first-wednesday': 'First Wednesday of Month',
      'first-thursday': 'First Thursday of Month',
      'first-friday': 'First Friday of Month',
      'first-saturday': 'First Saturday of Month',
      'second-sunday': 'Second Sunday of Month',
      'second-monday': 'Second Monday of Month',
      'second-tuesday': 'Second Tuesday of Month',
      'second-wednesday': 'Second Wednesday of Month',
      'second-thursday': 'Second Thursday of Month',
      'second-friday': 'Second Friday of Month',
      'second-saturday': 'Second Saturday of Month',
      'third-sunday': 'Third Sunday of Month',
      'third-monday': 'Third Monday of Month',
      'third-tuesday': 'Third Tuesday of Month',
      'third-wednesday': 'Third Wednesday of Month',
      'third-thursday': 'Third Thursday of Month',
      'third-friday': 'Third Friday of Month',
      'third-saturday': 'Third Saturday of Month',
      'fourth-sunday': 'Fourth Sunday of Month',
      'fourth-monday': 'Fourth Monday of Month',
      'fourth-tuesday': 'Fourth Tuesday of Month',
      'fourth-wednesday': 'Fourth Wednesday of Month',
      'fourth-thursday': 'Fourth Thursday of Month',
      'fourth-friday': 'Fourth Friday of Month',
      'fourth-saturday': 'Fourth Saturday of Month',
      'last-sunday': 'Last Sunday of Month',
      'last-monday': 'Last Monday of Month',
      'last-tuesday': 'Last Tuesday of Month',
      'last-wednesday': 'Last Wednesday of Month',
      'last-thursday': 'Last Thursday of Month',
      'last-friday': 'Last Friday of Month',
      'last-saturday': 'Last Saturday of Month',
    };
    return labels[value] || value;
  };
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <div>
        <Label>Recurrence Pattern</Label>
        <Select value={recurringType} onValueChange={setRecurringType}>
          <SelectTrigger>
            <SelectValue placeholder="Select recurrence pattern" />
          </SelectTrigger>
          <SelectContent>
            {availableOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {getOptionLabel(option)}
              </SelectItem>
            ))}
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
          <PopoverContent className="w-auto p-0 z-50 bg-background border">
            <Calendar 
              mode="single" 
              selected={endDate} 
              onSelect={(date) => {
                setEndDate(date);
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
    </div>
  );
};
