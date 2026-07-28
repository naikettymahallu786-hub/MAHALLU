import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../lib/api';

export default function CemeteryHistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ requests: [], plots: [] });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/mobile/me/cemetery-requests');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm shadow-slate-200 flex-row items-center justify-between">
      <View>
        <Text className="text-slate-900 font-bold text-base">Plot Request: {item.plotNo}</Text>
        <Text className="text-slate-500 text-xs mt-1">
          {new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          })} • {item.notes || 'No notes'}
        </Text>
      </View>
      <View className={`px-3 py-1.5 rounded-full ${
        item.status === 'approved' ? 'bg-emerald-100'
        : item.status === 'rejected' ? 'bg-rose-100'
        : 'bg-amber-100'
      }`}>
        <Text className={`text-[10px] font-bold uppercase ${
          item.status === 'approved' ? 'text-emerald-700'
          : item.status === 'rejected' ? 'text-rose-700'
          : 'text-amber-700'
        }`}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  const renderPlotItem = ({ item }: { item: any }) => (
    <View className="bg-emerald-50 rounded-2xl p-4 mb-3 border border-emerald-100 flex-row items-center">
      <View className="w-12 h-12 rounded-xl bg-emerald-100 items-center justify-center mr-4">
        <Ionicons name="bookmark" size={24} color="#10b981" />
      </View>
      <View>
        <Text className="text-emerald-900 font-bold text-base">Plot {item.plotNo}</Text>
        <Text className="text-emerald-600 text-xs mt-1">Section {item.section || 'A'}</Text>
      </View>
      <View className="ml-auto">
        <Text className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Booked</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-4 pt-2 pb-4 flex-row items-center bg-white border-b border-slate-200">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-slate-900 text-xl font-extrabold ml-2">My Cemetery Plots</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          data={[
            ...(data.plots.length > 0 ? [{ type: 'header', title: 'Owned Plots' }] : []),
            ...data.plots.map(p => ({ type: 'plot', data: p })),
            ...(data.requests.length > 0 ? [{ type: 'header', title: 'Booking Requests' }] : []),
            ...data.requests.map(r => ({ type: 'request', data: r })),
          ]}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }: { item: any }) => {
            if (item.type === 'header') {
              return <Text className="text-slate-800 text-sm font-bold mb-3 mt-2 uppercase tracking-wider">{item.title}</Text>;
            }
            if (item.type === 'plot') {
              return renderPlotItem({ item: item.data });
            }
            if (item.type === 'request') {
              return renderRequestItem({ item: item.data });
            }
            return null;
          }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="moon-outline" size={32} color="#64748b" />
              </View>
              <Text className="text-slate-900 text-lg font-bold">No plots or requests</Text>
              <Text className="text-slate-500 text-center mt-2 px-6">
                You haven't booked any cemetery plots yet.
              </Text>
              
              <TouchableOpacity 
                onPress={() => router.push('/(member)/cemetery')}
                className="mt-6 bg-emerald-600 px-6 py-3 rounded-xl flex-row items-center"
              >
                <Text className="text-white font-bold mr-2">Book a Plot</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
