import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useProfile } from '../../lib/hooks/useProfile';
import { Avatar } from '../../components/ui/Avatar';
import { useLanguageStore } from '../../lib/store/languageStore';
import { t } from '../../lib/i18n';

export default function MoreScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const { logout } = useAuthStore();
  const { data: profileData } = useProfile();

  const handleLogout = () => {
    Alert.alert(t('signOut', language), t('signOutConfirm', language), [
      { text: t('cancel', language), style: 'cancel' },
      { 
        text: t('signOut', language), 
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
      title: t('account', language),
      items: [
        { icon: 'person-outline', label: t('personalProfile', language), route: null },
        { icon: 'moon-outline', label: t('myCemeteryPlots', language), route: '/(member)/cemetery-history' },
        { icon: 'lock-closed-outline', label: t('changePassword', language), route: null },
        { icon: 'notifications-outline', label: t('notificationSettings', language), route: null },
      ]
    },
    {
      title: t('appSettings', language),
      items: [
        { icon: 'language-outline', label: t('language', language), route: null, value: language === 'en' ? 'English' : 'മലയാളം' },
        { icon: 'color-palette-outline', label: t('theme', language), route: null, value: language === 'en' ? 'Light' : 'ലൈറ്റ്' },
      ]
    },
    {
      title: t('support', language),
      items: [
        { icon: 'help-circle-outline', label: t('helpFaq', language), route: null },
        { icon: 'document-text-outline', label: t('termsPrivacy', language), route: null },
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-5 pt-2 pb-4 border-b border-slate-200 bg-white">
        <Text className="text-slate-900 text-2xl font-extrabold">{t('profileTitle', language)}</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="p-5 flex-row items-center bg-white shadow-sm shadow-slate-200 mb-2">
          <Avatar 
            uri={profileData?.member?.photo?.url} 
            name={profileData?.member?.name || 'Member'} 
            size={64} 
            bgColor="bg-emerald-100"
          />
          <View className="ml-4 flex-1">
            <Text className="text-slate-800 text-lg font-bold">{profileData?.member?.name}</Text>
            <Text className="text-emerald-600 text-sm font-bold">{profileData?.member?.memberId}</Text>
            <Text className="text-slate-500 text-xs mt-1">{profileData?.user?.email}</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View className="p-5">
          {menuSections.map((section, idx) => (
            <View key={idx} className="mb-6">
              <Text className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-wider">{section.title}</Text>
              <View className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm shadow-slate-200">
                {section.items.map((item, i) => (
                  <TouchableOpacity 
                    key={i} 
                    className={`flex-row items-center p-4 ${i !== section.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                    activeOpacity={0.7}
                    onPress={() => item.route && router.push(item.route as any)}
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
            <Text className="text-rose-600 font-bold text-base ml-2">{t('signOut', language)}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
