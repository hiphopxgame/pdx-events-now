
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const EventSync: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-events');
      
      if (error) {
        throw error;
      }

      toast({
        title: "Events synced successfully!",
        description: `Processed ${data.stats.processed} events from APIs`,
      });

      // Refresh the page to show new events
      window.location.reload();
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "Failed to sync events from APIs. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4">
      <Button
        onClick={handleSync}
        disabled={isLoading}
        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        Sync Events
      </Button>
    </div>
  );
};
