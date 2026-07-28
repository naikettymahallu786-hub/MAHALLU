import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Card } from '../../../components/ui/Card';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Avatar } from '../../../components/ui/Avatar';

export default function TeacherExamsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  
  // Add Exam Form
  const [form, setForm] = useState({ classId: '', title: '', subjects: '', totalMarks: '', passMark: '' });
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Results Form
  const [resultsForm, setResultsForm] = useState({ studentId: '', marksObtained: '', remarks: '' });
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: exams, isLoading } = useQuery({
    queryKey: ['ustadh-exams'],
    queryFn: () => api.get('/mobile/me/ustadh/exams').then(res => res.data.data),
  });

  const { data: classes } = useQuery({
    queryKey: ['ustadh-classes'],
    queryFn: () => api.get('/mobile/me/ustadh/classes').then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/mobile/me/ustadh/exams', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ustadh-exams'] });
      setShowAddModal(false);
      setForm({ classId: '', title: '', subjects: '', totalMarks: '', passMark: '' });
      Alert.alert('Success', 'Exam created successfully');
    },
    onError: () => Alert.alert('Error', 'Failed to create exam')
  });

  const resultsMutation = useMutation({
    mutationFn: (data: any) => api.put(`/mobile/me/ustadh/exams/${selectedExam._id}/results`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ustadh-exams'] });
      setShowResultsModal(false);
      Alert.alert('Success', 'Results saved successfully');
    },
    onError: () => Alert.alert('Error', 'Failed to save results')
  });

  const handleCreate = () => {
    if (!form.classId || !form.title || !form.subjects || !form.totalMarks || !form.passMark) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    createMutation.mutate({ 
      ...form, 
      date: date.toISOString(),
      subjects: form.subjects.split(',').map(s => s.trim()),
      totalMarks: Number(form.totalMarks),
      passMark: Number(form.passMark)
    });
  };

  const handleSaveResult = () => {
    if (!resultsForm.studentId || !resultsForm.marksObtained) {
      Alert.alert('Error', 'Please enter the marks');
      return;
    }
    
    const marks = Number(resultsForm.marksObtained);
    const isPassed = marks >= (selectedExam.passMark || 0);
    const percentage = (marks / (selectedExam.totalMarks || 100)) * 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    resultsMutation.mutate({ 
      studentId: resultsForm.studentId, 
      marks: [{ subject: selectedExam.subjects?.[0] || 'General', marksObtained: marks, totalMarks: selectedExam.totalMarks }],
      totalObtained: marks,
      percentage,
      grade,
      isPassed,
      remarks: resultsForm.remarks
    });
  };

  const openResultsModal = (exam: any, student: any) => {
    setSelectedExam(exam);
    setSelectedStudent(student);
    
    const existing = exam.results?.find((r: any) => r.studentId?._id === student._id);
    
    setResultsForm({
      studentId: student._id,
      marksObtained: existing?.totalObtained !== undefined ? String(existing.totalObtained) : '',
      remarks: existing?.remarks || ''
    });
    setShowResultsModal(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center justify-between bg-white border-b border-slate-100 shadow-sm shadow-slate-100 z-10">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900">Exams & Results</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)}
          className="bg-emerald-100 w-10 h-10 rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={24} color="#10b981" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
        ) : exams?.length === 0 ? (
          <View className="items-center justify-center py-20 opacity-60">
            <Ionicons name="school-outline" size={64} color="#94a3b8" />
            <Text className="text-slate-500 font-medium text-lg mt-4">No exams scheduled.</Text>
          </View>
        ) : (
          exams?.map((exam: any, index: number) => {
            const cls = classes?.find((c: any) => c._id === exam.classId?._id);
            return (
              <Animated.View key={exam._id} entering={FadeInUp.delay(index * 100).springify()}>
                <Card className="bg-white border border-slate-200 p-5 mb-5 shadow-sm shadow-slate-200">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 pr-4">
                      <Text className="text-lg font-bold text-slate-900 mb-1">{exam.title}</Text>
                      <Text className="text-sm font-medium text-indigo-600">{exam.classId?.name}</Text>
                    </View>
                    <View className="bg-indigo-50 px-3 py-1.5 rounded-lg items-center border border-indigo-100">
                      <Text className="text-indigo-800 text-xs font-bold uppercase tracking-wider mb-0.5">Date</Text>
                      <Text className="text-indigo-900 text-xs font-bold">{new Date(exam.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row flex-wrap mb-4">
                    {exam.subjects?.map((sub: string, i: number) => (
                      <View key={i} className="bg-slate-100 px-3 py-1 rounded-full mr-2 mb-2 border border-slate-200">
                        <Text className="text-slate-600 text-xs font-semibold">{sub}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="flex-row items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                    <View>
                      <Text className="text-xs font-bold text-slate-500 uppercase">Total Marks</Text>
                      <Text className="text-sm font-bold text-slate-900 mt-1">{exam.totalMarks}</Text>
                    </View>
                    <View className="h-6 w-px bg-slate-200 mx-2" />
                    <View>
                      <Text className="text-xs font-bold text-slate-500 uppercase">Pass Mark</Text>
                      <Text className="text-sm font-bold text-slate-900 mt-1">{exam.passMark}</Text>
                    </View>
                    <View className="h-6 w-px bg-slate-200 mx-2" />
                    <View>
                      <Text className="text-xs font-bold text-slate-500 uppercase">Status</Text>
                      <Text className={`text-sm font-bold mt-1 ${exam.isPublished ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {exam.isPublished ? 'Published' : 'Draft'}
                      </Text>
                    </View>
                  </View>

                  {/* Results Section */}
                  <View className="mt-2 pt-4 border-t border-slate-100">
                    <Text className="text-sm font-bold text-slate-800 mb-3">Student Results</Text>
                    {cls?.students?.map((student: any) => {
                      const result = exam.results?.find((r: any) => r.studentId?._id === student._id);
                      return (
                        <View key={student._id} className="flex-row items-center justify-between py-2 border-b border-slate-50 last:border-0">
                          <View className="flex-row items-center flex-1">
                            <Avatar name={student.memberId?.name} size={32} bgColor="bg-slate-100" />
                            <Text className="ml-3 text-slate-700 font-semibold text-sm flex-1" numberOfLines={1}>
                              {student.memberId?.name}
                            </Text>
                          </View>
                          
                          <TouchableOpacity 
                            onPress={() => openResultsModal(exam, student)}
                            className={`px-3 py-1.5 rounded-lg ${result ? (result.isPassed ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200') : 'bg-slate-100'}`}
                          >
                            <Text className={`text-xs font-bold ${result ? (result.isPassed ? 'text-emerald-700' : 'text-red-700') : 'text-slate-600'}`}>
                              {result ? `${result.totalObtained} / ${exam.totalMarks}` : 'Enter Marks'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )
                    })}
                  </View>

                </Card>
              </Animated.View>
            )
          })
        )}
      </ScrollView>

      {/* Add Exam Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', flex: 1 }}>Create Exam</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Class *</Text>
              <View className="flex-row flex-wrap mb-4">
                {classes?.map((cls: any) => (
                  <TouchableOpacity
                    key={cls._id}
                    onPress={() => setForm({...form, classId: cls._id})}
                    className={`px-4 py-2 rounded-xl mr-2 mb-2 border ${form.classId === cls._id ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200'}`}
                  >
                    <Text className={`font-bold ${form.classId === cls._id ? 'text-indigo-700' : 'text-slate-600'}`}>{cls.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Exam Title *</Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 font-medium mb-4"
                placeholder="e.g. Mid Term, Final Exam"
                value={form.title}
                onChangeText={(t) => setForm({...form, title: t})}
              />

              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subjects (Comma separated) *</Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 font-medium mb-4"
                placeholder="Quran, Fiqh, Arabic"
                value={form.subjects}
                onChangeText={(t) => setForm({...form, subjects: t})}
              />

              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Marks *</Text>
                  <TextInput
                    className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 font-medium"
                    placeholder="100"
                    keyboardType="numeric"
                    value={form.totalMarks}
                    onChangeText={(t) => setForm({...form, totalMarks: t})}
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pass Mark *</Text>
                  <TextInput
                    className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 font-medium"
                    placeholder="40"
                    keyboardType="numeric"
                    value={form.passMark}
                    onChangeText={(t) => setForm({...form, passMark: t})}
                  />
                </View>
              </View>

              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Exam Date *</Text>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                className="bg-white border border-slate-200 p-4 rounded-xl flex-row items-center justify-between mb-8"
              >
                <Text className="font-bold text-slate-800">{date.toDateString()}</Text>
                <Ionicons name="calendar-outline" size={20} color="#6366f1" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }}
                />
              )}

              <TouchableOpacity 
                onPress={handleCreate}
                disabled={createMutation.isPending}
                className="bg-indigo-600 p-4 rounded-xl items-center shadow-sm opacity-90"
              >
                {createMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Create Exam</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal visible={showResultsModal} animationType="fade" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', flex: 1 }}>Enter Marks</Text>
              <TouchableOpacity onPress={() => setShowResultsModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View className="bg-slate-50 p-3 rounded-lg mb-4 flex-row items-center">
              <Avatar name={selectedStudent?.memberId?.name} size={32} bgColor="bg-white" />
              <Text className="ml-3 font-bold text-slate-800 flex-1">{selectedStudent?.memberId?.name}</Text>
            </View>

            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Marks Obtained (Out of {selectedExam?.totalMarks})</Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 font-bold text-lg mb-4 text-center"
              placeholder="e.g. 85"
              keyboardType="numeric"
              value={resultsForm.marksObtained}
              onChangeText={(t) => setResultsForm({...resultsForm, marksObtained: t})}
            />

            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks (Optional)</Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 font-medium mb-6"
              placeholder="Excellent progress..."
              multiline
              numberOfLines={2}
              value={resultsForm.remarks}
              onChangeText={(t) => setResultsForm({...resultsForm, remarks: t})}
            />

            <TouchableOpacity 
              onPress={handleSaveResult}
              disabled={resultsMutation.isPending}
              className="bg-indigo-600 p-4 rounded-xl items-center"
            >
              {resultsMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Save Results</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
