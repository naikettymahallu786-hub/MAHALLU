import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

export function useEvents(type: 'upcoming' | 'past' = 'upcoming') {
  return useQuery({
    queryKey: ['mobile', 'events', type],
    queryFn: async () => {
      const { data } = await apiClient.get(`/mobile/events?type=${type}`);
      return data.data;
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['mobile', 'announcements'],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/announcements');
      return data.data;
    },
  });
}
