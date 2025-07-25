
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
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('status', 'approved')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching approved events:', error);
        throw error;
      }

      return data as UserEvent[];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePendingEvents = () => {
  return useQuery({
    queryKey: ['pending-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending events:', error);
        throw error;
      }

      return data as UserEvent[];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAllEvents = () => {
  return useQuery({
    queryKey: ['all-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all events:', error);
        throw error;
      }

      return data as UserEvent[];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
