import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ComingSoonScreen() {
  const router = useRouter();
  const { title } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-2 pb-4 flex-row items-center bg-transparent">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 items-center justify-center -ml-2 rounded-full bg-white border border-slate-100 shadow-sm"
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center px-6 pb-20">
        <View className="w-24 h-24 bg-indigo-50 rounded-full items-center justify-center mb-6">
          <Ionicons name="construct-outline" size={40} color="#6366f1" />
        </View>
        <Text className="text-slate-900 text-2xl font-extrabold text-center mb-2">
          {title || 'Coming Soon'}
        </Text>
        <Text className="text-slate-500 text-base text-center leading-relaxed">
          We're working hard to bring you this feature. It will be available in an upcoming update!
        </Text>

        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-8 bg-slate-900 px-8 py-3.5 rounded-xl flex-row items-center"
        >
          <Text className="text-white font-bold mr-2">Go Back</Text>
          <Ionicons name="arrow-back" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
