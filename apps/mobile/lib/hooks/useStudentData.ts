import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

export function useStudentProfile() {
  return useQuery({
    queryKey: ['mobile', 'student', 'profile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/me/student');
      return data.data;
    },
  });
}

export function useStudentAttendance(month?: number, year?: number) {
  return useQuery({
    queryKey: ['mobile', 'student', 'attendance', month, year],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (month !== undefined) params.append('month', month.toString());
      if (year !== undefined) params.append('year', year.toString());
      const query = params.toString() ? `?${params.toString()}` : '';
      
      const { data } = await apiClient.get(`/mobile/me/student/attendance${query}`);
      return data.data;
    },
  });
}

export function useStudentHomework() {
  return useQuery({
    queryKey: ['mobile', 'student', 'homework'],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/me/student/homework');
      return data.data;
    },
  });
}

export function useStudentExams() {
  return useQuery({
    queryKey: ['mobile', 'student', 'exams'],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/me/student/exams');
      return data.data;
    },
  });
}
