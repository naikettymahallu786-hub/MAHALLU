import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const ROLES = [
  {
    id: 'MEMBER',
    title: 'Family Head / Member',
    description: 'Register yourself and your family under the Mahallu to access services, pay donations, and more.',
    icon: 'home-outline' as const,
    color: '#0ea5e9'
  },
  {
    id: 'TEACHER',
    title: 'Ustad / Teacher',
    description: 'Register as an Ustad to manage classes, mark attendance, and track student progress.',
    icon: 'book-outline' as const,
    color: '#10b981'
  },
  {
    id: 'SADAR_MUALIM',
    title: 'Sadar Mualim / Headmaster',
    description: 'Register as a Sadar Mualim to manage students, classes, and assign students to families.',
    icon: 'briefcase-outline' as const,
    color: '#f59e0b'
  }
];

export default function RegisterRoleScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 32, fontWeight: '900', color: '#0f172a', marginBottom: 8, letterSpacing: -0.5 }}>Choose Your Role</Text>
          <Text style={{ fontSize: 16, color: '#64748b', lineHeight: 24 }}>Select the account type that best describes you.</Text>
        </Animated.View>

        <View style={{ gap: 16 }}>
          {ROLES.map((role, i) => (
            <Animated.View key={role.id} entering={FadeInDown.delay(100 + i * 100).springify()}>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(auth)/register-form', params: { role: role.id } })}
                style={{
                  backgroundColor: 'white',
                  borderWidth: 1.5,
                  borderColor: '#e2e8f0',
                  borderRadius: 24,
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  shadowColor: '#94a3b8',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 2
                }}
              >
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: `${role.color}15`, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={role.icon} size={28} color={role.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>{role.title}</Text>
                  <Text style={{ fontSize: 13, color: '#64748b', lineHeight: 18 }}>{role.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
