import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

export function useNotifications() {
  return useQuery({
    queryKey: ['mobile', 'notifications'],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/me/notifications');
      return data.data;
    },
  });
}
