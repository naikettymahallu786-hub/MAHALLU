import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

export function useChildren() {
  return useQuery({
    queryKey: ['mobile', 'children'],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/me/children');
      return data.data;
    },
  });
}
