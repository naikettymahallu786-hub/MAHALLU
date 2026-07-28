import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}

export function EmptyState({ icon = 'folder-open-outline', title, message }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-12 px-6">
      <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-4 border border-slate-200">
        <Ionicons name={icon} size={28} color="#94a3b8" />
      </View>
      <Text className="text-slate-500 text-sm font-semibold text-center">{title}</Text>
      {message && <Text className="text-slate-400 text-xs text-center mt-1">{message}</Text>}
    </View>
  );
}
