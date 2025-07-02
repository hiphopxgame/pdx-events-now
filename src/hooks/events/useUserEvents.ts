
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserEvent } from './types';

export const useUserEvents = () => {
  return useQuery({
    queryKey: ['user-events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user events:', error);
        throw error;
      }

      return data as UserEvent[];
    },
  });
};

export const useApprovedUserEvents = () => {
  return useQuery({
    queryKey: ['approved-user-events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .or(`status.eq.approved,and(created_by.eq.${user?.id || 'null'})`)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching user events:', error);
        throw error;
      }

      return data as UserEvent[];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
