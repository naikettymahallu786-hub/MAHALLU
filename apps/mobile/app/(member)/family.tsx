import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamily } from '../../lib/hooks/useFamily';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { ErrorScreen } from '../../components/ui/ErrorScreen';
import { MemberCard } from '../../components/MemberCard';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useLanguageStore } from '../../lib/store/languageStore';
import { t } from '../../lib/i18n';
import { apiClient } from '../../lib/api';

const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const GOLD = '#C9972E';
const CREAM = '#FBF8F2';

export default function FamilyScreen() {
  const { language } = useLanguageStore();
  const { data: family, isLoading, isError, refetch } = useFamily();

  // Edit Family Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLine1, setEditLine1] = useState('');
  const [editWardNo, setEditWardNo] = useState('');
  const [editRecurringType, setEditRecurringType] = useState<'monthly' | 'yearly' | 'none'>('none');
  const [editRecurringAmount, setEditRecurringAmount] = useState('');
  const [editRecurringDay, setEditRecurringDay] = useState('1');
  const [saving, setSaving] = useState(false);

  // Edit Member Modal State
  const [selectedMemberToEdit, setSelectedMemberToEdit] = useState<any>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [editMemberGender, setEditMemberGender] = useState<'male' | 'female'>('male');
  const [editMemberRelationship, setEditMemberRelationship] = useState('');
  const [editMemberOccupation, setEditMemberOccupation] = useState('');
  const [editMemberQualification, setEditMemberQualification] = useState('');
  const [editMemberBloodGroup, setEditMemberBloodGroup] = useState('');
  const [savingMember, setSavingMember] = useState(false);

  const openEditModal = () => {
    if (!family) return;
    setEditLine1(family.address?.line1 || '');
    setEditWardNo(family.wardNo || '');
    setEditRecurringType(family.recurringDonationType || 'none');
    setEditRecurringAmount(family.recurringDonationAmount ? String(family.recurringDonationAmount) : '');
    setEditRecurringDay(family.recurringPaymentDay ? String(family.recurringPaymentDay) : '1');
    setShowEditModal(true);
  };

  const handleSaveFamily = async () => {
    try {
      setSaving(true);
      await apiClient.put('/mobile/me/family', {
        line1: editLine1,
        wardNo: editWardNo,
        recurringDonationType: editRecurringType,
        recurringDonationAmount: parseFloat(editRecurringAmount) || 0,
        recurringPaymentDay: parseInt(editRecurringDay) || 1,
      });

      setShowEditModal(false);
      Alert.alert('Success', 'Family details updated successfully.');
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update family details');
    } finally {
      setSaving(false);
    }
  };

  const openMemberEditModal = (memberData: any, relationshipStr: string) => {
    if (!memberData) return;
    setSelectedMemberToEdit(memberData);
    setEditMemberName(memberData.name || '');
    setEditMemberPhone(memberData.phone || '');
    setEditMemberGender(memberData.gender || 'male');
    setEditMemberRelationship(relationshipStr || 'Member');
    setEditMemberOccupation(memberData.occupation || '');
    setEditMemberQualification(memberData.qualification || '');
    setEditMemberBloodGroup(memberData.bloodGroup || '');
    setShowMemberModal(true);
  };

  const handleSaveMember = async () => {
    if (!selectedMemberToEdit) return;
    try {
      setSavingMember(true);
      await apiClient.put(`/mobile/me/members/${selectedMemberToEdit._id}`, {
        name: editMemberName,
        phone: editMemberPhone,
        gender: editMemberGender,
        relationship: editMemberRelationship,
        occupation: editMemberOccupation,
        qualification: editMemberQualification,
        bloodGroup: editMemberBloodGroup,
      });

      setShowMemberModal(false);
      Alert.alert('Success', 'Member details updated successfully.');
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update member details');
    } finally {
      setSavingMember(false);
    }
  };

  if (isLoading) return <LoadingScreen message="Loading family details..." />;
  if (isError || !family) return <ErrorScreen message="Could not load family data." onRetry={refetch} />;

  const headMember = family.headMemberId;
  const otherMembers = family.members || [];

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: CREAM }}>
      <View className="px-5 pt-2 pb-4 flex-row justify-between items-center">
        <View>
          <Text className="text-[11px] font-bold uppercase tracking-wider" style={{ color: TEAL }}>
            {t('household', language)}
          </Text>
          <Text className="text-slate-900 text-2xl font-extrabold mt-0.5">{t('myFamily', language)}</Text>
        </View>

        <TouchableOpacity
          onPress={openEditModal}
          style={{ backgroundColor: TEAL, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 }}
          className="flex-row items-center gap-1.5 shadow-sm"
        >
          <Ionicons name="create-outline" size={16} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Edit Family</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={TEAL} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Family QR & Info */}
        <View
          className="bg-white rounded-[24px] p-4 mb-5 flex-row items-center overflow-hidden"
          style={{
            shadowColor: TEAL_DARK,
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
        >
          <View className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: GOLD }} />
          <View
            className="p-2.5 rounded-2xl"
            style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' }}
          >
            {family.familyCode ? (
              <QRCode value={family.familyCode} size={64} color={TEAL_DARK} />
            ) : (
              <View className="w-16 h-16 items-center justify-center rounded-xl" style={{ backgroundColor: '#F1F5F9' }}>
                <Ionicons name="qr-code" size={24} color="#94a3b8" />
              </View>
            )}
          </View>
          <View className="ml-4 flex-1">
            <Text className="font-extrabold text-lg mb-1.5" style={{ color: TEAL }}>
              {family.familyCode}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={13} color="#94a3b8" />
              <Text className="text-slate-500 text-xs ml-1.5" numberOfLines={1}>
                {t('ward', language)}: {family.wardNo || 'N/A'}
              </Text>
            </View>
            <View className="flex-row items-center mt-1.5">
              <Ionicons name="home-outline" size={13} color="#94a3b8" />
              <Text className="text-slate-500 text-xs ml-1.5" numberOfLines={1}>
                {family.address?.line1}
              </Text>
            </View>
          </View>
        </View>

        {/* Recurring Donation & Dues Card */}
        <View
          className="bg-white rounded-[20px] p-4 mb-6 border border-emerald-100"
          style={{
            shadowColor: TEAL_DARK,
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="heart-circle-outline" size={20} color={TEAL} />
              <Text className="font-bold text-slate-800 text-sm">Recurring Donation Setup</Text>
            </View>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={{ color: TEAL, fontWeight: '700', fontSize: 12 }}>Change</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between mt-1 bg-slate-50 p-3 rounded-xl">
            <View>
              <Text className="text-xs text-slate-500 font-medium uppercase tracking-wider">Frequency & Amount</Text>
              <Text className="text-slate-900 font-extrabold text-base mt-0.5">
                {family.recurringDonationType && family.recurringDonationType !== 'none'
                  ? `₹${family.recurringDonationAmount || 0} / ${family.recurringDonationType}`
                  : 'No active recurring donation'}
              </Text>
            </View>

            {family.recurringDonationType && family.recurringDonationType !== 'none' && (
              <View className="bg-emerald-100 px-3 py-1 rounded-full">
                <Text className="text-emerald-800 font-bold text-xs capitalize">{family.recurringDonationType}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Head of Family */}
        <SectionLabel icon="ribbon-outline" text={t('headOfFamily', language)} />
        <View className="mb-6 mt-3">
          {headMember ? (
            <MemberCard
              name={headMember.name}
              memberId={headMember.memberId || headMember._id}
              photo={headMember.photo?.url}
              phone={headMember.phone}
              role={language === 'en' ? 'Head' : 'കുടുംബനാഥൻ'}
              compact
              onEdit={() => openMemberEditModal(headMember, 'Head')}
            />
          ) : (
            <Text className="text-slate-400 text-xs italic">No head member assigned</Text>
          )}
        </View>

        {/* Family Members */}
        <SectionLabel icon="people-outline" text={`${t('familyMembers', language)} (${otherMembers.length})`} />
        <View className="space-y-3 mb-8 mt-3">
          {otherMembers.map((m: any) => {
            const memberData = m.memberId;
            if (!memberData) return null;
            return (
              <MemberCard
                key={memberData._id}
                name={memberData.name}
                memberId={memberData.memberId || memberData._id}
                photo={memberData.photo?.url}
                role={m.relationship}
                compact
                onEdit={() => openMemberEditModal(memberData, m.relationship)}
              />
            );
          })}
          {otherMembers.length === 0 && (
            <View className="bg-white rounded-2xl p-6 items-center justify-center border border-slate-100">
              <Ionicons name="people-outline" size={22} color="#cbd5e1" />
              <Text className="text-slate-400 text-xs mt-2">{t('noOtherMembers', language)}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Family Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] p-6 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl font-extrabold text-slate-900">Edit Family Details</Text>
                <Text className="text-xs text-slate-500 mt-0.5">Update house address & recurring donation settings</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)} className="p-2 bg-slate-100 rounded-full">
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Address Line 1 */}
              <View className="mb-4">
                <Text className="text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">House Address / Line 1</Text>
                <TextInput
                  value={editLine1}
                  onChangeText={setEditLine1}
                  placeholder="e.g. Near Juma Masjid"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm"
                />
              </View>

              {/* Ward No */}
              <View className="mb-4">
                <Text className="text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Ward Number</Text>
                <TextInput
                  value={editWardNo}
                  onChangeText={setEditWardNo}
                  placeholder="e.g. 04"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm"
                />
              </View>

              {/* Recurring Donation Frequency */}
              <View className="mb-4">
                <Text className="text-slate-700 text-xs font-bold mb-2 uppercase tracking-wider">Recurring Donation Frequency</Text>
                <View className="flex-row gap-2">
                  {(['monthly', 'yearly', 'none'] as const).map((type) => {
                    const isSelected = editRecurringType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setEditRecurringType(type)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: isSelected ? TEAL : '#f8fafc',
                          borderWidth: 1,
                          borderColor: isSelected ? TEAL : '#e2e8f0',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontWeight: '700', fontSize: 13, color: isSelected ? 'white' : '#475569', textTransform: 'capitalize' }}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Recurring Amount */}
              {editRecurringType !== 'none' && (
                <>
                  <View className="mb-4">
                    <Text className="text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Recurring Donation Amount (₹)</Text>
                    <TextInput
                      value={editRecurringAmount}
                      onChangeText={setEditRecurringAmount}
                      placeholder="e.g. 500"
                      keyboardType="numeric"
                      placeholderTextColor="#94a3b8"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold"
                    />
                  </View>

                  <View className="mb-6">
                    <Text className="text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Payment Day of Month (1 - 28)</Text>
                    <TextInput
                      value={editRecurringDay}
                      onChangeText={setEditRecurringDay}
                      placeholder="1"
                      keyboardType="numeric"
                      placeholderTextColor="#94a3b8"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold"
                    />
                  </View>
                </>
              )}

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveFamily}
                disabled={saving}
                style={{ backgroundColor: TEAL, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 24 }}
                className="shadow-lg shadow-emerald-500/20"
              >
                {saving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Member Modal */}
      <Modal visible={showMemberModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] p-6 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl font-extrabold text-slate-900">Edit Member Details</Text>
                <Text className="text-xs text-slate-500 mt-0.5">Update personal info & contact details</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMemberModal(false)} className="p-2 bg-slate-100 rounded-full">
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Full Name */}
              <View className="mb-4">
                <Text className="text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Full Name *</Text>
                <TextInput
                  value={editMemberName}
                  onChangeText={setEditMemberName}
                  placeholder="e.g. Ahmed K"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold"
                />
              </View>

              {/* Phone */}
              <View className="mb-4">
                <Text className="text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Phone Number</Text>
                <TextInput
                  value={editMemberPhone}
                  onChangeText={setEditMemberPhone}
                  placeholder="e.g. 9876543210"
                  keyboardType="phone-pad"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm"
                />
              </View>

              {/* Gender */}
              <View className="mb-4">
                <Text className="text-slate-700 text-xs font-bold mb-2 uppercase tracking-wider">Gender</Text>
                <View className="flex-row gap-3">
                  {(['male', 'female'] as const).map((g) => {
                    const isSelected = editMemberGender === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        onPress={() => setEditMemberGender(g)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: isSelected ? TEAL : '#f8fafc',
                          borderWidth: 1,
                          borderColor: isSelected ? TEAL : '#e2e8f0',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontWeight: '700', fontSize: 13, color: isSelected ? 'white' : '#475569', textTransform: 'capitalize' }}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Relationship */}
              <View className="mb-4">
                <Text className="text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Relationship to Family Head</Text>
                <TextInput
                  value={editMemberRelationship}
                  onChangeText={setEditMemberRelationship}
                  placeholder="e.g. Head, Spouse, Child, Parent"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm"
                />
              </View>

              {/* Occupation */}
              <View className="mb-4">
                <Text className="text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Occupation</Text>
                <TextInput
                  value={editMemberOccupation}
                  onChangeText={setEditMemberOccupation}
                  placeholder="e.g. Business, Student, Engineer"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm"
                />
              </View>

              {/* Qualification */}
              <View className="mb-4">
                <Text className="text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Qualification</Text>
                <TextInput
                  value={editMemberQualification}
                  onChangeText={setEditMemberQualification}
                  placeholder="e.g. B.Tech, High School"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm"
                />
              </View>

              {/* Blood Group */}
              <View className="mb-6">
                <Text className="text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Blood Group</Text>
                <TextInput
                  value={editMemberBloodGroup}
                  onChangeText={setEditMemberBloodGroup}
                  placeholder="e.g. O+, A+, B+"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveMember}
                disabled={savingMember}
                style={{ backgroundColor: TEAL, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 24 }}
                className="shadow-lg shadow-emerald-500/20"
              >
                {savingMember ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Save Member Details</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionLabel({ icon, text }: { icon: any; text: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={14} color="#0F6B5C" style={{ marginRight: 6 }} />
      <Text className="text-slate-800 text-sm font-bold uppercase tracking-wider">{text}</Text>
    </View>
  );
}