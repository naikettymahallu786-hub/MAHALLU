import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

export function usePayments(page: number = 1) {
  return useQuery({
    queryKey: ['mobile', 'payments', page],
    queryFn: async () => {
      const { data } = await apiClient.get(`/mobile/me/payments?page=${page}`);
      return data; // Returns data and pagination
    },
  });
}
