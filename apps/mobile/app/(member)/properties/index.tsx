import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { useLanguageStore } from '../../../lib/store/languageStore';
import { t } from '../../../lib/i18n';

const TEAL = '#0F6B5C';
const TEAL_DARK = '#0B4A42';
const CREAM = '#FBF8F2';

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
    <View className="flex-1" style={{ backgroundColor: CREAM }}>
      {/* Header */}
      <View className="px-6 pt-14 pb-6 rounded-b-[28px] shadow-sm z-10" style={{ backgroundColor: TEAL_DARK }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-white">{t('rentalsTitle', language)}</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-5"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={TEAL} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={TEAL} className="mt-10" />
        ) : (
          <>
            {/* 1. Properties & Venues (Halls, Buildings, Shops, Land) */}
            <Text className="font-extrabold text-slate-900 text-lg mb-3">Mahallu Properties & Venues</Text>
            {venues.length === 0 ? (
              <View className="bg-white p-5 rounded-2xl items-center shadow-sm mb-6 border border-slate-100">
                <Ionicons name="business-outline" size={24} color="#94a3b8" />
                <Text className="text-slate-500 text-center text-xs mt-2">No venue or building properties available yet.</Text>
              </View>
            ) : (
              <View className="space-y-3 mb-6">
                {venues.map((item: any) => {
                  const maxQty = item.availableQuantity ?? item.quantity ?? 1;
                  return (
                    <View
                      key={item._id}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1 mr-3">
                        <View className="w-11 h-11 bg-teal-50 rounded-2xl items-center justify-center mr-3">
                          <Ionicons name="business-outline" size={22} color={TEAL} />
                        </View>
                        <View className="flex-1">
                          <Text className="font-extrabold text-slate-800 text-base" numberOfLines={1}>{item.name}</Text>
                          <Text className="text-slate-500 text-xs capitalize mt-0.5">
                            {item.type || 'Property'} • {item.rentAmount ? `₹${item.rentAmount}` : 'Free / Contact'}
                          </Text>
                          <Text className="text-emerald-700 font-bold text-[11px] mt-0.5 capitalize">
                            Status: {item.status || 'vacant'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push(`/(member)/properties/request?id=${item._id}&name=${encodeURIComponent(item.name)}&max=${maxQty}`)}
                        style={{ backgroundColor: TEAL }}
                        className="px-4 py-2.5 rounded-xl shadow-sm"
                      >
                        <Text className="text-white font-bold text-xs">{t('request', language)}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 2. Equipment & Assets */}
            <Text className="font-extrabold text-slate-900 text-lg mb-3">{t('availableEquipment', language)}</Text>
            {equipment.length === 0 ? (
              <View className="bg-white p-5 rounded-2xl items-center shadow-sm mb-6 border border-slate-100">
                <Ionicons name="cube-outline" size={24} color="#94a3b8" />
                <Text className="text-slate-500 text-center text-xs mt-2">{t('noEquipmentDesc', language)}</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-5 px-5">
                {equipment.map((item: any) => {
                  const availQty = item.availableQuantity ?? item.quantity ?? 1;
                  return (
                    <TouchableOpacity 
                      key={item._id}
                      onPress={() => router.push(`/(member)/properties/request?id=${item._id}&name=${encodeURIComponent(item.name)}&max=${availQty}`)}
                      className="bg-white p-4 rounded-2xl mr-4 shadow-sm border border-slate-100 w-48"
                    >
                      <View className="w-11 h-11 bg-indigo-50 rounded-2xl items-center justify-center mb-3">
                        <Ionicons name="cube-outline" size={22} color="#4f46e5" />
                      </View>
                      <Text className="font-extrabold text-slate-800 text-base" numberOfLines={1}>{item.name}</Text>
                      <Text className="text-emerald-600 font-semibold text-xs mt-1">
                        {availQty} {language === 'en' ? 'Available' : 'ലഭ്യമാണ്'}
                      </Text>
                      <Text className="text-slate-500 text-xs mt-1">
                        {item.rentAmount ? `₹${item.rentAmount} / unit` : (language === 'en' ? 'Free to use' : 'സൗജന്യമാണ്')}
                      </Text>
                      
                      <View className="mt-3 bg-teal-50 py-2 rounded-xl items-center">
                        <Text style={{ color: TEAL }} className="font-bold text-xs">{t('request', language)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* 3. My Rental & Booking History */}
            <Text className="font-extrabold text-slate-900 text-lg mb-3">{t('rentalHistory', language)}</Text>
            {rentalHistory.length === 0 ? (
              <View className="bg-white p-6 rounded-2xl items-center shadow-sm border border-slate-100 mb-8">
                <View className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="time-outline" size={24} color="#94a3b8" />
                </View>
                <Text className="font-bold text-slate-700 text-sm">{t('noRentalsYet', language)}</Text>
              </View>
            ) : (
              <View className="space-y-3 mb-8">
                {rentalHistory.map((req: any) => (
                  <View key={req._id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <View className="flex-row justify-between items-start mb-1.5">
                      <Text className="font-bold text-slate-800 text-base flex-1" numberOfLines={1}>
                        {req.propertyId?.name || 'Property / Item'}
                      </Text>
                      <View className={`px-2.5 py-1 rounded-full ml-2 ${req.status === 'PENDING' ? 'bg-amber-100' : req.status === 'APPROVED' ? 'bg-emerald-100' : req.status === 'RETURNED' ? 'bg-slate-100' : 'bg-red-100'}`}>
                        <Text className={`text-[10px] font-bold ${req.status === 'PENDING' ? 'text-amber-800' : req.status === 'APPROVED' ? 'text-emerald-800' : req.status === 'RETURNED' ? 'text-slate-600' : 'text-red-800'}`}>
                          {req.status}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-slate-500 text-xs">{t('quantity', language)}: {req.quantityRequested || 1}</Text>
                    {req.startDate && (
                      <Text className="text-slate-500 text-xs mt-0.5">{t('date', language)}: {new Date(req.startDate).toLocaleDateString()}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
