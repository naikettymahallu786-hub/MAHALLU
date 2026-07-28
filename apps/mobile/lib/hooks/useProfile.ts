import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';
import { useAuthStore } from '../../store/auth.store';

export function useProfile() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['mobile', 'profile', user?._id],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/me/profile');
      return data.data;
    },
    enabled: !!user?._id,
  });
}
