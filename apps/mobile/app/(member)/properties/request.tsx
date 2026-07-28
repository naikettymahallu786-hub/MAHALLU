import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export default function RequestPropertyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  
  const propertyId = params.id as string;
  const propertyName = params.name as string;
  const maxQty = parseInt((params.max as string) || '1', 10);
  
  const [quantity, setQuantity] = useState('1');
  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.post('/mobile/properties/request', data),
    onSuccess: () => {
      Alert.alert('Success', 'Rental request submitted successfully. It will be reviewed by the administration.');
      queryClient.invalidateQueries({ queryKey: ['mobile-properties'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit request');
    }
  });

  const handleSubmit = () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return;
    }
    if (qty > maxQty) {
      Alert.alert('Not Available', `Only ${maxQty} items are currently available.`);
      return;
    }
    if (!purpose.trim()) {
      Alert.alert('Required', 'Please enter the purpose for this rental.');
      return;
    }
    
    submitMutation.mutate({ 
      propertyId, 
      quantityRequested: qty, 
      purpose,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(startDate).toISOString() // For now, single day rental
    });
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-emerald-600 px-6 pt-16 pb-6 rounded-b-3xl shadow-sm z-10">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Request Rental</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <Text className="text-sm text-slate-500 font-medium">Requesting item</Text>
          <Text className="text-lg font-bold text-slate-800 mt-1">{propertyName}</Text>
          <Text className="text-sm font-semibold text-emerald-600 mt-2">{maxQty} Available</Text>
        </View>

        <Text className="font-bold text-slate-800 text-base mb-2">Quantity Needed *</Text>
        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          className="bg-white p-4 rounded-xl border border-slate-200 text-slate-800 shadow-sm mb-5"
        />

        <Text className="font-bold text-slate-800 text-base mb-2">Date Needed *</Text>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          className="bg-white p-4 rounded-xl border border-slate-200 text-slate-800 shadow-sm mb-5"
        />

        <Text className="font-bold text-slate-800 text-base mb-2">Purpose *</Text>
        <TextInput
          value={purpose}
          onChangeText={setPurpose}
          placeholder="e.g. Marriage function, Community meeting"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="bg-white p-4 rounded-xl border border-slate-200 text-slate-800 shadow-sm min-h-[100px] mb-8"
        />

        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={submitMutation.isPending}
          className={`bg-emerald-600 py-4 rounded-xl items-center shadow-sm ${submitMutation.isPending ? 'opacity-70' : ''}`}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Submit Request</Text>
          )}
        </TouchableOpacity>
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
