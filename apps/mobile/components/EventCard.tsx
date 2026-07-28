import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

interface EventCardProps {
  title: string;
  date: string;
  venue?: string;
  bannerUri?: string;
  isPaid?: boolean;
  onPress: () => void;
}

export function EventCard({ title, date, venue, bannerUri, isPaid, onPress }: EventCardProps) {
  const eventDate = dayjs(date);
  
  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={onPress}
      className="bg-white rounded-[24px] overflow-hidden mb-4"
      style={{ shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 }}
    >
      {/* Banner */}
      {bannerUri ? (
        <Image 
          source={{ uri: bannerUri }} 
          className="w-full h-36 bg-slate-100"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-24 bg-emerald-50 items-center justify-center">
          <Ionicons name="calendar-outline" size={32} color="#0F6B5C" style={{ opacity: 0.5 }} />
        </View>
      )}

      {/* Content */}
      <View className="p-4 flex-row">
        {/* Date block */}
        <View className="bg-emerald-50 rounded-[16px] w-14 h-16 items-center justify-center mr-4">
          <Text className="text-emerald-700 text-xs font-extrabold uppercase">{eventDate.format('MMM')}</Text>
          <Text className="text-emerald-600 text-xl font-extrabold -mt-1">{eventDate.format('DD')}</Text>
        </View>

        {/* Info */}
        <View className="flex-1 justify-center">
          <View className="flex-row items-start justify-between">
            <Text className="text-slate-900 font-extrabold text-base flex-1 mr-2" numberOfLines={2}>
              {title}
            </Text>
            {isPaid && (
              <View className="bg-amber-100 px-2 py-0.5 rounded flex-shrink-0">
                <Text className="text-amber-600 text-[10px] font-bold">PAID</Text>
              </View>
            )}
          </View>
          
          <View className="flex-row items-center mt-2">
            <Ionicons name="time-outline" size={14} color="#94A3B8" />
            <Text className="text-slate-500 font-medium text-xs ml-1 mr-3">{eventDate.format('hh:mm A')}</Text>
            
            {venue && (
              <>
                <Ionicons name="location-outline" size={14} color="#94A3B8" />
                <Text className="text-slate-500 font-medium text-xs ml-1 flex-1" numberOfLines={1}>{venue}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
