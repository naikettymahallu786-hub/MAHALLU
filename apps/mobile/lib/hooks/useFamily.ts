import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

export function useFamily() {
  return useQuery({
    queryKey: ['mobile', 'family'],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/me/family');
      return data.data;
    },
  });
}
