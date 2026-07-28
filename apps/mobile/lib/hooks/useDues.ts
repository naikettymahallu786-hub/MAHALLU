import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

export function useDues() {
  return useQuery({
    queryKey: ['mobile', 'dues'],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/me/dues');
      return data.data;
    },
  });
}
