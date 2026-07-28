import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Modal, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../../lib/api';

export default function RegisterFormScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    mahalluCode: '',
    name: '',
    phone: '',
    email: '',
    gender: 'male',
  });

  const [familyMembers, setFamilyMembers] = useState<{name: string, relationship: string, gender: string}[]>([]);

  const [families, setFamilies] = useState<{_id: string, familyCode: string, headName: string}[]>([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [fetchingFamilies, setFetchingFamilies] = useState(false);

  const fetchFamilies = async () => {
    if (!form.mahalluCode) {
      Alert.alert('Error', 'Please enter a Mahallu Code first');
      return;
    }
    try {
      setFetchingFamilies(true);
      const res = await api.get(`/registrations/families/${form.mahalluCode}`);
      setFamilies(res.data.data || []);
      setShowFamilyModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch families. Please check your Mahallu Code.');
    } finally {
      setFetchingFamilies(false);
    }
  };

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { name: '', relationship: '', gender: 'male' }]);
  };

  const updateFamilyMember = (index: number, key: string, value: string) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [key]: value };
    setFamilyMembers(updated);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.mahalluCode || !form.name || !form.phone) {
      Alert.alert('Error', 'Please fill in all required fields (Mahallu Code, Name, Phone).');
      return;
    }

    try {
      setLoading(true);
      // Since it's public, we might not need to be authenticated, but our api instance might attach headers.
      // Assuming the backend has `/api/v1/auth/submit` mapped to the controller. Wait, the route is `/api/v1/auth/register/submit`? 
      // Actually, I mounted it as app.use('/api/v1/registrations', registrationRoutes) and router.post('/submit')
      // So the endpoint is `/registrations/submit`
      await api.post('/registrations/submit', {
        mahalluCode: form.mahalluCode,
        type: role,
        payload: { ...form, familyMembers }
      });
      setSuccess(true);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit registration request.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center' }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginBottom: 28, shadowColor: '#10b981', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 8 }}>
            <Ionicons name="checkmark" size={44} color="white" />
          </View>
          <Text style={{ fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 }}>Request Submitted!</Text>
          <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 40 }}>
            Your registration request has been sent to the Mahallu admin for approval. You will receive your login credentials once approved.
          </Text>
          <TouchableOpacity 
            onPress={() => router.replace('/(auth)/landing')}
            style={{ backgroundColor: '#0f172a', paddingHorizontal: 32, paddingVertical: 18, borderRadius: 16, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Return to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const roleTitle = role === 'MEMBER' ? 'Family Head' : role === 'SADAR_MUALIM' ? 'Sadar Mualim' : 'Ustad';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginRight: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 }}>{roleTitle} Registration</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <View style={{ gap: 20 }}>
          
          <View>
            <Text style={{ color: '#475569', marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Mahallu Code *</Text>
            <TextInput
              style={{ backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, padding: 18, color: '#0f172a', fontSize: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
              placeholder="e.g. JMM001"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              value={form.mahalluCode}
              onChangeText={val => updateForm('mahalluCode', val)}
            />
          </View>

          <View>
            <Text style={{ color: '#475569', marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Name *</Text>
            <TextInput
              style={{ backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, padding: 18, color: '#0f172a', fontSize: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
              placeholder="Your full name"
              placeholderTextColor="#94a3b8"
              value={form.name}
              onChangeText={val => updateForm('name', val)}
            />
          </View>

          <View>
            <Text style={{ color: '#475569', marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone Number *</Text>
            <TextInput
              style={{ backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, padding: 18, color: '#0f172a', fontSize: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
              placeholder="+91"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={val => updateForm('phone', val)}
            />
          </View>

          {role === 'MEMBER' && (
            <>
              <View>
                <Text style={{ color: '#475569', marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Address Line 1</Text>
                <TextInput
                  style={{ backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, padding: 18, color: '#0f172a', fontSize: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
                  placeholder="House Name / Number"
                  placeholderTextColor="#94a3b8"
                  value={form.addressLine1}
                  onChangeText={val => updateForm('addressLine1', val)}
                />
              </View>
              <View>
                <Text style={{ color: '#475569', marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>City / District</Text>
                <TextInput
                  style={{ backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, padding: 18, color: '#0f172a', fontSize: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
                  placeholder="City or District"
                  placeholderTextColor="#94a3b8"
                  value={form.city}
                  onChangeText={val => updateForm('city', val)}
                />
              </View>
              <View>
                <Text style={{ color: '#475569', marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Donations</Text>
                <TextInput
                  style={{ backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, padding: 18, color: '#0f172a', fontSize: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
                  placeholder="E.g., Monthly Rs 500"
                  placeholderTextColor="#94a3b8"
                  value={form.currentDonations}
                  onChangeText={val => updateForm('currentDonations', val)}
                />
              </View>

              <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Family Members</Text>
                  <TouchableOpacity onPress={addFamilyMember} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                    <Ionicons name="add" size={16} color="#0f172a" />
                    <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 13, marginLeft: 4 }}>Add Member</Text>
                  </TouchableOpacity>
                </View>

                {familyMembers.map((member, index) => (
                  <View key={index} style={{ backgroundColor: '#f1f5f9', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontWeight: '700', color: '#475569', fontSize: 13, textTransform: 'uppercase' }}>Member {index + 1}</Text>
                      <TouchableOpacity onPress={() => removeFamilyMember(index)}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    
                    <TextInput
                      style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 14, color: '#0f172a', fontSize: 15, marginBottom: 12 }}
                      placeholder="Full Name"
                      placeholderTextColor="#94a3b8"
                      value={member.name}
                      onChangeText={val => updateFamilyMember(index, 'name', val)}
                    />
                    
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 }}>Relationship to Family Head *</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {['Son', 'Daughter', 'Child', 'Spouse', 'Father', 'Mother', 'Other'].map(rel => {
                        const isSelected = member.relationship === rel;
                        return (
                          <TouchableOpacity
                            key={rel}
                            onPress={() => updateFamilyMember(index, 'relationship', rel)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                              backgroundColor: isSelected ? TEAL : 'white',
                              borderWidth: 1,
                              borderColor: isSelected ? TEAL : '#cbd5e1',
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? 'white' : '#475569' }}>
                              {rel}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TextInput
                      style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, color: '#0f172a', fontSize: 14 }}
                      placeholder="Or enter specific relationship (e.g. Son)"
                      placeholderTextColor="#94a3b8"
                      value={member.relationship}
                      onChangeText={val => updateFamilyMember(index, 'relationship', val)}
                    />
                  </View>
                ))}
              </View>
            </>
          )}

          {(role === 'TEACHER' || role === 'SADAR_MUALIM') && (
            <>
              <View>
                <Text style={{ color: '#475569', marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Qualification</Text>
                <TextInput
                  style={{ backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, padding: 18, color: '#0f172a', fontSize: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
                  placeholder="e.g. Baqavi, Faizy"
                  placeholderTextColor="#94a3b8"
                  value={form.qualification}
                  onChangeText={val => updateForm('qualification', val)}
                />
              </View>
            </>
          )}

          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading}
            style={{ backgroundColor: '#10b981', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 16, opacity: loading ? 0.7 : 1, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 }}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>Submit Registration</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showFamilyModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a' }}>Select Family</Text>
              <TouchableOpacity onPress={() => setShowFamilyModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {families.length === 0 ? (
              <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 20, marginBottom: 40 }}>No families found for this Mahallu Code.</Text>
            ) : (
              <FlatList
                data={families}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      updateForm('familyId', item._id);
                      setShowFamilyModal(false);
                    }}
                    style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>{item.headName}</Text>
                    <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Code: {item.familyCode}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
