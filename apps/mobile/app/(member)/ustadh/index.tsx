import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUstadhClasses } from '../../../lib/hooks/useUstadh';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

export default function TeacherWorkspaceScreen() {
  const router = useRouter();
  const { data: classes, isLoading } = useUstadhClasses();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <View className="px-5 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-slate-900">Teacher Workspace</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify()} className="flex-row justify-between mb-8">
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push(`/(member)/ustadh/homework`)}
            className="flex-1 bg-amber-50 rounded-2xl p-4 items-center mr-3 border border-amber-100"
          >
            <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mb-2">
              <Ionicons name="document-text" size={24} color="#d97706" />
            </View>
            <Text className="text-amber-800 font-bold text-sm">Homework</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push(`/(member)/ustadh/exams`)}
            className="flex-1 bg-indigo-50 rounded-2xl p-4 items-center ml-3 border border-indigo-100"
          >
            <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mb-2">
              <Ionicons name="school" size={24} color="#4f46e5" />
            </View>
            <Text className="text-indigo-800 font-bold text-sm">Exams</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text className="text-slate-500 font-bold uppercase text-[11px] tracking-wider mb-4">My Assigned Classes</Text>
        {isLoading ? (
          <ActivityIndicator color="#10b981" className="mt-10" />
        ) : classes?.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center mt-4">
            <Ionicons name="school-outline" size={48} color="#94a3b8" />
            <Text className="text-slate-500 font-medium mt-4 text-center">You are not assigned to any classes yet.</Text>
          </View>
        ) : (
          classes?.map((c: any, index: number) => (
            <Animated.View key={c._id} entering={FadeInDown.delay(index * 100).springify()}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/(member)/ustadh/class/${c._id}`)}
                className="bg-white rounded-[20px] p-5 mb-4 flex-row items-center border border-slate-100"
                style={{
                  shadowColor: '#0f172a',
                  shadowOpacity: 0.04,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 2,
                }}
              >
                <View className="w-14 h-14 rounded-full bg-emerald-50 items-center justify-center mr-4">
                  <Ionicons name="book" size={24} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-extrabold text-slate-900">{c.name}</Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="people-outline" size={14} color="#64748b" />
                    <Text className="text-slate-500 text-sm ml-1.5">{c.students?.length || 0} Students</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
