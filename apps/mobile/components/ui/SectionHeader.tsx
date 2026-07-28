import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-3 mt-5">
      <Text className="text-slate-800 text-base font-bold">{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text className="text-emerald-600 text-xs font-semibold">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
