import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEvents } from '../../../lib/hooks/useEvents';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import { EventCard } from '../../../components/EventCard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLanguageStore } from '../../../lib/store/languageStore';
import { t } from '../../../lib/i18n';

const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const CREAM = '#FBF8F2';
const GOLD = '#C9972E';

export default function EventsListScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const { data: events, isLoading, refetch } = useEvents(activeTab);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: CREAM }} edges={['top']}>
      <View className="px-5 pt-2 pb-4 flex-row items-center border-b border-slate-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={TEAL_DARK} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: TEAL_DARK }}>{t('eventsTitle', language)}</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row p-5 pb-2">
        <TouchableOpacity 
          className={`flex-1 py-3 items-center rounded-l-full border ${activeTab === 'upcoming' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'}`}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text className={`font-bold text-sm ${activeTab === 'upcoming' ? 'text-white' : 'text-slate-500'}`}>{t('upcoming', language)}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 items-center rounded-r-full border border-l-0 ${activeTab === 'past' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'}`}
          onPress={() => setActiveTab('past')}
        >
          <Text className={`font-bold text-sm ${activeTab === 'past' ? 'text-white' : 'text-slate-500'}`}>{t('pastEvents', language)}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-4"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={TEAL} />}
      >
        {isLoading ? null : !events || events.length === 0 ? (
          <EmptyState 
            icon="calendar-clear-outline" 
            title={activeTab === 'upcoming' ? t('noUpcomingEvents', language) : t('noPastEvents', language)} 
            message={activeTab === 'upcoming' ? t('noUpcomingDesc', language) : t('noPastDesc', language)} 
          />
        ) : (
          <View className="pb-8">
            {events.map((event: any, idx: number) => (
              <Animated.View key={event._id} entering={FadeInDown.delay(50 + (idx * 50)).springify()}>
                <EventCard 
                  title={event.title}
                  date={event.date}
                  venue={event.venue}
                  bannerUri={event.banner?.url}
                  isPaid={event.isPaid}
                  onPress={() => router.push(`/(member)/events/${event._id}`)}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
