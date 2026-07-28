import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUstadhClasses } from '../../../../lib/hooks/useUstadh';
import { Avatar } from '../../../../components/ui/Avatar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function ClassDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: classes, isLoading } = useUstadhClasses();

  const classData = classes?.find((c: any) => c._id === id);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  if (!classData) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center p-5">
        <Text className="text-slate-500">Class not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-4 py-2 bg-emerald-100 rounded-lg">
          <Text className="text-emerald-700 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <View className="px-5 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-extrabold text-slate-900">{classData.name}</Text>
          <Text className="text-slate-500 text-xs mt-0.5">{classData.students?.length || 0} Students Assigned</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="flex-row justify-between mb-8">
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push(`/(member)/ustadh/attendance/${classData._id}`)}
            className="flex-1 bg-emerald-50 rounded-2xl p-4 items-center mr-3 border border-emerald-100"
          >
            <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center mb-2">
              <Ionicons name="checkmark-done-circle" size={26} color="#10b981" />
            </View>
            <Text className="text-emerald-800 font-bold text-sm">Mark Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push(`/(member)/ustadh/notify/${classData._id}`)}
            className="flex-1 bg-blue-50 rounded-2xl p-4 items-center ml-3 border border-blue-100"
          >
            <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-2">
              <Ionicons name="megaphone" size={24} color="#3b82f6" />
            </View>
            <Text className="text-blue-800 font-bold text-sm">Send Notice</Text>
          </TouchableOpacity>
        </Animated.View>

        {classData.schedule && (
          <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-500 font-bold uppercase text-[11px] tracking-wider">Timetable</Text>
              <TouchableOpacity onPress={() => router.push(`/(member)/ustadh/timetable/${classData._id}`)}>
                <Text className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Edit</Text>
              </TouchableOpacity>
            </View>
            
            {classData.schedule.length > 0 ? (
              <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {classData.schedule.map((sch: any, idx: number) => (
                  <View key={idx} className={`flex-row items-center p-4 ${idx !== classData.schedule.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <View className="w-20">
                      <Text className="text-slate-800 font-extrabold capitalize">{sch.day}</Text>
                    </View>
                    <View className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <Text className="text-emerald-700 font-bold text-sm mb-1">{sch.subject}</Text>
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={12} color="#64748b" />
                        <Text className="text-slate-500 text-xs font-medium ml-1">
                          {sch.startTime} - {sch.endTime}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-slate-100 rounded-2xl p-6 items-center border border-slate-200 border-dashed">
                <Ionicons name="calendar-outline" size={32} color="#94a3b8" />
                <Text className="text-slate-500 font-medium text-xs mt-2">No timetable configured</Text>
                <TouchableOpacity onPress={() => router.push(`/(member)/ustadh/timetable/${classData._id}`)} className="mt-3 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
                  <Text className="text-slate-700 font-bold text-xs">Setup Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

        <Text className="text-slate-500 font-bold uppercase text-[11px] tracking-wider mb-4">Student List</Text>
        
        {classData.students?.length === 0 ? (
          <Text className="text-slate-500 text-center py-8">No students assigned to this class.</Text>
        ) : (
          classData.students?.map((student: any, index: number) => {
            const member = student.memberId;
            return (
              <Animated.View key={student._id} entering={FadeInUp.delay(index * 50 + 200).springify()}>
                <View className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-slate-100">
                  <Avatar uri={member?.photo?.url} name={member?.name} size={48} />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-bold text-slate-900">{member?.name}</Text>
                    <Text className="text-slate-500 text-xs mt-0.5">{member?.phone || 'No phone'}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => router.push({ pathname: `/(member)/ustadh/notify/[classId]`, params: { classId: classData._id, studentId: student._id } })}
                    className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center"
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })
        )}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
