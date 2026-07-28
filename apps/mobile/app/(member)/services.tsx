import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { useLanguageStore } from '../../lib/store/languageStore';
import { t } from '../../lib/i18n';

export default function ServicesScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();

  const serviceCategories = [
    {
      title: t('financeAndDues', language),
      items: [
        { icon: 'card-outline', label: t('paymentsTitle', language), desc: t('paymentsDesc', language), route: '/(member)/payments', color: '#10b981', bg: 'bg-emerald-500/20' },
        { icon: 'heart-outline', label: t('donations', language), desc: t('donationsDesc', language), route: '/(member)/donations', color: '#f43f5e', bg: 'bg-rose-500/20' },
        { icon: 'wallet-outline', label: t('zakat', language), desc: t('zakatDesc', language), route: '/(member)/coming-soon?title=Zakat', color: '#3b82f6', bg: 'bg-blue-500/20' },
      ]
    },
    {
      title: t('community', language),
      items: [
        { icon: 'calendar-outline', label: t('eventsTitle', language), desc: t('eventsDesc', language), route: '/(member)/events', color: '#a855f7', bg: 'bg-purple-500/20' },
        { icon: 'document-text-outline', label: t('certificates', language), desc: t('certificatesDesc', language), route: '/(member)/certificates', color: '#f59e0b', bg: 'bg-amber-500/20' },
        { icon: 'people-outline', label: t('nikah', language), desc: t('nikahDesc', language), route: '/(member)/coming-soon?title=Nikah', color: '#ec4899', bg: 'bg-pink-500/20' },
      ]
    },
    {
      title: t('facilities', language),
      items: [
        { icon: 'business-outline', label: t('properties', language), desc: t('propertiesDesc', language), route: '/(member)/properties', color: '#10b981', bg: 'bg-emerald-500/20' },
        { icon: 'moon-outline', label: t('cemetery', language), desc: t('cemeteryDesc', language), route: '/(member)/cemetery', color: '#71717a', bg: 'bg-zinc-500/20' },
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-5 pt-2 pb-4 border-b border-slate-200 bg-white">
        <Text className="text-slate-900 text-2xl font-extrabold">{t('servicesTitle', language)}</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {serviceCategories.map((category, idx) => (
          <View key={idx} className="mb-6">
            <Text className="text-slate-800 text-sm font-bold mb-3 uppercase tracking-wider">{category.title}</Text>
            <View className="space-y-3">
              {category.items.map((item, i) => (
                <TouchableOpacity 
                  key={i} 
                  activeOpacity={0.7}
                  onPress={() => item.route && router.push(item.route as any)}
                  className="bg-white border border-slate-100 rounded-2xl p-4 flex-row items-center shadow-sm shadow-slate-200"
                >
                  <View className={`w-12 h-12 rounded-xl ${item.bg} items-center justify-center mr-4`}>
                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-800 font-bold text-base">{item.label}</Text>
                    <Text className="text-slate-500 text-xs mt-0.5">{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
