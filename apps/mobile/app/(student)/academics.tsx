import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudentHomework, useStudentExams, useStudentAttendance } from '../../lib/hooks/useStudentData';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge, getAttendanceVariant } from '../../components/ui/Badge';
import dayjs from 'dayjs';

export default function AcademicsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'homework' | 'exams' | 'attendance'>('homework');
  
  const { data: homework, isLoading: hwLoading, refetch: refetchHw } = useStudentHomework();
  const { data: exams, isLoading: examsLoading, refetch: refetchExams } = useStudentExams();
  const { data: attendance, isLoading: attLoading, refetch: refetchAtt } = useStudentAttendance();

  const isLoading = hwLoading || examsLoading || attLoading;

  const handleRefresh = () => {
    if (activeTab === 'homework') refetchHw();
    else if (activeTab === 'exams') refetchExams();
    else refetchAtt();
  };

  const renderHomework = () => {
    if (!homework || homework.length === 0) {
      return <EmptyState icon="document-text-outline" title="No Homework" message="You don't have any homework assigned right now." />;
    }

    return (
      <View className="space-y-4">
        {homework.map((hw: any) => {
          const isOverdue = !hw.mySubmission && dayjs().isAfter(hw.dueDate);
          const isSubmitted = !!hw.mySubmission;
          
          return (
            <TouchableOpacity 
              key={hw._id}
              activeOpacity={0.8}
              onPress={() => router.push(`/(student)/homework/${hw._id}`)}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm shadow-slate-200"
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">{hw.subject}</Text>
                {isSubmitted ? (
                  <Badge label="Submitted" variant="success" />
                ) : isOverdue ? (
                  <Badge label="Overdue" variant="error" />
                ) : (
                  <Badge label="Pending" variant="warning" />
                )}
              </View>
              
              <Text className="text-slate-800 font-bold text-base mb-1">{hw.title}</Text>
              
              <View className="flex-row items-center mt-2">
                <Ionicons name="time-outline" size={14} color={isOverdue && !isSubmitted ? "#e11d48" : "#94a3b8"} />
                <Text className={`text-xs ml-1 font-semibold ${isOverdue && !isSubmitted ? 'text-rose-600' : 'text-slate-500'}`}>
                  Due: {dayjs(hw.dueDate).format('DD MMM, hh:mm A')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderExams = () => {
    if (!exams || exams.length === 0) {
      return <EmptyState icon="podium-outline" title="No Exams" message="No exams or results available yet." />;
    }

    return (
      <View className="space-y-4">
        {exams.map((exam: any) => {
          const result = exam.myResult;
          
          return (
            <TouchableOpacity 
              key={exam._id}
              activeOpacity={0.8}
              onPress={() => router.push(`/(student)/exams/${exam._id}`)}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm shadow-slate-200"
            >
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <Text className="text-slate-800 font-bold text-lg">{exam.name}</Text>
                  <Text className="text-slate-500 text-xs mt-0.5">{dayjs(exam.date).format('DD MMM YYYY')}</Text>
                </View>
                <View className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                  <Text className="text-emerald-600 font-bold">{exam.type}</Text>
                </View>
              </View>
              
              {result ? (
                <View className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex-row justify-between items-center mt-2">
                  <View>
                    <Text className="text-slate-400 text-[10px] uppercase font-bold mb-0.5">Grade</Text>
                    <Text className={`text-xl font-extrabold ${result.grade === 'F' ? 'text-rose-600' : 'text-slate-900'}`}>
                      {result.grade}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-slate-400 text-[10px] uppercase font-bold mb-0.5">Total Marks</Text>
                    <Text className="text-slate-800 font-bold text-sm">{result.totalMarks} / {exam.maxMarks}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </View>
              ) : (
                <View className="bg-slate-50 rounded-xl p-3 border border-slate-100 items-center mt-2">
                  <Text className="text-slate-500 text-xs font-semibold">Results Pending</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderAttendance = () => {
    if (!attendance || attendance.length === 0) {
      return <EmptyState icon="calendar-outline" title="No Attendance" message="No attendance records found for this month." />;
    }

    const presentCount = attendance.filter((a: any) => a.status === 'present' || a.status === 'late').length;
    const totalCount = attendance.length;
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    return (
      <View>
        <View className="bg-white border border-slate-100 rounded-2xl p-6 items-center mb-6 shadow-sm shadow-slate-200">
          <Text className="text-slate-500 text-sm font-semibold mb-2">This Month's Attendance</Text>
          <View className="relative w-32 h-32 items-center justify-center mb-2">
            <View className={`w-32 h-32 rounded-full border-8 ${percentage >= 75 ? 'border-emerald-500' : percentage >= 50 ? 'border-amber-500' : 'border-rose-500'} opacity-20 absolute`} />
            <View className={`w-32 h-32 rounded-full border-8 ${percentage >= 75 ? 'border-emerald-500' : percentage >= 50 ? 'border-amber-500' : 'border-rose-500'} border-l-transparent border-b-transparent absolute`} style={{ transform: [{ rotate: '45deg' }] }} />
            <Text className="text-slate-800 text-4xl font-extrabold">{percentage}%</Text>
          </View>
          <Text className="text-slate-500 text-xs">{presentCount} out of {totalCount} days present</Text>
        </View>

        <Text className="text-slate-800 text-sm font-bold mb-3 uppercase tracking-wider">Recent Records</Text>
        <View className="space-y-2 mb-8">
          {attendance.slice().reverse().map((record: any) => (
            <View key={record._id} className="bg-white border border-slate-100 rounded-xl p-4 flex-row justify-between items-center shadow-sm shadow-slate-200">
              <View>
                <Text className="text-slate-800 font-bold">{dayjs(record.date).format('dddd, DD MMM')}</Text>
                {record.remarks && <Text className="text-slate-500 text-xs mt-0.5">{record.remarks}</Text>}
              </View>
              <Badge label={record.status} variant={getAttendanceVariant(record.status)} />
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-5 pt-2 pb-2 bg-white">
        <Text className="text-slate-900 text-2xl font-extrabold">Academics</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-5 pb-2 border-b border-slate-200 bg-white">
        <TouchableOpacity 
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'homework' ? 'border-emerald-500' : 'border-transparent'}`}
          onPress={() => setActiveTab('homework')}
        >
          <Text className={`font-bold ${activeTab === 'homework' ? 'text-emerald-600' : 'text-slate-500'}`}>Homework</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'exams' ? 'border-emerald-500' : 'border-transparent'}`}
          onPress={() => setActiveTab('exams')}
        >
          <Text className={`font-bold ${activeTab === 'exams' ? 'text-emerald-600' : 'text-slate-500'}`}>Exams</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'attendance' ? 'border-emerald-500' : 'border-transparent'}`}
          onPress={() => setActiveTab('attendance')}
        >
          <Text className={`font-bold ${activeTab === 'attendance' ? 'text-emerald-600' : 'text-slate-500'}`}>Attendance</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#10b981" />}
      >
        {activeTab === 'homework' && renderHomework()}
        {activeTab === 'exams' && renderExams()}
        {activeTab === 'attendance' && renderAttendance()}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
