import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStudentHomework } from '../../../lib/hooks/useStudentData';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { ErrorScreen } from '../../../components/ui/ErrorScreen';
import { Badge } from '../../../components/ui/Badge';
import { apiClient } from '../../../lib/api';
import dayjs from 'dayjs';
import * as DocumentPicker from 'expo-document-picker';

export default function HomeworkDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: homeworkList, isLoading, isError, refetch } = useStudentHomework();
  
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const hw = homeworkList?.find((h: any) => h._id === id);

  if (isLoading) return <LoadingScreen />;
  if (isError || !hw) return <ErrorScreen message="Homework not found." onRetry={refetch} />;

  const isOverdue = !hw.mySubmission && dayjs().isAfter(hw.dueDate);
  const isSubmitted = !!hw.mySubmission;
  const status = isSubmitted ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending';
  const statusVariant = isSubmitted ? 'success' : isOverdue ? 'error' : 'warning';

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please attach a file before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('studentRemarks', 'Submitted via mobile app');
      
      const fileData = {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      } as any;
      
      formData.append('attachment', fileData);

      await apiClient.post(`/homework/${id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Homework submitted successfully!');
      setSelectedFile(null);
      refetch();
    } catch (error: any) {
      Alert.alert('Submission Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Custom Header */}
      <View 
        className="px-5 pb-4 flex-row items-center border-b border-zinc-900 bg-zinc-950 z-10"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#e4e4e7" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Homework Details</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-start mb-4">
          <Text className="text-emerald-400 font-bold uppercase tracking-wider">{hw.subject}</Text>
          <Badge label={status} variant={statusVariant} />
        </View>

        <Text className="text-white text-2xl font-extrabold mb-4">{hw.title}</Text>

        <View className="flex-row items-center mb-6">
          <View className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center mr-3 border border-zinc-800">
            <Ionicons name="calendar-outline" size={20} color="#a1a1aa" />
          </View>
          <View>
            <Text className="text-zinc-500 text-xs">Due Date</Text>
            <Text className={`font-bold ${isOverdue && !isSubmitted ? 'text-rose-400' : 'text-white'}`}>
              {dayjs(hw.dueDate).format('dddd, DD MMM YYYY, hh:mm A')}
            </Text>
          </View>
        </View>

        <Text className="text-white text-lg font-bold mb-2">Instructions</Text>
        <Text className="text-zinc-400 leading-6 mb-8">{hw.description}</Text>

        {/* Attachments from teacher */}
        {hw.attachments && hw.attachments.length > 0 && (
          <View className="mb-8">
            <Text className="text-white text-sm font-bold mb-3 uppercase tracking-wider">Reference Materials</Text>
            {hw.attachments.map((att: any, idx: number) => (
              <TouchableOpacity key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-row items-center mb-2">
                <Ionicons name="document-text" size={24} color="#3b82f6" />
                <Text className="text-zinc-300 font-semibold ml-3 flex-1" numberOfLines={1}>{att.name || `Attachment ${idx+1}`}</Text>
                <Ionicons name="download-outline" size={20} color="#a1a1aa" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Submission Section */}
        {isSubmitted ? (
          <View className="bg-emerald-950 border border-emerald-900 rounded-2xl p-5 mb-8">
            <View className="flex-row items-center mb-4">
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text className="text-white font-bold text-lg ml-2">My Submission</Text>
            </View>
            
            <View className="bg-zinc-950 rounded-xl p-4 border border-zinc-900">
              <Text className="text-zinc-500 text-xs mb-1">Submitted On</Text>
              <Text className="text-zinc-300 font-semibold mb-4">
                {dayjs(hw.mySubmission.submittedAt).format('DD MMM YYYY, hh:mm A')}
              </Text>

              {hw.mySubmission.status === 'graded' ? (
                <View>
                  <Text className="text-zinc-500 text-xs mb-1">Feedback from Teacher</Text>
                  <Text className="text-emerald-400 font-bold text-lg mb-1">{hw.mySubmission.grade}</Text>
                  {hw.mySubmission.teacherRemarks && (
                    <Text className="text-zinc-300 italic">"{hw.mySubmission.teacherRemarks}"</Text>
                  )}
                </View>
              ) : (
                <View className="bg-amber-500/20 px-3 py-2 rounded-lg self-start">
                  <Text className="text-amber-500 font-bold text-xs">Awaiting Grade</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="mb-8">
            <Text className="text-white text-lg font-bold mb-4">Submit Homework</Text>
            
            {selectedFile ? (
              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="document" size={24} color="#10b981" />
                  <Text className="text-white font-semibold ml-3 flex-1" numberOfLines={1}>{selectedFile.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFile(null)} className="p-2 bg-rose-500/10 rounded-full">
                  <Ionicons name="close" size={16} color="#fb7185" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                className="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-6 items-center justify-center mb-4"
                onPress={pickDocument}
              >
                <View className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center mb-3">
                  <Ionicons name="cloud-upload-outline" size={24} color="#10b981" />
                </View>
                <Text className="text-white font-bold mb-1">Upload File</Text>
                <Text className="text-zinc-500 text-xs">PDF, JPG or PNG</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              className={`py-4 rounded-xl items-center flex-row justify-center ${selectedFile ? 'bg-emerald-500' : 'bg-emerald-500/30'}`}
              onPress={handleSubmit}
              disabled={!selectedFile || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className={`font-bold text-base mr-2 ${selectedFile ? 'text-white' : 'text-emerald-100/50'}`}>Submit Assignment</Text>
                  <Ionicons name="paper-plane" size={18} color={selectedFile ? 'white' : 'rgba(209, 250, 229, 0.5)'} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
