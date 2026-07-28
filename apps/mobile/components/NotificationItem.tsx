import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface NotificationItemProps {
  title: string;
  body: string;
  date: string;
  isRead?: boolean;
  type?: 'general' | 'payment' | 'event' | 'alert';
  onPress?: () => void;
}

export function NotificationItem({ title, body, date, isRead = false, type = 'general', onPress }: NotificationItemProps) {
  const getIcon = () => {
    switch (type) {
      case 'payment': return { name: 'card-outline', color: '#3b82f6', bg: 'bg-blue-50' };
      case 'event': return { name: 'calendar-outline', color: '#10b981', bg: 'bg-emerald-50' };
      case 'alert': return { name: 'warning-outline', color: '#f59e0b', bg: 'bg-amber-50' };
      default: return { name: 'notifications-outline', color: '#64748b', bg: 'bg-slate-100' };
    }
  };

  const iconConfig = getIcon();

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      className={`p-4 border-b border-slate-100 flex-row items-start ${!isRead ? 'bg-emerald-50/50' : 'bg-white'}`}
    >
      <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 mt-1 ${iconConfig.bg}`}>
        <Ionicons name={iconConfig.name as any} size={18} color={iconConfig.color} />
      </View>
      
      <View className="flex-1">
        <View className="flex-row justify-between items-start mb-1">
          <Text className={`flex-1 text-sm pr-2 ${!isRead ? 'text-slate-900 font-extrabold' : 'text-slate-700 font-bold'}`}>{title}</Text>
          <Text className="text-slate-400 font-bold text-[10px] mt-0.5">{dayjs(date).fromNow(true)}</Text>
        </View>
        <Text className={`${!isRead ? 'text-slate-600' : 'text-slate-500'} text-xs leading-relaxed`} numberOfLines={2}>{body}</Text>
      </View>
      
      {!isRead && (
        <View className="w-2 h-2 rounded-full absolute top-5 right-4" style={{ backgroundColor: '#0F6B5C' }} />
      )}
    </TouchableOpacity>
  );
}
