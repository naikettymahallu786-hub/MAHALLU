import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorScreen({ message = 'An error occurred.', onRetry }: ErrorScreenProps) {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center px-6">
      <View className="w-16 h-16 bg-rose-500/10 rounded-full items-center justify-center mb-4 border border-rose-500/20">
        <Ionicons name="warning-outline" size={28} color="#fb7185" />
      </View>
      <Text className="text-white text-lg font-bold mb-2">Oops!</Text>
      <Text className="text-zinc-400 text-sm text-center mb-6">{message}</Text>
      
      {onRetry && (
        <TouchableOpacity 
          className="bg-zinc-800 px-6 py-3 rounded-xl active:bg-zinc-700"
          onPress={onRetry}
        >
          <Text className="text-white font-bold text-sm">Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
