
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
}

export const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({
  recurringType,
  setRecurringType,
  endDate,
  setEndDate,
}) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div>
        <Label>Recurrence Pattern</Label>
        <Select value={recurringType} onValueChange={setRecurringType}>
          <SelectTrigger>
            <SelectValue placeholder="Select recurrence pattern" />
          </SelectTrigger>
          <SelectContent>
            {/* Weekly Options */}
            <SelectItem value="every-sunday">Every Sunday</SelectItem>
            <SelectItem value="every-monday">Every Monday</SelectItem>
            <SelectItem value="every-tuesday">Every Tuesday</SelectItem>
            <SelectItem value="every-wednesday">Every Wednesday</SelectItem>
            <SelectItem value="every-thursday">Every Thursday</SelectItem>
            <SelectItem value="every-friday">Every Friday</SelectItem>
            <SelectItem value="every-saturday">Every Saturday</SelectItem>
            
            {/* Monthly - First Week */}
            <SelectItem value="first-sunday">First Sunday of Month</SelectItem>
            <SelectItem value="first-monday">First Monday of Month</SelectItem>
            <SelectItem value="first-tuesday">First Tuesday of Month</SelectItem>
            <SelectItem value="first-wednesday">First Wednesday of Month</SelectItem>
            <SelectItem value="first-thursday">First Thursday of Month</SelectItem>
            <SelectItem value="first-friday">First Friday of Month</SelectItem>
            <SelectItem value="first-saturday">First Saturday of Month</SelectItem>
            
            {/* Monthly - Second Week */}
            <SelectItem value="second-sunday">Second Sunday of Month</SelectItem>
            <SelectItem value="second-monday">Second Monday of Month</SelectItem>
            <SelectItem value="second-tuesday">Second Tuesday of Month</SelectItem>
            <SelectItem value="second-wednesday">Second Wednesday of Month</SelectItem>
            <SelectItem value="second-thursday">Second Thursday of Month</SelectItem>
            <SelectItem value="second-friday">Second Friday of Month</SelectItem>
            <SelectItem value="second-saturday">Second Saturday of Month</SelectItem>
            
            {/* Monthly - Third Week */}
            <SelectItem value="third-sunday">Third Sunday of Month</SelectItem>
            <SelectItem value="third-monday">Third Monday of Month</SelectItem>
            <SelectItem value="third-tuesday">Third Tuesday of Month</SelectItem>
            <SelectItem value="third-wednesday">Third Wednesday of Month</SelectItem>
            <SelectItem value="third-thursday">Third Thursday of Month</SelectItem>
            <SelectItem value="third-friday">Third Friday of Month</SelectItem>
            <SelectItem value="third-saturday">Third Saturday of Month</SelectItem>
            
            {/* Monthly - Fourth Week */}
            <SelectItem value="fourth-sunday">Fourth Sunday of Month</SelectItem>
            <SelectItem value="fourth-monday">Fourth Monday of Month</SelectItem>
            <SelectItem value="fourth-tuesday">Fourth Tuesday of Month</SelectItem>
            <SelectItem value="fourth-wednesday">Fourth Wednesday of Month</SelectItem>
            <SelectItem value="fourth-thursday">Fourth Thursday of Month</SelectItem>
            <SelectItem value="fourth-friday">Fourth Friday of Month</SelectItem>
            <SelectItem value="fourth-saturday">Fourth Saturday of Month</SelectItem>
            
            {/* Monthly - Last Week */}
            <SelectItem value="last-sunday">Last Sunday of Month</SelectItem>
            <SelectItem value="last-monday">Last Monday of Month</SelectItem>
            <SelectItem value="last-tuesday">Last Tuesday of Month</SelectItem>
            <SelectItem value="last-wednesday">Last Wednesday of Month</SelectItem>
            <SelectItem value="last-thursday">Last Thursday of Month</SelectItem>
            <SelectItem value="last-friday">Last Friday of Month</SelectItem>
            <SelectItem value="last-saturday">Last Saturday of Month</SelectItem>
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
  );
};
