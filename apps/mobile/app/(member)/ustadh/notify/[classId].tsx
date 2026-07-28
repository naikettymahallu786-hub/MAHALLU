import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUstadhClasses, useSendNotification } from '../../../../lib/hooks/useUstadh';

export default function NotifyScreen() {
  const { classId, studentId } = useLocalSearchParams();
  const router = useRouter();
  
  const { data: classes, isLoading } = useUstadhClasses();
  const { mutateAsync: sendNotification, isPending } = useSendNotification();
  
  const classData = classes?.find((c: any) => c._id === classId);
  const student = studentId ? classData?.students?.find((s: any) => s._id === studentId) : null;

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Required Fields", "Please enter a title and message.");
      return;
    }

    try {
      await sendNotification({
        classId: classId as string,
        studentId: studentId as string | undefined,
        title,
        message
      });
      Alert.alert("Sent", "Notification sent successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to send notification.");
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
      <View className="px-5 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="close" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-slate-900">New Message</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
          
          <View className="bg-white rounded-2xl p-5 mb-6 border border-slate-100 shadow-sm">
            <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">To</Text>
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3">
                <Ionicons name={student ? 'person' : 'people'} size={14} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-slate-900 font-bold text-base">
                  {student ? student.memberId?.name : 'Entire Class'}
                </Text>
                <Text className="text-slate-500 text-xs">
                  {classData?.name}
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-slate-700 font-bold mb-2 ml-1">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Tomorrow's Class Update"
              className="bg-white px-5 py-4 rounded-2xl border border-slate-200 text-slate-900 font-medium"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="mb-8">
            <Text className="text-slate-700 font-bold mb-2 ml-1">Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Write your message here..."
              multiline
              textAlignVertical="top"
              className="bg-white px-5 py-4 rounded-2xl border border-slate-200 text-slate-900 min-h-[160px] font-medium"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={isPending}
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${isPending ? 'bg-slate-300' : 'bg-blue-600'}`}
            style={{
              shadowColor: '#3b82f6',
              shadowOpacity: isPending ? 0 : 0.3,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text className="text-white font-extrabold text-base">Send Message</Text>
              </>
            )}
          </TouchableOpacity>
          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
