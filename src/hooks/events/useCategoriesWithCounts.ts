import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCategoriesWithCounts = () => {
  return useQuery({
    queryKey: ['categories-with-counts'],
    queryFn: async () => {
      // First get all active categories
      const { data: categories, error: categoriesError } = await supabase
        .from('poreve_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        throw categoriesError;
      }

      // Then get event counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          // Get count from both poreve_events and user_events
          const [porEveCount, userEventCount] = await Promise.all([
            supabase
              .from('poreve_events')
              .select('id', { count: 'exact', head: true })
              .eq('category', category.slug)
              .eq('is_active', true),
            supabase
              .from('user_events')
              .select('id', { count: 'exact', head: true })
              .eq('category', category.slug)
              .eq('status', 'approved')
          ]);

          const totalCount = (porEveCount.count || 0) + (userEventCount.count || 0);
          
          return {
            ...category,
            event_count: totalCount
          };
        })
      );

      // Filter out categories with no events
      return categoriesWithCounts.filter(category => category.event_count > 0);
    },
  });
};