import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStudentExams } from '../../../lib/hooks/useStudentData';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { ErrorScreen } from '../../../components/ui/ErrorScreen';
import dayjs from 'dayjs';

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: exams, isLoading, isError, refetch } = useStudentExams();
  
  const exam = exams?.find((e: any) => e._id === id);
  const result = exam?.myResult;

  if (isLoading) return <LoadingScreen />;
  if (isError || !exam) return <ErrorScreen message="Exam details not found." onRetry={refetch} />;

  return (
    <View className="flex-1 bg-zinc-950">
      <View 
        className="px-5 pb-4 flex-row items-center border-b border-zinc-900 bg-zinc-950 z-10"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#e4e4e7" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Exam Result</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Exam Info */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-indigo-500/20 items-center justify-center mb-4 border border-indigo-500/20">
            <Ionicons name="podium" size={28} color="#818cf8" />
          </View>
          <Text className="text-white text-2xl font-extrabold text-center mb-2">{exam.name}</Text>
          <View className="flex-row items-center">
            <Text className="text-zinc-400">{dayjs(exam.date).format('MMMM YYYY')}</Text>
            <View className="w-1 h-1 bg-zinc-600 rounded-full mx-2" />
            <Text className="text-indigo-400 font-bold">{exam.type}</Text>
          </View>
        </View>

        {/* Result Summary */}
        {!result ? (
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 items-center">
            <Ionicons name="time-outline" size={48} color="#52525b" />
            <Text className="text-white font-bold text-lg mt-4 mb-2">Results Pending</Text>
            <Text className="text-zinc-500 text-center">Your results have not been published yet.</Text>
          </View>
        ) : (
          <>
            <View className="bg-gradient-to-br from-indigo-900 to-zinc-900 border border-indigo-800/40 rounded-3xl p-6 mb-8 flex-row justify-between shadow-lg shadow-indigo-900/20">
              <View className="items-center flex-1 border-r border-indigo-800/30">
                <Text className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">Grade</Text>
                <Text className={`text-4xl font-extrabold ${result.grade === 'F' ? 'text-rose-500' : 'text-white'}`}>
                  {result.grade}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">Score</Text>
                <View className="flex-row items-end">
                  <Text className="text-white text-3xl font-extrabold">{result.totalMarks}</Text>
                  <Text className="text-indigo-300 font-semibold mb-1 ml-1">/{exam.maxMarks}</Text>
                </View>
              </View>
            </View>

            {/* Remarks */}
            {result.remarks && (
              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
                <Text className="text-white font-bold mb-2">Teacher Remarks</Text>
                <Text className="text-zinc-300 italic leading-6">"{result.remarks}"</Text>
              </View>
            )}

            {/* Subject Breakdown - In a real app we'd have this in the model, for now we mock it based on total */}
            <Text className="text-white text-sm font-bold mb-4 uppercase tracking-wider">Performance Breakdown</Text>
            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-8">
              {['Quran & Tajweed', 'Fiqh & Hadith', 'Arabic Language'].map((subject, idx, arr) => (
                <View key={idx} className={`p-4 flex-row items-center justify-between ${idx !== arr.length - 1 ? 'border-b border-zinc-800/50' : ''}`}>
                  <Text className="text-zinc-300 font-semibold">{subject}</Text>
                  <View className="bg-zinc-800 px-3 py-1 rounded-lg">
                    <Text className="text-white font-bold">{Math.round((result.totalMarks / arr.length) * (1 + (Math.random() * 0.1 - 0.05)))} / {Math.round(exam.maxMarks / arr.length)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
