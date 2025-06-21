
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const EventSync: React.FC = () => {
  const { toast } = useToast();

  useEffect(() => {
    const checkAndPopulateEvents = async () => {
      try {
        // Check if we have any events
        const { data: existingEvents, error: checkError } = await supabase
          .from('poreve_events')
          .select('id')
          .limit(1);

        if (checkError) {
          console.error('Error checking existing events:', checkError);
          return;
        }

        // If no events exist, populate automatically
        if (!existingEvents || existingEvents.length === 0) {
          console.log('No events found, auto-populating...');
          
          const { data, error } = await supabase.functions.invoke('sync-events');
          
          if (error) {
            console.error('Auto-population error:', error);
          } else {
            console.log('Auto-population successful:', data);
            toast({
              title: "Events populated!",
              description: `Added ${data.stats?.processed || 0} sample events to get you started.`,
            });
          }
        }
      } catch (error) {
        console.error('Auto-population check error:', error);
      }
    };

    checkAndPopulateEvents();
  }, [toast]);

  // This component no longer renders anything visible
  return null;
};
