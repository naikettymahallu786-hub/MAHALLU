import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useStudentProfile, useStudentHomework } from '../../lib/hooks/useStudentData';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Avatar } from '../../components/ui/Avatar';
import { StatCard } from '../../components/ui/StatCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import dayjs from 'dayjs';

// Keep in sync with the member screens' identity.
const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const GOLD = '#C9972E';
const CREAM = '#FBF8F2';

export default function StudentHomeScreen() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useStudentProfile();
  const { data: homework, isLoading: hwLoading } = useStudentHomework();

  if (profileLoading) return <LoadingScreen message="Loading student dashboard..." />;

  const pendingHomework = homework?.filter((hw: any) => !hw.mySubmission && dayjs().isBefore(hw.dueDate)) || [];

  const handleRefresh = () => {
    refetchProfile();
  };

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: CREAM }}>
      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="rounded-full p-[2px]" style={{ backgroundColor: GOLD }}>
            <Avatar uri={profile?.memberId?.photo?.url} name={profile?.memberId?.name || 'Student'} size={44} bgColor="bg-white" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[11px] font-bold uppercase tracking-wider" style={{ color: TEAL }}>
              {profile?.madrasaId?.name}
            </Text>
            <Text className="text-slate-900 text-base font-extrabold" numberOfLines={1}>
              Hi, {profile?.memberId?.name?.split(' ')[0] || 'Student'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-white items-center justify-center"
          style={{
            shadowColor: TEAL_DARK,
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 1,
          }}
        >
          <Ionicons name="notifications-outline" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={profileLoading} onRefresh={handleRefresh} tintColor={TEAL} />}
      >
        {/* Student ID Card Mini */}
        <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-6">
          <LinearGradient
            colors={[TEAL_DARK, TEAL]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 20,
              shadowColor: TEAL_DARK,
              shadowOpacity: 0.25,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 8 },
              elevation: 5,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#B9E0D4' }}>
                  Student ID
                </Text>
                <Text className="text-white text-xl font-extrabold" style={{ fontVariant: ['tabular-nums'] }}>
                  {profile?.admissionNo}
                </Text>
              </View>
              <View className="px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}>
                <Text className="text-white font-bold">{profile?.classId?.name}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="flex-row mb-6" style={{ gap: 16 }}>
          <View className="flex-1">
            <StatCard
              icon="checkmark-circle"
              value={`${profile?.attendancePercent || 0}%`}
              label="Attendance"
              color="#3B82F6"
              iconBg="bg-blue-50"
            />
          </View>
          <View className="flex-1">
            <StatCard
              icon="document-text"
              value={pendingHomework.length.toString()}
              label="Pending HW"
              color={pendingHomework.length > 0 ? '#D97706' : '#10B981'}
              iconBg={pendingHomework.length > 0 ? 'bg-amber-50' : 'bg-emerald-50'}
            />
          </View>
        </Animated.View>

        {/* Pending Homework Alert */}
        {pendingHomework.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-6">
            <SectionHeader
              title="Action Required"
              actionLabel="View All"
              onAction={() => router.push('/(student)/academics')}
            />
            <View className="mt-3">
              {pendingHomework.slice(0, 2).map((hw: any) => (
                <TouchableOpacity
                  key={hw._id}
                  activeOpacity={0.75}
                  className="bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between overflow-hidden"
                  style={{
                    shadowColor: TEAL_DARK,
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 2,
                  }}
                  onPress={() => router.push(`/(student)/homework/${hw._id}`)}
                >
                  <View className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: GOLD }} />
                  <View className="flex-1 mr-4">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="time-outline" size={13} color={GOLD} />
                      <Text className="font-bold text-xs ml-1.5 uppercase tracking-wider" style={{ color: '#B7862B' }}>
                        Due {dayjs(hw.dueDate).fromNow()}
                      </Text>
                    </View>
                    <Text className="text-slate-800 font-bold text-sm" numberOfLines={1}>
                      {hw.title}
                    </Text>
                    <Text className="text-slate-500 text-xs mt-0.5">{hw.subject}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <View className="flex-row items-center mb-3">
            <Ionicons name="grid-outline" size={14} color={TEAL} style={{ marginRight: 6 }} />
            <Text className="text-slate-800 text-sm font-bold uppercase tracking-wider">Quick Actions</Text>
          </View>
          <View className="flex-row flex-wrap justify-between mb-8">
            <QuickActionItem
              icon="calendar"
              label="Timetable"
              bg="#FAF5FF"
              iconColor="#A855F7"
              onPress={() => router.push('/(student)/schedule')}
            />
            <QuickActionItem
              icon="book"
              label="Subjects"
              bg="#ECFDF5"
              iconColor="#10B981"
              onPress={() => router.push('/(student)/academics')}
            />
            <QuickActionItem
              icon="podium"
              label="Results"
              bg="#EFF6FF"
              iconColor="#3B82F6"
              onPress={() => router.push('/(student)/academics')}
            />
            <QuickActionItem
              icon="id-card"
              label="ID Card"
              bg="#FDF2F8"
              iconColor="#EC4899"
              onPress={() => router.push('/(student)/more')}
            />
          </View>
        </Animated.View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickActionItem({ icon, label, bg, iconColor, onPress }: any) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} className="items-center w-[22%] mb-4">
      <View
        className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
        style={{
          backgroundColor: bg,
          shadowColor: '#0f172a',
          shadowOpacity: 0.04,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        }}
      >
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text className="text-slate-500 text-[10px] font-semibold text-center">{label}</Text>
    </TouchableOpacity>
  );
}