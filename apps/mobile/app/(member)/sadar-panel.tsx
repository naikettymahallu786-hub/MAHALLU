import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { Avatar } from '../../components/ui/Avatar';

// Theme colors
const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const GOLD = '#C9972E';
const CREAM = '#FBF8F2';

export default function SadarPanelScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [fetchingMembers, setFetchingMembers] = useState(false);

  // Selection states
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');

  // On-the-fly new child state
  const [isAddingNewChild, setIsAddingNewChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildGender, setNewChildGender] = useState<'male' | 'female'>('male');
  const [newChildRelationship, setNewChildRelationship] = useState('Child');

  // Options lists
  const [families, setFamilies] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Search filter inside family modal
  const [familySearchQuery, setFamilySearchQuery] = useState('');

  // Modal UI visibility states
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [familiesRes, classesRes] = await Promise.all([
          api.get('/mobile/sadar/families'),
          api.get('/mobile/sadar/classes'),
        ]);
        setFamilies(familiesRes.data.data || []);
        setClasses(classesRes.data.data || []);
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch classes or families for enrollment.');
      } finally {
        setFetchingData(false);
      }
    };
    loadInitialData();
  }, []);

  // Fetch family members when family is selected
  const handleSelectFamily = async (familyId: string) => {
    setSelectedFamilyId(familyId);
    setSelectedMemberId('');
    setIsAddingNewChild(false);
    setShowFamilyModal(false);

    try {
      setFetchingMembers(true);
      const res = await api.get(`/mobile/sadar/families/${familyId}/members`);
      setFamilyMembers(res.data.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load members of selected family.');
    } finally {
      setFetchingMembers(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFamilyId) {
      Alert.alert('Missing Selection', 'Please select a Family first.');
      return;
    }

    if (!selectedClassId) {
      Alert.alert('Missing Selection', 'Please select a Madrasa Class.');
      return;
    }

    if (isAddingNewChild) {
      if (!newChildName.trim()) {
        Alert.alert('Missing Field', 'Please enter the name of the new child.');
        return;
      }
    } else {
      if (!selectedMemberId) {
        Alert.alert('Missing Selection', 'Please select a child from the family list or add a new child.');
        return;
      }
    }

    try {
      setLoading(true);
      const payload: any = {
        familyId: selectedFamilyId,
        classId: selectedClassId,
        admissionNo: admissionNo.trim() || undefined,
      };

      if (isAddingNewChild) {
        payload.name = newChildName.trim();
        payload.gender = newChildGender;
        payload.relationship = newChildRelationship;
      } else {
        payload.memberId = selectedMemberId;
      }

      await api.post('/mobile/sadar/students', payload);

      Alert.alert('Success 🎉', 'Student successfully enrolled in Madrasa class!', [
        {
          text: 'Great',
          onPress: () => {
            setSelectedFamilyId('');
            setSelectedMemberId('');
            setSelectedClassId('');
            setAdmissionNo('');
            setIsAddingNewChild(false);
            setNewChildName('');
            router.back();
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Enrollment Error', err.response?.data?.message || 'Failed to enroll student.');
    } finally {
      setLoading(false);
    }
  };

  const selectedFamily = families.find(f => f._id === selectedFamilyId);
  const selectedClass = classes.find(c => c._id === selectedClassId);
  const selectedMember = familyMembers.find(m => m._id === selectedMemberId);

  // Filter family search
  const filteredFamilies = families.filter(f => 
    f.headName?.toLowerCase().includes(familySearchQuery.toLowerCase()) ||
    f.familyCode?.toLowerCase().includes(familySearchQuery.toLowerCase())
  );

  // Helper to test if a member is a child/dependent
  const isChildMember = (m: any) => {
    const rel = (m.relationship || '').toLowerCase();
    return rel.includes('child') || rel.includes('son') || rel.includes('daughter') || rel.includes('dependent') || rel.includes('grandson') || rel.includes('granddaughter');
  };

  const childrenList = familyMembers.filter(isChildMember);
  const otherMembersList = familyMembers.filter(m => !isChildMember(m));

  if (fetchingData) {
    return (
      <View style={{ flex: 1, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={TEAL} />
        <Text style={{ marginTop: 12, color: TEAL_DARK, fontWeight: '600' }}>Loading enrollment portal...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#f1ebd9', backgroundColor: 'white' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
          <Ionicons name="arrow-back" size={20} color={TEAL_DARK} />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: TEAL_DARK, letterSpacing: -0.5 }}>Sadar Mualim Panel</Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Enroll family children to Madrasa classes</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ gap: 20 }}>

          {/* STEP 1: SELECT FAMILY */}
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#ebdcb9' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>1</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: TEAL_DARK }}>Select Family *</Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowFamilyModal(true)}
              style={{ backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: selectedFamilyId ? TEAL : '#e2e8f0', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: selectedFamilyId ? '#0f172a' : '#94a3b8', fontSize: 15, fontWeight: selectedFamilyId ? '700' : 'normal' }}>
                  {selectedFamilyId 
                    ? `${selectedFamily?.headName} (${selectedFamily?.familyCode})`
                    : 'Search & Pick Family from List'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={TEAL} />
            </TouchableOpacity>
          </View>

          {/* STEP 2: SELECT CHILD / MEMBER IN FAMILY */}
          {selectedFamilyId ? (
            <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#ebdcb9' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>2</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: TEAL_DARK }}>Select Student / Child *</Text>
                </View>

                {/* Option to toggle on-the-fly child creation */}
                <TouchableOpacity 
                  onPress={() => {
                    setIsAddingNewChild(!isAddingNewChild);
                    setSelectedMemberId('');
                  }}
                  style={{ backgroundColor: isAddingNewChild ? '#fee2e2' : '#ecfdf5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}
                >
                  <Text style={{ color: isAddingNewChild ? '#ef4444' : TEAL, fontWeight: 'bold', fontSize: 12 }}>
                    {isAddingNewChild ? 'Cancel' : '+ New Child'}
                  </Text>
                </TouchableOpacity>
              </View>

              {fetchingMembers ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator color={TEAL} />
                  <Text style={{ color: '#64748b', marginTop: 8, fontSize: 13 }}>Fetching family members...</Text>
                </View>
              ) : isAddingNewChild ? (
                /* Form to add a new child directly to this family */
                <View style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#cbd5e1', gap: 12 }}>
                  <Text style={{ fontWeight: 'bold', color: TEAL_DARK, fontSize: 14 }}>Add New Child to {selectedFamily?.headName}'s Family</Text>
                  
                  <TextInput
                    style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 14, color: '#0f172a', fontSize: 15 }}
                    placeholder="Child's Full Name"
                    placeholderTextColor="#94a3b8"
                    value={newChildName}
                    onChangeText={setNewChildName}
                  />

                  {/* Gender selection */}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {(['male', 'female'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => setNewChildGender(g)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: newChildGender === g ? TEAL : 'white',
                          borderWidth: 1,
                          borderColor: newChildGender === g ? TEAL : '#cbd5e1',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: newChildGender === g ? 'white' : '#475569', fontWeight: 'bold', fontSize: 13, textTransform: 'capitalize' }}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Relationship options */}
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {['Son', 'Daughter', 'Child'].map((rel) => (
                      <TouchableOpacity
                        key={rel}
                        onPress={() => setNewChildRelationship(rel)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: newChildRelationship === rel ? GOLD : 'white',
                          borderWidth: 1,
                          borderColor: newChildRelationship === rel ? GOLD : '#cbd5e1',
                        }}
                      >
                        <Text style={{ color: newChildRelationship === rel ? 'white' : '#475569', fontWeight: 'bold', fontSize: 12 }}>
                          {rel}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                /* Select existing member/child from list */
                <View style={{ gap: 10 }}>
                  {childrenList.length > 0 && (
                    <Text style={{ fontSize: 12, fontWeight: '700', color: GOLD, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Children & Dependents in Family
                    </Text>
                  )}

                  {childrenList.map((m) => {
                    const isSelected = selectedMemberId === m._id;
                    return (
                      <TouchableOpacity
                        key={m._id}
                        onPress={() => setSelectedMemberId(m._id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justify: 'space-between',
                          backgroundColor: isSelected ? '#ecfdf5' : '#f8fafc',
                          borderWidth: 1.5,
                          borderColor: isSelected ? TEAL : '#e2e8f0',
                          padding: 12,
                          borderRadius: 16,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Avatar uri={null} name={m.name} size={36} />
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 15 }}>{m.name}</Text>
                            <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{m.relationship} • {m.gender}</Text>
                          </View>
                        </View>

                        {m.isEnrolledStudent ? (
                          <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                            <Text style={{ color: GOLD, fontWeight: 'bold', fontSize: 11 }}>
                              {m.enrolledClassName || 'Enrolled'}
                            </Text>
                          </View>
                        ) : (
                          <Ionicons 
                            name={isSelected ? 'checkmark-circle' : 'radio-button-off'} 
                            size={24} 
                            color={isSelected ? TEAL : '#cbd5e1'} 
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {otherMembersList.length > 0 && (
                    <>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 }}>
                        Other Family Members
                      </Text>
                      {otherMembersList.map((m) => {
                        const isSelected = selectedMemberId === m._id;
                        return (
                          <TouchableOpacity
                            key={m._id}
                            onPress={() => setSelectedMemberId(m._id)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justify: 'space-between',
                              backgroundColor: isSelected ? '#ecfdf5' : '#f8fafc',
                              borderWidth: 1.5,
                              borderColor: isSelected ? TEAL : '#e2e8f0',
                              padding: 12,
                              borderRadius: 16,
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                              <Avatar uri={null} name={m.name} size={36} />
                              <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 15 }}>{m.name}</Text>
                                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{m.relationship}</Text>
                              </View>
                            </View>

                            <Ionicons 
                              name={isSelected ? 'checkmark-circle' : 'radio-button-off'} 
                              size={24} 
                              color={isSelected ? TEAL : '#cbd5e1'} 
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  )}
                </View>
              )}
            </View>
          ) : null}

          {/* STEP 3: SELECT CLASS */}
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#ebdcb9' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>3</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: TEAL_DARK }}>Select Madrasa Class *</Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowClassModal(true)}
              style={{ backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: selectedClassId ? TEAL : '#e2e8f0', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Text style={{ color: selectedClassId ? '#0f172a' : '#94a3b8', fontSize: 15, fontWeight: selectedClassId ? '700' : 'normal' }}>
                {selectedClassId ? selectedClass?.name : 'Pick Target Class'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={TEAL} />
            </TouchableOpacity>
          </View>

          {/* Admission Number Optional */}
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#ebdcb9' }}>
            <Text style={{ color: TEAL_DARK, marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Admission Number (Optional)</Text>
            <TextInput
              style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, color: '#0f172a', fontSize: 15 }}
              placeholder="Auto-generated if left blank"
              placeholderTextColor="#94a3b8"
              value={admissionNo}
              onChangeText={setAdmissionNo}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading}
            style={{ backgroundColor: TEAL, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8, opacity: loading ? 0.7 : 1, shadowColor: TEAL_DARK, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 }}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>Enroll Student</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Family Select Modal */}
      <Modal visible={showFamilyModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: TEAL_DARK }}>Select Family</Text>
              <TouchableOpacity onPress={() => setShowFamilyModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={{ backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="search" size={18} color="#64748b" style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 15, color: '#0f172a' }}
                placeholder="Search by Family Head name or Code..."
                placeholderTextColor="#94a3b8"
                value={familySearchQuery}
                onChangeText={setFamilySearchQuery}
              />
            </View>

            <FlatList
              data={filteredFamilies}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectFamily(item._id)}
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>{item.headName}</Text>
                  <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Code: {item.familyCode}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Class Select Modal */}
      <Modal visible={showClassModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: TEAL_DARK }}>Select Class</Text>
              <TouchableOpacity onPress={() => setShowClassModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={classes}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedClassId(item._id);
                    setShowClassModal(false);
                  }}
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>{item.name}</Text>
                  {item.level && <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Level: {item.level}</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
