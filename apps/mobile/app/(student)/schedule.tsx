import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useStudentProfile } from '../../lib/hooks/useStudentData';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { EmptyState } from '../../components/ui/EmptyState';
import { Avatar } from '../../components/ui/Avatar';

export default function ScheduleScreen() {
  const { data: profile, isLoading: profileLoading } = useStudentProfile();
  
  // Fetch teachers directory
  const { data: teachersData, isLoading: teachersLoading, refetch } = useQuery({
    queryKey: ['mobile', 'teachers'],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/teachers');
      return data.data;
    },
  });

  const isLoading = profileLoading || teachersLoading;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-5 pt-2 pb-4 border-b border-slate-200 bg-white">
        <Text className="text-slate-900 text-2xl font-extrabold">Schedule & Teachers</Text>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#10b981" />}
      >
        {/* Class Info */}
        <View className="bg-white border border-slate-100 rounded-2xl p-5 mb-8 shadow-sm shadow-slate-200">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center mr-3 border border-emerald-100">
              <Ionicons name="school" size={20} color="#10b981" />
            </View>
            <View>
              <Text className="text-slate-800 font-bold text-lg">{profile?.classId?.name || 'Class Info'}</Text>
              <Text className="text-slate-500 text-xs">{profile?.madrasaId?.name}</Text>
            </View>
          </View>
          
          {profile?.classId?.schedule && profile.classId.schedule.length > 0 ? (
            <View className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden mt-4">
              {profile.classId.schedule.map((sch: any, idx: number) => (
                <View key={idx} className={`flex-row items-center p-3 ${idx !== profile.classId.schedule.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <View className="w-16">
                    <Text className="text-slate-800 font-extrabold text-xs">{sch.day.substring(0, 3)}</Text>
                  </View>
                  <View className="flex-1 px-2 border-l border-slate-200">
                    <Text className="text-emerald-700 font-bold text-sm mb-0.5">{sch.subject}</Text>
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={10} color="#64748b" />
                      <Text className="text-slate-500 text-[10px] font-medium ml-1">
                        {sch.startTime} - {sch.endTime}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-4 items-center">
              <Ionicons name="calendar-outline" size={24} color="#94a3b8" />
              <Text className="text-slate-500 text-xs mt-2 font-medium">No timetable published yet</Text>
            </View>
          )}
        </View>

        {/* Teachers Directory */}
        <Text className="text-slate-800 text-sm font-bold mb-4 uppercase tracking-wider">Teachers Directory</Text>
        
        {!teachersData || teachersData.length === 0 ? (
          <EmptyState icon="people-outline" title="No Teachers" message="Teacher directory is currently empty." />
        ) : (
          <View className="space-y-4 mb-8">
            {teachersData.map((teacher: any) => (
              <View key={teacher._id} className="bg-white border border-slate-100 rounded-2xl p-4 flex-row items-center shadow-sm shadow-slate-200">
                <Avatar 
                  uri={teacher.memberId?.photo?.url} 
                  name={teacher.memberId?.name || 'Teacher'} 
                  size={50} 
                  bgColor="bg-slate-100"
                />
                <View className="ml-4 flex-1">
                  <Text className="text-slate-800 font-bold text-base">{teacher.memberId?.name}</Text>
                  
                  {teacher.subjects && teacher.subjects.length > 0 ? (
                    <Text className="text-emerald-600 font-medium text-xs mt-0.5" numberOfLines={1}>
                      {teacher.subjects.join(', ')}
                    </Text>
                  ) : (
                    <Text className="text-slate-500 text-xs mt-0.5 font-medium">Teacher</Text>
                  )}
                  
                  {teacher.qualification && (
                    <Text className="text-slate-400 text-[10px] mt-1 font-bold">{teacher.qualification}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
