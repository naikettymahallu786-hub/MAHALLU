import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUstadhClasses, useMarkAttendance } from '../../../../lib/hooks/useUstadh';
import { Avatar } from '../../../../components/ui/Avatar';
import dayjs from 'dayjs';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export default function MarkAttendanceScreen() {
  const { classId } = useLocalSearchParams();
  const router = useRouter();
  
  const { data: classes, isLoading } = useUstadhClasses();
  const { mutateAsync: markAttendance, isPending } = useMarkAttendance();
  
  const classData = classes?.find((c: any) => c._id === classId);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

  const toggleStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = async () => {
    if (!classData || classData.students.length === 0) return;
    
    // Default anyone unmarked to 'present' for speed
    const records = classData.students.map((s: any) => ({
      studentId: s._id,
      status: attendance[s._id] || 'present',
    }));

    try {
      await markAttendance({
        classId: classData._id,
        date: new Date().toISOString(),
        records
      });
      Alert.alert("Success", "Attendance saved successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save attendance.");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <View className="px-5 py-4 flex-row items-center justify-between border-b border-slate-200 bg-white">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-extrabold text-slate-900">Attendance</Text>
            <Text className="text-slate-500 text-xs mt-0.5">{dayjs().format('dddd, DD MMM YYYY')}</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isPending}
          className={`px-4 py-2 rounded-xl ${isPending ? 'bg-slate-200' : 'bg-emerald-600'}`}
        >
          {isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-bold text-sm">Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <View className="bg-blue-50 p-4 rounded-xl mb-6 flex-row items-start">
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text className="text-blue-800 text-sm ml-2 flex-1 leading-5">
            Mark attendance using the buttons: Green Tick for Present, Red Cross for Absent, and Yellow Clock for Late.
          </Text>
        </View>
        
        {classData?.students?.map((student: any) => {
          const member = student.memberId;
          const status = attendance[student._id] || 'present';

          return (
            <View key={student._id} className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-slate-100 shadow-sm">
              <Avatar uri={member?.photo?.url} name={member?.name} size={42} />
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-slate-900" numberOfLines={1}>{member?.name}</Text>
              </View>
              
              <View className="flex-row items-center gap-2">
                {/* Present Tick Icon */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => toggleStatus(student._id, 'present')}
                  className={`w-9 h-9 rounded-full items-center justify-center border ${
                    status === 'present' 
                      ? 'bg-emerald-500 border-emerald-500' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Ionicons 
                    name="checkmark" 
                    size={18} 
                    color={status === 'present' ? '#fff' : '#10b981'} 
                  />
                </TouchableOpacity>

                {/* Absent Cross Icon */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => toggleStatus(student._id, 'absent')}
                  className={`w-9 h-9 rounded-full items-center justify-center border ${
                    status === 'absent' 
                      ? 'bg-rose-500 border-rose-500' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Ionicons 
                    name="close" 
                    size={18} 
                    color={status === 'absent' ? '#fff' : '#f43f5e'} 
                  />
                </TouchableOpacity>

                {/* Late Clock Icon */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => toggleStatus(student._id, 'late')}
                  className={`w-9 h-9 rounded-full items-center justify-center border ${
                    status === 'late' 
                      ? 'bg-amber-500 border-amber-500' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Ionicons 
                    name="time" 
                    size={18} 
                    color={status === 'late' ? '#fff' : '#f59e0b'} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
