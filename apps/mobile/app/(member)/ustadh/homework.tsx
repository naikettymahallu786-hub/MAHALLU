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

export default function TeacherHomeworkScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<any>(null);
  
  // Add Homework Form
  const [form, setForm] = useState({ classId: '', subject: '', title: '', description: '' });
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Grade Form
  const [gradeForm, setGradeForm] = useState({ studentId: '', grade: '', feedback: '' });

  const { data: homeworks, isLoading } = useQuery({
    queryKey: ['ustadh-homework'],
    queryFn: () => api.get('/mobile/me/ustadh/homework').then(res => res.data.data),
  });

  const { data: classes } = useQuery({
    queryKey: ['ustadh-classes'],
    queryFn: () => api.get('/mobile/me/ustadh/classes').then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/mobile/me/ustadh/homework', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ustadh-homework'] });
      setShowAddModal(false);
      setForm({ classId: '', subject: '', title: '', description: '' });
      Alert.alert('Success', 'Homework assigned successfully');
    },
    onError: () => Alert.alert('Error', 'Failed to assign homework')
  });

  const gradeMutation = useMutation({
    mutationFn: (data: any) => api.put(`/mobile/me/ustadh/homework/${selectedHomework._id}/grade`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ustadh-homework'] });
      setShowGradeModal(false);
      Alert.alert('Success', 'Grade saved successfully');
    },
    onError: () => Alert.alert('Error', 'Failed to save grade')
  });

  const handleCreate = () => {
    if (!form.classId || !form.subject || !form.title) {
      Alert.alert('Error', 'Please fill in all required fields (Class, Subject, Title)');
      return;
    }
    createMutation.mutate({ ...form, dueDate: dueDate.toISOString() });
  };

  const handleGrade = () => {
    if (!gradeForm.studentId || !gradeForm.grade) {
      Alert.alert('Error', 'Please enter a grade');
      return;
    }
    gradeMutation.mutate({ studentId: gradeForm.studentId, grade: Number(gradeForm.grade), feedback: gradeForm.feedback });
  };

  const openGradeModal = (hw: any, student: any) => {
    setSelectedHomework(hw);
    
    // Check if submission exists
    const existing = hw.submissions?.find((s: any) => s.studentId?._id === student._id);
    
    setGradeForm({
      studentId: student._id,
      grade: existing?.grade !== undefined ? String(existing.grade) : '',
      feedback: existing?.feedback || ''
    });
    setShowGradeModal(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center justify-between bg-white border-b border-slate-100 shadow-sm shadow-slate-100 z-10">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900">Homework</Text>
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
        ) : homeworks?.length === 0 ? (
          <View className="items-center justify-center py-20 opacity-60">
            <Ionicons name="document-text-outline" size={64} color="#94a3b8" />
            <Text className="text-slate-500 font-medium text-lg mt-4">No homework assigned yet.</Text>
          </View>
        ) : (
          homeworks?.map((hw: any, index: number) => {
            const cls = classes?.find((c: any) => c._id === hw.classId?._id);
            return (
              <Animated.View key={hw._id} entering={FadeInUp.delay(index * 100).springify()}>
                <Card className="bg-white border border-slate-200 p-5 mb-5 shadow-sm shadow-slate-200">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 pr-4">
                      <Text className="text-lg font-bold text-slate-900 mb-1">{hw.title}</Text>
                      <Text className="text-sm font-medium text-emerald-600">{hw.classId?.name} • {hw.subject}</Text>
                    </View>
                    <View className="bg-amber-100 px-3 py-1.5 rounded-lg items-center">
                      <Text className="text-amber-800 text-xs font-bold uppercase tracking-wider mb-0.5">Due</Text>
                      <Text className="text-amber-900 text-xs font-bold">{new Date(hw.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</Text>
                    </View>
                  </View>
                  
                  {hw.description && (
                    <Text className="text-slate-600 text-sm mt-2 mb-4 leading-relaxed">{hw.description}</Text>
                  )}

                  {/* Submissions Section */}
                  <View className="mt-4 pt-4 border-t border-slate-100">
                    <Text className="text-sm font-bold text-slate-800 mb-3">Students & Grading</Text>
                    {cls?.students?.map((student: any) => {
                      const submission = hw.submissions?.find((s: any) => s.studentId?._id === student._id);
                      return (
                        <View key={student._id} className="flex-row items-center justify-between py-2 border-b border-slate-50 last:border-0">
                          <View className="flex-row items-center flex-1">
                            <Avatar name={student.memberId?.name} size={32} bgColor="bg-slate-100" />
                            <Text className="ml-3 text-slate-700 font-semibold text-sm flex-1" numberOfLines={1}>
                              {student.memberId?.name}
                            </Text>
                          </View>
                          
                          <TouchableOpacity 
                            onPress={() => openGradeModal(hw, student)}
                            className={`px-3 py-1.5 rounded-lg ${submission?.grade !== undefined ? 'bg-emerald-100' : 'bg-slate-100'}`}
                          >
                            <Text className={`text-xs font-bold ${submission?.grade !== undefined ? 'text-emerald-700' : 'text-slate-600'}`}>
                              {submission?.grade !== undefined ? `${submission.grade} Pts` : 'Grade'}
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

      {/* Add Homework Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', flex: 1 }}>Assign Homework</Text>
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
                    className={`px-4 py-2 rounded-xl mr-2 mb-2 border ${form.classId === cls._id ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'}`}
                  >
                    <Text className={`font-bold ${form.classId === cls._id ? 'text-emerald-700' : 'text-slate-600'}`}>{cls.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject *</Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 font-medium mb-4"
                placeholder="e.g. Fiqh, Quran"
                value={form.subject}
                onChangeText={(t) => setForm({...form, subject: t})}
              />

              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title *</Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 font-medium mb-4"
                placeholder="Homework title"
                value={form.title}
                onChangeText={(t) => setForm({...form, title: t})}
              />

              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 font-medium mb-4"
                placeholder="Instructions..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={form.description}
                onChangeText={(t) => setForm({...form, description: t})}
              />

              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date *</Text>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                className="bg-white border border-slate-200 p-4 rounded-xl flex-row items-center justify-between mb-8"
              >
                <Text className="font-bold text-slate-800">{dueDate.toDateString()}</Text>
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  onChange={(e, d) => { setShowDatePicker(false); if(d) setDueDate(d); }}
                />
              )}

              <TouchableOpacity 
                onPress={handleCreate}
                disabled={createMutation.isPending}
                className="bg-emerald-600 p-4 rounded-xl items-center shadow-sm opacity-90"
              >
                {createMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Assign</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Grade Modal */}
      <Modal visible={showGradeModal} animationType="fade" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', flex: 1 }}>Grade Student</Text>
              <TouchableOpacity onPress={() => setShowGradeModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Points / Grade</Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-bold text-lg mb-4 text-center"
              placeholder="e.g. 10"
              keyboardType="numeric"
              value={gradeForm.grade}
              onChangeText={(t) => setGradeForm({...gradeForm, grade: t})}
            />

            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Feedback (Optional)</Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 font-medium mb-6"
              placeholder="Good job..."
              multiline
              numberOfLines={2}
              value={gradeForm.feedback}
              onChangeText={(t) => setGradeForm({...gradeForm, feedback: t})}
            />

            <TouchableOpacity 
              onPress={handleGrade}
              disabled={gradeMutation.isPending}
              className="bg-emerald-600 p-4 rounded-xl items-center"
            >
              {gradeMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Save Grade</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
