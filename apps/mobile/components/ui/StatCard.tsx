import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color?: string;
  iconBg?: string;
}

export function StatCard({ icon, value, label, color = '#10b981', iconBg = 'bg-emerald-500/15' }: StatCardProps) {
  return (
    <View className="bg-white border border-slate-100 rounded-2xl p-4 flex-1 min-w-[140px] shadow-sm shadow-slate-200">
      <View className={`w-10 h-10 rounded-xl ${iconBg} items-center justify-center mb-3`}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text className="text-slate-900 text-xl font-bold" style={{ color }}>{value}</Text>
      <Text className="text-slate-500 text-xs mt-0.5">{label}</Text>
    </View>
  );
}
