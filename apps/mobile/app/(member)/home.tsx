import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../../lib/hooks/useProfile';
import { usePrayerTimes } from '../../lib/hooks/usePrayerTimes';
import { useAnnouncements } from '../../lib/hooks/useEvents';
import { PrayerTimesWidget } from '../../components/PrayerTimesWidget';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { ErrorScreen } from '../../components/ui/ErrorScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useLanguageStore } from '../../lib/store/languageStore';
import { t } from '../../lib/i18n';

// Signature palette — deep teal + warm gold, evoking mosque architecture
// rather than a generic SaaS-dashboard blue/green.
const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const GOLD = '#C9972E';
const GOLD_SOFT = '#E8D9B5';
const CREAM = '#FBF8F2';

export default function MemberHomeScreen() {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguageStore();
  const { data: profileData, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const { data: prayerTimes, isLoading: prayerLoading } = usePrayerTimes();
  const { data: announcements } = useAnnouncements();

  if (profileLoading) return <LoadingScreen message="Loading dashboard..." />;

  const { member, family, tenant, user } = profileData || {};
  const hasDue = (family?.outstandingBalance || 0) > 0;

  const handleRefresh = () => {
    refetchProfile();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: CREAM }}>
      {/* Signature header: gradient arch with a faint geometric lattice */}
      <LinearGradient
        colors={[TEAL_DARK, TEAL]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          paddingBottom: 40,
        }}
      >
        <SafeAreaView edges={['top']}>
          <LatticeOverlay />
          <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full p-[2px]"
                style={{ backgroundColor: GOLD }}
              >
                <Avatar uri={tenant?.logo} name={tenant?.name || 'Mahallu'} size={40} bgColor="bg-white" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-xs font-semibold" style={{ color: GOLD_SOFT }}>
                  {tenant?.name}
                </Text>
                <Text className="text-white text-lg font-extrabold" numberOfLines={1}>
                  {t('greeting', language)}, {member?.name?.split(' ')[0] || 'Member'}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={toggleLanguage}
                className="px-2.5 py-1.5 rounded-xl border border-white/30"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Text className="text-white font-bold text-xs uppercase tracking-wider">{language === 'en' ? 'EN' : 'ML'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                activeOpacity={0.7}
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
                onPress={() => router.push('/(member)/notifications')}
              >
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                <View
                  className="absolute top-2 right-2.5 w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#F87171', borderWidth: 1, borderColor: TEAL }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={profileLoading} onRefresh={handleRefresh} tintColor={TEAL} />}
      >
        {/* Family / Dues card — floats up over the header for depth */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={{ marginTop: -28 }} className="mb-6">
          <View
            className="bg-white rounded-[24px] p-5 overflow-hidden"
            style={{
              shadowColor: TEAL_DARK,
              shadowOpacity: 0.12,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 4,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{t('familyId', language)}</Text>
                <Text className="text-slate-900 text-lg font-extrabold mt-0.5">{family?.familyCode || 'N/A'}</Text>
              </View>
              <View className="items-end">
                <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{t('members', language)}</Text>
                <Text className="text-slate-900 text-lg font-extrabold mt-0.5">{family?.members?.length || 1}</Text>
              </View>
            </View>

            <View className="h-[1px] bg-slate-100 w-full mb-4" />

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
                  style={{ backgroundColor: hasDue ? '#FEE2E2' : '#DCFCE7' }}
                >
                  <Ionicons name={hasDue ? 'alert-circle' : 'checkmark-circle'} size={22} color={hasDue ? '#DC2626' : '#16A34A'} />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-400 text-[11px] font-bold uppercase">
                    {t('pendingDues', language)} {family?.recurringDonationType && family.recurringDonationType !== 'none' ? `(${family.recurringDonationType})` : ''}
                  </Text>
                  <Text className="text-lg font-extrabold mt-0.5" style={{ color: hasDue ? '#DC2626' : '#16A34A' }}>
                    ₹{family?.outstandingBalance || 0}
                  </Text>
                </View>
              </View>

              {hasDue && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="px-5 py-2.5 rounded-2xl ml-2"
                  style={{ backgroundColor: GOLD }}
                  onPress={() => router.push('/(member)/payments')}
                >
                  <Text className="text-white font-extrabold text-xs">{t('payNow', language)}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Next Recurring Payment Due Date Banner */}
            {family?.recurringDonationType && family.recurringDonationType !== 'none' && (
              <View className="mt-4 pt-3 border-t border-slate-100 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={16} color={TEAL} />
                  <Text className="text-xs font-semibold text-slate-600 ml-1.5">
                    Next Due: <Text className="font-extrabold text-slate-900">
                      {family?.nextPaymentDueDate ? new Date(family.nextPaymentDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Upcoming'}
                    </Text>
                  </Text>
                </View>
                <View className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-100">
                  <Text className="text-[10px] font-bold text-teal-800 capitalize">
                    ₹{family.recurringDonationAmount || 0} / {family.recurringDonationType}
                  </Text>
                </View>
              </View>
            )}

            {/* Edit Family & Recurring Donation Action */}
            <TouchableOpacity
              onPress={() => router.push('/(member)/family')}
              className="mt-3 pt-2.5 border-t border-slate-100 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <Ionicons name="create-outline" size={14} color={TEAL} style={{ marginRight: 4 }} />
                <Text className="text-xs font-bold text-teal-800">Edit Family & Recurring Setup</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={TEAL} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Prayer Times Widget */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="px-5 mb-8">
          <PrayerTimesWidget data={prayerTimes} isLoading={prayerLoading} />
        </Animated.View>

        {/* Quick Actions Grid */}
        <SectionHeader title={t('quickActions', language)} />
        <View className="flex-row flex-wrap justify-between mb-2 mt-3">
          {user?.role === 'ustadh' && (
            <QuickActionItem
              icon="book"
              label={t('teacherArea', language)}
              bg="#FEF2F2"
              iconColor="#EF4444"
              onPress={() => router.push('/(member)/ustadh')}
              index={0}
            />
          )}
          {user?.role === 'sadar_mualim' && (
            <QuickActionItem
              icon="briefcase"
              label={t('sadarPanel', language)}
              bg="#FEF3C7"
              iconColor="#D97706"
              onPress={() => router.push('/(member)/sadar-panel')}
              index={0}
            />
          )}
          <QuickActionItem
            icon="people"
            label={t('myFamily', language)}
            bg="#EFF6FF"
            iconColor="#3B82F6"
            onPress={() => router.push('/(member)/family')}
            index={(user?.role === 'ustadh' || user?.role === 'sadar_mualim') ? 1 : 0}
          />
          <QuickActionItem
            icon="card"
            label={t('payDues', language)}
            bg="#ECFDF5"
            iconColor="#10B981"
            onPress={() => router.push('/(member)/payments')}
            index={(user?.role === 'ustadh' || user?.role === 'sadar_mualim') ? 2 : 1}
          />
          {(user?.role === 'parent' || user?.role === 'member') && (
            <QuickActionItem
              icon="school"
              label={t('students', language)}
              bg="#FEF2F2"
              iconColor="#EF4444"
              onPress={() => router.push('/(member)/family-students')}
              index={2}
            />
          )}
          <QuickActionItem
            icon="calendar"
            label={t('events', language)}
            bg="#FAF5FF"
            iconColor="#A855F7"
            onPress={() => router.push('/(member)/events')}
            index={3}
          />
          <QuickActionItem
            icon="business-outline"
            label={t('rentalsTitle', language) || 'Properties'}
            bg="#F0FDF4"
            iconColor="#16A34A"
            onPress={() => router.push('/(member)/properties')}
            index={4}
          />
        </View>

        {/* Announcements */}
        {announcements && announcements.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300).springify()} className="mb-6 mt-4">
            <SectionHeader title={t('announcements', language)} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5 mt-3">
              {announcements.map((announcement: any) => (
                <View
                  key={announcement._id}
                  className="bg-white rounded-2xl p-4 w-64 mr-4 overflow-hidden"
                  style={{
                    shadowColor: '#0f172a',
                    shadowOpacity: 0.06,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 2,
                  }}
                >
                  <View className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: GOLD }} />
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="megaphone-outline" size={15} color={TEAL} />
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider ml-1.5">{t('notice', language)}</Text>
                  </View>
                  <Text className="text-slate-800 font-bold mb-1" numberOfLines={1}>{announcement.title}</Text>
                  <Text className="text-slate-500 text-xs leading-4" numberOfLines={2}>{announcement.body}</Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Mahallu Info Card */}
        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <View
            className="bg-white rounded-[24px] p-5 mb-8"
            style={{
              shadowColor: '#0f172a',
              shadowOpacity: 0.05,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
            <View className="flex-row items-center mb-4">
              <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#E8F3F0' }}>
                <Ionicons name="business-outline" size={17} color={TEAL} />
              </View>
              <Text className="text-slate-800 font-extrabold text-base">{t('mahalluInfo', language)}</Text>
            </View>
            <InfoRow icon="location-outline" label={t('address', language)} value={`${tenant?.address?.line1 || ''}${tenant?.address?.city ? ', ' + tenant.address.city : ''}`} />
            <InfoRow icon="call-outline" label={t('contact', language)} value={tenant?.phone || t('notAvailable', language)} />
            <InfoRow icon="flag-outline" label={t('familyWard', language)} value={family?.wardNo || t('unassigned', language)} isLast />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/** Faint repeating geometric motif on the header, echoing mosque lattice screens. */
function LatticeOverlay() {
  const dots = Array.from({ length: 6 });
  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 flex-row flex-wrap opacity-[0.06]"
      style={{ overflow: 'hidden' }}
    >
      {dots.flatMap((_, row) =>
        Array.from({ length: 8 }).map((__, col) => (
          <View
            key={`${row}-${col}`}
            style={{
              position: 'absolute',
              top: row * 34 - 10,
              left: col * 46 + (row % 2 === 0 ? 0 : 23),
              width: 18,
              height: 18,
              borderWidth: 1.5,
              borderColor: '#FFFFFF',
              transform: [{ rotate: '45deg' }],
            }}
          />
        ))
      )}
    </View>
  );
}

function QuickActionItem({ icon, label, bg, iconColor, onPress, index }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 80 + 150).springify()} className="w-[48%] mb-4">
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        className="w-full h-28 rounded-[20px] bg-white items-center justify-center"
        style={{
          shadowColor: '#0f172a',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        }}
      >
        <View className="w-12 h-12 rounded-2xl items-center justify-center mb-2.5" style={{ backgroundColor: bg }}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <Text className="text-slate-700 text-[13px] font-bold">{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function InfoRow({ icon, label, value, isLast }: { icon: any; label: string; value: string; isLast?: boolean }) {
  return (
    <View
      className={`flex-row items-center justify-between py-2.5 ${isLast ? '' : 'border-b border-slate-50'}`}
    >
      <View className="flex-row items-center">
        <Ionicons name={icon} size={15} color="#94A3B8" style={{ marginRight: 8 }} />
        <Text className="text-slate-500 text-xs">{label}</Text>
      </View>
      <Text className="text-slate-700 text-xs font-bold text-right flex-1 ml-4" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}