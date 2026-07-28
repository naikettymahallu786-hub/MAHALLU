import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../lib/api';

export default function DonationsScreen() {
  const router = useRouter();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const res = await api.get('/mobile/me/donations');
      if (res.data.success) {
        setDonations(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm shadow-slate-200">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 pr-3">
          <Text className="text-slate-900 font-bold text-base" numberOfLines={1}>
            {item.purpose || 'General Donation'}
          </Text>
          <Text className="text-slate-500 text-xs mt-1">
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </Text>
        </View>
        <Text className="text-emerald-600 font-extrabold text-lg">
          ₹{item.amount.toLocaleString('en-IN')}
        </Text>
      </View>
      <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <Text className="text-slate-500 text-xs">
          Receipt: {item.receiptNo || 'Pending'}
        </Text>
        <View className={`px-2 py-1 rounded-md ${item.status === 'completed' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          <Text className={`text-[10px] font-bold uppercase ${item.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-2 pb-4 flex-row items-center bg-white border-b border-slate-200">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-slate-900 text-xl font-extrabold ml-2">My Donations</Text>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={donations}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <View className="w-20 h-20 bg-emerald-50 rounded-full items-center justify-center mb-4">
                <Ionicons name="heart-outline" size={32} color="#10b981" />
              </View>
              <Text className="text-slate-900 text-lg font-bold">No Donations Yet</Text>
              <Text className="text-slate-500 text-center mt-2 px-6">
                Your donation history will appear here once you make contributions.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
