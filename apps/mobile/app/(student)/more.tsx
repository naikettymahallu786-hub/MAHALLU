import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useStudentProfile } from '../../lib/hooks/useStudentData';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';

export default function StudentMoreScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { data: profile } = useStudentProfile();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  const menuSections = [
    {
      title: 'Academics',
      items: [
        { icon: 'book-outline', label: 'Hifz Progress', route: null },
        { icon: 'document-text-outline', label: 'Certificates', route: null },
      ]
    },
    {
      title: 'Settings',
      items: [
        { icon: 'lock-closed-outline', label: 'Change Password', route: null },
        { icon: 'color-palette-outline', label: 'Theme', route: null, value: 'Light' },
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-5 pt-2 pb-4 border-b border-slate-200 bg-white">
        <Text className="text-slate-900 text-2xl font-extrabold">Profile</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Digital ID Card */}
          <View className="mb-8">
            <Text className="text-slate-800 text-sm font-bold mb-3 uppercase tracking-wider">Digital ID Card</Text>
            <Card className="bg-white border border-slate-200 p-0 overflow-hidden shadow-md shadow-slate-200">
              <View className="bg-emerald-500 px-4 py-2 flex-row justify-between items-center">
                <Text className="text-white text-[10px] font-bold tracking-wider uppercase">Student ID</Text>
                <Text className="text-emerald-100 text-[10px] font-bold">{profile?.madrasaId?.name || 'Madrasa'}</Text>
              </View>
              
              <View className="p-5 flex-row bg-gradient-to-br from-emerald-50 to-white">
                <Avatar uri={profile?.memberId?.photo?.url} name={profile?.memberId?.name || 'Student'} size={72} bgColor="bg-emerald-100" />
                <View className="ml-4 flex-1 justify-center">
                  <Text className="text-slate-800 text-lg font-bold mb-1">{profile?.memberId?.name}</Text>
                  
                  <View className="flex-row items-center mb-1">
                    <Text className="text-slate-500 text-[10px] w-14 font-bold uppercase">Adm No:</Text>
                    <Text className="text-emerald-600 font-extrabold text-xs">{profile?.admissionNo}</Text>
                  </View>
                  <View className="flex-row items-center mb-1">
                    <Text className="text-slate-500 text-[10px] w-14 font-bold uppercase">Class:</Text>
                    <Text className="text-slate-700 font-bold text-xs">{profile?.classId?.name}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-slate-500 text-[10px] w-14 font-bold uppercase">Guardian:</Text>
                    <Text className="text-slate-600 text-[10px] font-bold" numberOfLines={1}>{profile?.guardianId?.name}</Text>
                  </View>
                </View>
              </View>
            </Card>
          </View>

          {/* Menu Sections */}
          {menuSections.map((section, idx) => (
            <View key={idx} className="mb-6">
              <Text className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-wider">{section.title}</Text>
              <View className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm shadow-slate-200">
                {section.items.map((item, i) => (
                  <TouchableOpacity 
                    key={i} 
                    className={`flex-row items-center p-4 ${i !== section.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={item.icon as any} size={22} color="#64748b" />
                    <Text className="text-slate-800 text-base font-medium ml-3 flex-1">{item.label}</Text>
                    {item.value && <Text className="text-slate-400 text-sm mr-2">{item.value}</Text>}
                    <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity 
            className="bg-white border border-rose-100 py-4 rounded-2xl items-center flex-row justify-center mt-2 mb-8 shadow-sm shadow-slate-200"
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#e11d48" />
            <Text className="text-rose-600 font-bold text-base ml-2">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
