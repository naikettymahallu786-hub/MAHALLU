import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

export function usePrayerTimes() {
  return useQuery({
    queryKey: ['mobile', 'prayer-times'],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/prayer-times');
      return data.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
