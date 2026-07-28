import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { useLanguageStore } from '../../../lib/store/languageStore';
import { t } from '../../../lib/i18n';

export default function PropertiesScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mobile-properties'],
    queryFn: () => api.get('/mobile/properties').then(r => r.data.data),
  });

  const properties = data?.properties || [];
  const rentalHistory = data?.rentalHistory || [];
  
  const equipment = properties.filter((p: any) => p.type === 'equipment');
  const venues = properties.filter((p: any) => p.type !== 'equipment');

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-emerald-600 px-6 pt-16 pb-6 rounded-b-3xl shadow-sm z-10">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">{t('rentalsTitle', language)}</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-6"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#059669" className="mt-10" />
        ) : (
          <>
            <Text className="font-bold text-slate-800 text-lg mb-4">{t('availableEquipment', language)}</Text>
            
            {equipment.length === 0 ? (
              <View className="bg-white p-6 rounded-2xl items-center shadow-sm mb-6">
                <Text className="text-slate-500 text-center text-sm">{t('noEquipmentDesc', language)}</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
                {equipment.map((item: any) => (
                  <TouchableOpacity 
                    key={item._id}
                    onPress={() => router.push(`/(member)/properties/request?id=${item._id}&name=${encodeURIComponent(item.name)}&max=${item.availableQuantity}`)}
                    className="bg-white p-4 rounded-2xl mr-4 shadow-sm border border-slate-100 w-48"
                  >
                    <View className="w-12 h-12 bg-indigo-50 rounded-full items-center justify-center mb-3">
                      <Ionicons name="cube-outline" size={24} color="#4f46e5" />
                    </View>
                    <Text className="font-bold text-slate-800 text-base" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-emerald-600 font-semibold text-xs mt-1">{item.availableQuantity} {language === 'en' ? 'Available' : 'ലഭ്യമാണ്'}</Text>
                    <Text className="text-slate-500 text-xs mt-1">{item.rentAmount ? `₹${item.rentAmount} / unit` : (language === 'en' ? 'Free to use' : 'സൗജന്യമാണ്')}</Text>
                    
                    <View className="mt-3 bg-indigo-50 py-1.5 rounded-lg items-center">
                      <Text className="text-indigo-600 font-bold text-xs">{t('request', language)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text className="font-bold text-slate-800 text-lg mb-4">{t('rentalHistory', language)}</Text>
            
            {rentalHistory.length === 0 ? (
              <View className="bg-white p-8 rounded-2xl items-center shadow-sm">
                <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-3">
                  <Ionicons name="time-outline" size={32} color="#94a3b8" />
                </View>
                <Text className="font-bold text-slate-700 text-base">{t('noRentalsYet', language)}</Text>
              </View>
            ) : (
              rentalHistory.map((req: any) => (
                <View key={req._id} className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-slate-100">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="font-bold text-slate-800 text-base flex-1" numberOfLines={1}>{req.propertyId?.name || 'Item'}</Text>
                    <View className={`px-2 py-1 rounded-md ml-2 ${req.status === 'PENDING' ? 'bg-amber-100' : req.status === 'APPROVED' ? 'bg-emerald-100' : req.status === 'RETURNED' ? 'bg-slate-100' : 'bg-red-100'}`}>
                      <Text className={`text-[10px] font-bold ${req.status === 'PENDING' ? 'text-amber-700' : req.status === 'APPROVED' ? 'text-emerald-700' : req.status === 'RETURNED' ? 'text-slate-600' : 'text-red-700'}`}>
                        {req.status}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-slate-500 text-sm">{t('quantity', language)}: {req.quantityRequested}</Text>
                  {req.startDate && (
                    <Text className="text-slate-500 text-xs mt-1">{t('date', language)}: {new Date(req.startDate).toLocaleDateString()}</Text>
                  )}
                </View>
              ))
            )}
          </>
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
