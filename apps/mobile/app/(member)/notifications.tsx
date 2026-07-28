import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../../lib/hooks/useNotifications';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { EmptyState } from '../../components/ui/EmptyState';
import { NotificationItem } from '../../components/NotificationItem';

const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const CREAM = '#FBF8F2';

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading, refetch } = useNotifications();

  if (isLoading) return <LoadingScreen message="Loading notifications..." />;

  // Determine type from channel or basic heuristics
  const getType = (notif: any) => {
    if (notif.title?.toLowerCase().includes('payment') || notif.title?.toLowerCase().includes('due')) return 'payment';
    if (notif.title?.toLowerCase().includes('event') || notif.title?.toLowerCase().includes('invite')) return 'event';
    if (notif.title?.toLowerCase().includes('urgent')) return 'alert';
    return 'general';
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: CREAM }} edges={['top']}>
      <View className="px-5 pt-2 pb-4 flex-row items-center border-b border-slate-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={TEAL_DARK} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: TEAL_DARK }}>Notifications</Text>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={TEAL} />}
      >
        {!notifications || notifications.length === 0 ? (
          <EmptyState 
            icon="notifications-off-outline" 
            title="All Caught Up!" 
            message="You don't have any new notifications." 
          />
        ) : (
          <View className="pb-8">
            {notifications.map((notif: any) => (
              <NotificationItem 
                key={notif._id}
                title={notif.title}
                body={notif.body}
                date={notif.createdAt}
                isRead={notif.status === 'delivered'}
                type={getType(notif)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
