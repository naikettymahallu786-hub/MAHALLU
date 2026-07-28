import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api';

export function useUstadhClasses() {
  return useQuery({
    queryKey: ['mobile', 'ustadh', 'classes'],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/me/ustadh/classes');
      return data.data;
    },
  });
}

export function useMarkAttendance() {
  return useMutation({
    mutationFn: async (payload: { classId: string; date: string; records: { studentId: string; status: string; note?: string }[] }) => {
      const { data } = await apiClient.post('/mobile/me/ustadh/attendance', payload);
      return data;
    },
  });
}

export function useSendNotification() {
  return useMutation({
    mutationFn: async (payload: { classId: string; studentId?: string; title: string; message: string }) => {
      const { data } = await apiClient.post('/mobile/me/ustadh/notify', payload);
      return data;
    },
  });
}
