import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

const CERTIFICATE_TYPES = [
  { id: 'marriage_certificate', label: 'Marriage Certificate', desc: 'Official certificate for recorded marriage' },
  { id: 'marriage_clearance', label: 'Marriage Clearance', desc: 'No-Objection clearance for upcoming marriage' },
  { id: 'panchayath_letter', label: 'Panchayath Letter', desc: 'Letter addressed to Grama Panchayath' },
  { id: 'village_letter', label: 'Village Letter', desc: 'Letter addressed to Village Office' },
  { id: 'other_org_letter', label: 'Other Organizations Letter', desc: 'Letter for external institutions / banks / trusts' },
  { id: 'caste_certificate', label: 'Caste Certificate', desc: 'Community & Caste verification letter' },
  { id: 'noc', label: 'NOC (No Objection Certificate)', desc: 'General NOC for travel, job, or migration' },
];

export default function RequestCertificateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [type, setType] = useState('marriage_certificate');
  const [purpose, setPurpose] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Dynamic form state per certificate type
  const [formData, setFormData] = useState<Record<string, string>>({
    groomName: '',
    brideName: '',
    marriageDate: '',
    venue: '',
    intendedSpouse: '',
    guardianName: '',
    panchayathName: '',
    wardNo: '',
    villageName: '',
    targetOrgName: '',
    casteName: '',
    subCaste: '',
    targetAuthority: '',
  });

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const submitMutation = useMutation({
    mutationFn: (data: { type: string; purpose: string; details: any }) => api.post('/mobile/certificates/request', data),
    onSuccess: () => {
      Alert.alert('Success 🎉', 'Certificate request submitted successfully! Administration will review and issue your certificate.', [
        {
          text: 'OK',
          onPress: () => {
            queryClient.invalidateQueries({ queryKey: ['mobile-certificates'] });
            router.back();
          },
        },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit request');
    },
  });

  const handleSubmit = () => {
    if (!purpose.trim()) {
      Alert.alert('Required Field', 'Please enter the main purpose for this certificate request.');
      return;
    }
    submitMutation.mutate({ type, purpose: purpose.trim(), details: formData });
  };

  const selectedTypeObj = CERTIFICATE_TYPES.find(ct => ct.id === type) || CERTIFICATE_TYPES[0];

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-emerald-600 px-6 pt-14 pb-6 rounded-b-3xl shadow-sm z-10">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Request Certificate</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Certificate Type Dropdown Selector */}
        <Text className="font-bold text-slate-800 text-base mb-2">Select Certificate Type *</Text>
        <TouchableOpacity
          onPress={() => setShowDropdown(true)}
          className="bg-white border-2 border-emerald-600/30 p-4 rounded-2xl flex-row items-center justify-between shadow-sm mb-6"
        >
          <View className="flex-1 mr-2">
            <Text className="font-bold text-emerald-800 text-base">{selectedTypeObj.label}</Text>
            <Text className="text-slate-500 text-xs mt-0.5">{selectedTypeObj.desc}</Text>
          </View>
          <Ionicons name="chevron-down" size={22} color="#059669" />
        </TouchableOpacity>

        {/* Dynamic Form Render based on selected certificate type */}
        <View className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4">
          <Text className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">
            {selectedTypeObj.label} Form Details
          </Text>

          {/* MARRIAGE CERTIFICATE */}
          {type === 'marriage_certificate' && (
            <>
              <View>
                <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Groom Name *</Text>
                <TextInput
                  value={formData.groomName}
                  onChangeText={v => updateField('groomName', v)}
                  placeholder="Enter full name of Groom"
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
                />
              </View>
              <View>
                <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Bride Name *</Text>
                <TextInput
                  value={formData.brideName}
                  onChangeText={v => updateField('brideName', v)}
                  placeholder="Enter full name of Bride"
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
                />
              </View>
              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Marriage Date</Text>
                  <TextInput
                    value={formData.marriageDate}
                    onChangeText={v => updateField('marriageDate', v)}
                    placeholder="DD/MM/YYYY"
                    className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Venue</Text>
                  <TextInput
                    value={formData.venue}
                    onChangeText={v => updateField('venue', v)}
                    placeholder="e.g. Mahallu Juma Masjid"
                    className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
                  />
                </View>
              </View>
            </>
          )}

          {/* MARRIAGE CLEARANCE */}
          {type === 'marriage_clearance' && (
            <>
              <View>
                <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Intended Spouse Name</Text>
                <TextInput
                  value={formData.intendedSpouse}
                  onChangeText={v => updateField('intendedSpouse', v)}
                  placeholder="Full name of intended bride/groom"
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
                />
              </View>
              <View>
                <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Father / Guardian Name</Text>
                <TextInput
                  value={formData.guardianName}
                  onChangeText={v => updateField('guardianName', v)}
                  placeholder="Father's full name"
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
                />
              </View>
            </>
          )}

          {/* PANCHAYATH LETTER */}
          {type === 'panchayath_letter' && (
            <>
              <View>
                <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Grama Panchayath Name</Text>
                <TextInput
                  value={formData.panchayathName}
                  onChangeText={v => updateField('panchayathName', v)}
                  placeholder="e.g. Valavannur Grama Panchayath"
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
                />
              </View>
              <View>
                <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Ward Number</Text>
                <TextInput
                  value={formData.wardNo}
                  onChangeText={v => updateField('wardNo', v)}
                  placeholder="e.g. Ward 04"
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
                />
              </View>
            </>
          )}

          {/* VILLAGE LETTER */}
          {type === 'village_letter' && (
            <View>
              <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Village Office Name</Text>
              <TextInput
                value={formData.villageName}
                onChangeText={v => updateField('villageName', v)}
                placeholder="e.g. Kadalundi Village Office"
                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
              />
            </View>
          )}

          {/* OTHER ORGANIZATIONS LETTER */}
          {type === 'other_org_letter' && (
            <View>
              <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Target Organization / Authority Name</Text>
              <TextInput
                value={formData.targetOrgName}
                onChangeText={v => updateField('targetOrgName', v)}
                placeholder="e.g. SBI Bank / Educational Trust"
                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
              />
            </View>
          )}

          {/* CASTE CERTIFICATE */}
          {type === 'caste_certificate' && (
            <>
              <View>
                <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Community / Caste Name</Text>
                <TextInput
                  value={formData.casteName}
                  onChangeText={v => updateField('casteName', v)}
                  placeholder="e.g. Muslim (Mappila)"
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
                />
              </View>
              <View>
                <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Father / Guardian Name</Text>
                <TextInput
                  value={formData.guardianName}
                  onChangeText={v => updateField('guardianName', v)}
                  placeholder="Father's full name"
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
                />
              </View>
            </>
          )}

          {/* NOC */}
          {type === 'noc' && (
            <View>
              <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Target Authority / Department</Text>
              <TextInput
                value={formData.targetAuthority}
                onChangeText={v => updateField('targetAuthority', v)}
                placeholder="e.g. Regional Passport Office / Embassy / Employer"
                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800"
              />
            </View>
          )}

          {/* Purpose field for all */}
          <View>
            <Text className="text-xs font-bold text-slate-600 uppercase mb-1">Detailed Purpose of Request *</Text>
            <TextInput
              value={purpose}
              onChangeText={setPurpose}
              placeholder="Explain why you need this certificate..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800 min-h-[90px]"
            />
          </View>
        </View>

        {/* Submit Request Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitMutation.isPending}
          className={`bg-emerald-600 py-4 rounded-2xl items-center shadow-sm ${submitMutation.isPending ? 'opacity-70' : ''}`}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Submit Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Certificate Type Selection Modal */}
      <Modal visible={showDropdown} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <Text className="text-lg font-bold text-slate-900">Choose Certificate Type</Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={CERTIFICATE_TYPES}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = type === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setType(item.id);
                      setShowDropdown(false);
                    }}
                    className={`p-4 rounded-xl mb-2 flex-row items-center justify-between border ${
                      isSelected ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <View className="flex-1 mr-2">
                      <Text className={`font-bold text-base ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                        {item.label}
                      </Text>
                      <Text className="text-slate-500 text-xs mt-0.5">{item.desc}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color="#059669" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
