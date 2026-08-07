import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000, 2500];

const SADAQAH_CATEGORIES = [
  { id: 'General Sadaqah', label: 'General Sadaqah (സ്വദഖ)', icon: 'heart-outline' },
  { id: 'Mosque Maintenance', label: 'Mosque & Water Fund (പള്ളി ഫണ്ട്)', icon: 'business-outline' },
  { id: 'Orphan & Relief', label: 'Orphan & Relief Support (അനാഥ ഫണ്ട്)', icon: 'people-outline' },
  { id: 'Food & Medical Aid', label: 'Food & Medical Aid (മെഡിക്കൽ ഫണ്ട്)', icon: 'medkit-outline' },
  { id: 'Education Fund', label: 'Education & Madrasa (വിദ്യാഭ്യാസ ഫണ്ട്)', icon: 'school-outline' },
];

export default function SadaqahScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [category, setCategory] = useState('General Sadaqah');
  const [description, setDescription] = useState('');
  const [gateway, setGateway] = useState('upi');

  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount || 0;

  // Fetch member's past Sadaqah history
  const { data: memberPayments, isLoading, refetch } = useQuery({
    queryKey: ['my-sadaqah-history', user?._id],
    queryFn: () =>
      apiClient
        .get('/payments/reports/finance', { params: { category: 'donation' } })
        .then((r) => r.data.data?.items || []),
  });

  const sadaqahHistory = Array.isArray(memberPayments) ? memberPayments : [];

  // Submit Sadaqah Payment
  const payMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/receipts/manual', data),
    onSuccess: (res) => {
      const receiptData = res.data?.data || {};
      setSuccessReceipt({
        receiptNo: receiptData.receiptNo || 'RCP-2026-SADAQAH',
        amount: finalAmount,
        category,
      });
      queryClient.invalidateQueries({ queryKey: ['my-sadaqah-history'] });
      refetch();
    },
    onError: (err: any) => {
      Alert.alert('Payment Error', err?.response?.data?.message || 'Failed to process Sadaqah payment');
    },
  });

  const handlePaySadaqah = () => {
    if (!finalAmount || finalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to give Sadaqah.');
      return;
    }

    const memberId = (user as any)?.memberId || user?._id;

    payMutation.mutate({
      type: 'donation',
      amount: finalAmount,
      paidById: memberId,
      paidForId: memberId,
      description: `[${category}] ${description}`.trim(),
      gateway,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 bg-white border-b border-slate-200 flex-row items-center justify-between shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-xl">
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-slate-900 text-lg font-extrabold">Give Sadaqah (സ്വദഖ)</Text>
          <Text className="text-slate-500 text-xs font-semibold">Voluntary Charity & Relief Fund</Text>
        </View>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <View className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-3xl p-5 mb-6 shadow-md shadow-emerald-900/20">
          <View className="flex-row items-center mb-2">
            <Ionicons name="heart" size={22} color="#34d399" />
            <Text className="text-emerald-300 text-xs font-bold uppercase tracking-wider ml-2">
              Voluntary Charity
            </Text>
          </View>
          <Text className="text-white text-xl font-extrabold">Sadaqah Wipes Away Sins</Text>
          <Text className="text-emerald-100/90 text-xs mt-1 leading-relaxed">
            Contribute freely to support mosque maintenance, water projects, widows, orphans, and medical relief.
          </Text>
        </View>

        {/* Amount Selector */}
        <View className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm">
          <Text className="text-slate-900 font-bold text-sm mb-3">Select Sadaqah Amount (₹)</Text>

          {/* Presets */}
          <View className="flex-row flex-wrap gap-2.5 mb-4">
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = selectedAmount === amt && !customAmount;
              return (
                <TouchableOpacity
                  key={amt}
                  onPress={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`px-4 py-2.5 rounded-2xl border font-bold text-sm ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Text className={`font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                    ₹{amt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Input */}
          <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50">
            <Text className="text-slate-500 font-extrabold text-lg mr-2">₹</Text>
            <TextInput
              placeholder="Or enter custom amount..."
              keyboardType="numeric"
              value={customAmount}
              onChangeText={(text) => {
                setCustomAmount(text);
                setSelectedAmount(null);
              }}
              className="flex-1 text-slate-900 font-extrabold text-base"
            />
          </View>
        </View>

        {/* Category Picker */}
        <View className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm">
          <Text className="text-slate-900 font-bold text-sm mb-3">Sadaqah Category / Purpose</Text>
          <View className="space-y-2">
            {SADAQAH_CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  className={`flex-row items-center p-3.5 rounded-2xl border ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={isSelected ? '#059669' : '#64748b'}
                  />
                  <Text
                    className={`ml-3 text-xs font-bold flex-1 ${
                      isSelected ? 'text-emerald-900' : 'text-slate-700'
                    }`}
                  >
                    {cat.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color="#059669" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description / Notes */}
        <View className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm">
          <Text className="text-slate-900 font-bold text-sm mb-2">Optional Note / Intent</Text>
          <TextInput
            placeholder="e.g. For family wellbeing / Esaal-e-Sawab..."
            value={description}
            onChangeText={setDescription}
            className="border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-slate-50 text-slate-900"
            multiline
          />
        </View>

        {/* Payment Method */}
        <View className="bg-white border border-slate-200 rounded-3xl p-5 mb-6 shadow-sm">
          <Text className="text-slate-900 font-bold text-sm mb-3">Payment Method</Text>
          <View className="flex-row gap-3">
            {[
              { id: 'upi', label: 'UPI / GPay', icon: 'qr-code-outline' },
              { id: 'card', label: 'Card / NetBank', icon: 'card-outline' },
              { id: 'cash', label: 'Cash in Hand', icon: 'cash-outline' },
            ].map((m) => {
              const isSelected = gateway === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setGateway(m.id)}
                  className={`flex-1 p-3 rounded-2xl border items-center ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <Ionicons name={m.icon as any} size={20} color={isSelected ? '#059669' : '#64748b'} />
                  <Text className={`text-[11px] font-bold mt-1 ${isSelected ? 'text-emerald-900' : 'text-slate-600'}`}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePaySadaqah}
          disabled={payMutation.isPending}
          className="bg-emerald-600 py-4 rounded-2xl items-center shadow-lg shadow-emerald-600/30 mb-8"
        >
          {payMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-extrabold">
              Pay Sadaqah ₹{finalAmount || 0}
            </Text>
          )}
        </TouchableOpacity>

        {/* History Section */}
        <View className="mb-12">
          <Text className="text-slate-900 font-extrabold text-base mb-3">My Past Sadaqah Contributions</Text>
          {isLoading ? (
            <ActivityIndicator color="#059669" className="py-6" />
          ) : sadaqahHistory.length === 0 ? (
            <View className="bg-white border border-slate-200 rounded-3xl p-6 items-center">
              <Ionicons name="heart-dislike-outline" size={32} color="#94a3b8" />
              <Text className="text-slate-500 text-xs font-semibold mt-2">No past Sadaqah payments recorded yet</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {sadaqahHistory.map((item: any, i: number) => (
                <View key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex-row items-center justify-between shadow-sm">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-emerald-500/10 items-center justify-center mr-3">
                      <Ionicons name="heart" size={20} color="#059669" />
                    </View>
                    <View>
                      <Text className="text-slate-900 font-bold text-sm">₹{item.amount}</Text>
                      <Text className="text-slate-500 text-xs">{item.description || 'General Sadaqah'}</Text>
                    </View>
                  </View>
                  <Text className="text-emerald-700 text-xs font-bold">{item.receiptNo || 'Completed'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Receipt Success Modal */}
      {successReceipt && (
        <Modal transparent animationType="fade" visible={!!successReceipt}>
          <View className="flex-1 bg-black/60 items-center justify-center p-5">
            <View className="bg-white rounded-3xl p-6 w-full items-center shadow-2xl">
              <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-4">
                <Ionicons name="checkmark-circle" size={40} color="#059669" />
              </View>

              <Text className="text-slate-900 text-xl font-extrabold">Jazakallah Khair!</Text>
              <Text className="text-slate-600 text-xs text-center mt-1">
                Your Sadaqah contribution of ₹{successReceipt.amount} has been received successfully.
              </Text>

              <View className="bg-slate-50 w-full p-4 rounded-2xl my-4 border border-slate-100 items-center">
                <Text className="text-slate-400 text-xs font-semibold">Official Receipt Number</Text>
                <Text className="text-emerald-700 font-extrabold text-lg mt-0.5">{successReceipt.receiptNo}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setSuccessReceipt(null)}
                className="bg-emerald-600 w-full py-3.5 rounded-2xl items-center"
              >
                <Text className="text-white font-bold text-sm">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
