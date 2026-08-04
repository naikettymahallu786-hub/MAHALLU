import { useEffect } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useAuthStore } from '../../store/auth.store';
import { io } from 'socket.io-client';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import('expo-notifications') | null = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    // expo-notifications not available or failed to load
  }
}

export function usePushNotifications() {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // 1. Request notifications permissions if available (not in Expo Go)
    if (!isExpoGo && Notifications) {
      try {
        Notifications.getPermissionsAsync().then(({ status: existingStatus }) => {
          if (existingStatus !== 'granted') {
            Notifications?.requestPermissionsAsync();
          }
        }).catch(() => {});
      } catch (e) {
        // Ignore permission errors in restricted environments
      }
    }

    // 2. Connect to real-time Socket.io server
    const socket = io('https://mahallu-4d9t.onrender.com');

    socket.on('connect', () => {
      socket.emit('join-tenant', user.tenantId);
    });

    socket.on('new-notice', async (data: any) => {
      if (!isExpoGo && Notifications) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: data.title || 'New Announcement',
              body: data.body || 'You have a new notice.',
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null,
          });
        } catch (e) {
          // Ignore scheduling errors
        }
      }
    });

    socket.on('new-event', async (data: any) => {
      if (!isExpoGo && Notifications) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: data.title || 'New Event Created',
              body: data.body || 'A new event has been scheduled.',
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null,
          });
        } catch (e) {
          // Ignore scheduling errors
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, isAuthenticated]);
}
