import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <LinearGradient
        colors={['#ecfdf5', '#f8fafc', '#f8fafc']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ alignItems: 'center', marginBottom: 48 }}>
          <View style={{ width: 84, height: 84, borderRadius: 28, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginBottom: 28, shadowColor: '#10b981', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 }}>
            <Text style={{ fontSize: 44, color: 'white', fontWeight: 'bold' }}>م</Text>
          </View>
          <Text style={{ fontSize: 34, fontWeight: '900', color: '#0f172a', marginBottom: 12, letterSpacing: -0.5 }}>Mahallu ERP</Text>
          <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', paddingHorizontal: 20, lineHeight: 24 }}>
            Your digital gateway to community services, education, and connectivity.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={{ gap: 16 }}>
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/login')}
            style={{ backgroundColor: '#10b981', padding: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 }}
          >
            <Ionicons name="log-in-outline" size={22} color="white" />
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>Log In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/register-role')}
            style={{ backgroundColor: 'white', padding: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: '#e2e8f0', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 }}
          >
            <Ionicons name="person-add-outline" size={22} color="#10b981" />
            <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 17 }}>Register</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
