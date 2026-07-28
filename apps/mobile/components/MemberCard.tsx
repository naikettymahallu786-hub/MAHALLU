import React from 'react';
import { View, Text } from 'react-native';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';

interface MemberCardProps {
  name: string;
  memberId: string;
  photo?: string | null;
  phone?: string;
  role?: string;
  mahalluName?: string;
  qrCode?: string;
  compact?: boolean;
}

export function MemberCard({ name, memberId, photo, phone, role, mahalluName, compact = false }: MemberCardProps) {
  if (compact) {
    return (
      <View className="bg-white border border-slate-100 rounded-2xl p-4 flex-row items-center shadow-sm shadow-slate-200">
        <Avatar uri={photo} name={name} size={48} />
        <View className="ml-3 flex-1">
          <Text className="text-slate-800 font-bold text-sm">{name}</Text>
          <Text className="text-slate-500 text-xs mt-0.5">{memberId}</Text>
        </View>
        {role && <Badge label={role} variant="info" />}
      </View>
    );
  }

  return (
    <View className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md shadow-slate-200">
      {/* Header strip */}
      <View className="bg-emerald-500 px-5 py-3 flex-row items-center justify-between">
        <Text className="text-white text-xs font-bold uppercase tracking-wider">
          Digital Member Card
        </Text>
        <Text className="text-emerald-100 text-[10px] font-semibold">{mahalluName || 'Mahallu'}</Text>
      </View>

      {/* Card body */}
      <View className="p-5 bg-gradient-to-br from-emerald-50 to-white">
        <View className="flex-row items-center">
          <Avatar uri={photo} name={name} size={64} bgColor="bg-emerald-100" />
          <View className="ml-4 flex-1">
            <Text className="text-slate-800 text-lg font-bold">{name}</Text>
            <Text className="text-emerald-600 text-xs font-bold mt-0.5">{memberId}</Text>
            {phone && <Text className="text-slate-500 text-xs mt-1">{phone}</Text>}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="bg-slate-50 px-5 py-3 flex-row items-center justify-between border-t border-slate-100">
        <Text className="text-slate-400 text-[10px] font-bold">Verified Member</Text>
        <View className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
      </View>
    </View>
  );
}
