import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUstadhClasses } from '../../../../lib/hooks/useUstadh';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function EditTimetableScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: classes, isLoading } = useUstadhClasses();
  
  const classData = classes?.find((c: any) => c._id === id);
  
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    if (classData && classData.schedule) {
      setSchedule(classData.schedule);
    }
  }, [classData]);

  const updateMutation = useMutation({
    mutationFn: (newSchedule: any) => api.put(`/mobile/me/ustadh/classes/${id}/timetable`, { schedule: newSchedule }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ustadh-classes'] });
      Alert.alert('Success', 'Timetable updated successfully!');
      router.back();
    },
    onError: (err: any) => {
      console.error('Update timetable error:', err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.error || 'Failed to update timetable');
    }
  });

  const handleSave = () => {
    // Validate empty subjects or times if needed
    const validSchedule = schedule.filter(s => s.subject.trim() !== '' && s.day !== '');
    updateMutation.mutate(validSchedule);
  };

  const addEntry = () => {
    setSchedule([...schedule, { day: 'Monday', startTime: '09:00 AM', endTime: '10:00 AM', subject: '' }]);
  };

  const removeEntry = (index: number) => {
    const newSched = [...schedule];
    newSched.splice(index, 1);
    setSchedule(newSched);
  };

  const updateEntry = (index: number, field: string, value: string) => {
    const newSched = [...schedule];
    newSched[index] = { ...newSched[index], [field]: value };
    setSchedule(newSched);
  };

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
      <View className="px-5 py-4 flex-row items-center justify-between border-b border-slate-200 bg-white">
        <View className="flex-row items-center flex-1 pr-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-extrabold text-slate-900" numberOfLines={1}>Edit Timetable</Text>
            <Text className="text-slate-500 text-xs mt-0.5">{classData.name}</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={updateMutation.isPending}
          className="bg-emerald-600 px-4 py-2 rounded-xl"
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-bold">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {schedule.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center border border-slate-100 mb-6">
            <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
            <Text className="text-slate-500 font-medium mt-4 text-center">No timetable entries yet. Add one below.</Text>
          </View>
        ) : (
          schedule.map((entry, index) => (
            <Animated.View key={index} entering={FadeInDown.delay(index * 50).springify()}>
              <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-200">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entry #{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeEntry(index)} className="p-1">
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View className="mb-3">
                  <Text className="text-xs font-bold text-slate-700 mb-1">Day</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {DAYS.map(day => (
                      <TouchableOpacity 
                        key={day}
                        onPress={() => updateEntry(index, 'day', day)}
                        className={`mr-2 px-3 py-1.5 rounded-lg border ${entry.day === day ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'}`}
                      >
                        <Text className={`text-xs font-bold ${entry.day === day ? 'text-emerald-700' : 'text-slate-600'}`}>{day.substring(0, 3)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View className="mb-3">
                  <Text className="text-xs font-bold text-slate-700 mb-1">Subject</Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 font-medium"
                    placeholder="e.g. Fiqh"
                    value={entry.subject}
                    onChangeText={(t) => updateEntry(index, 'subject', t)}
                  />
                </View>

                <View className="flex-row">
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-bold text-slate-700 mb-1">Start Time</Text>
                    <TextInput
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 font-medium text-sm"
                      placeholder="09:00 AM"
                      value={entry.startTime}
                      onChangeText={(t) => updateEntry(index, 'startTime', t)}
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-xs font-bold text-slate-700 mb-1">End Time</Text>
                    <TextInput
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 font-medium text-sm"
                      placeholder="10:00 AM"
                      value={entry.endTime}
                      onChangeText={(t) => updateEntry(index, 'endTime', t)}
                    />
                  </View>
                </View>
              </View>
            </Animated.View>
          ))
        )}

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={addEntry}
          className="bg-emerald-50 rounded-2xl p-4 items-center border border-emerald-200 border-dashed mb-10 flex-row justify-center"
        >
          <Ionicons name="add-circle-outline" size={20} color="#059669" className="mr-2" />
          <Text className="text-emerald-700 font-bold ml-2">Add Timetable Entry</Text>
        </TouchableOpacity>
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
