import { useEffect } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useAuthStore } from '../../store/auth.store';
import { io } from 'socket.io-client';
import { baseOrigin } from '../api';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function usePushNotifications() {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isExpoGo || !isAuthenticated || !user) return;

    let Notifications: typeof import('expo-notifications') | null = null;
    try {
      Notifications = require('expo-notifications');
      if (Notifications && Notifications.setNotificationHandler) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      }
    } catch (e) {
      // Ignore if notifications module cannot be initialized natively
    }

    if (Notifications) {
      try {
        Notifications.getPermissionsAsync()
          .then(({ status: existingStatus }) => {
            if (existingStatus !== 'granted') {
              Notifications?.requestPermissionsAsync();
            }
          })
          .catch(() => {});
      } catch (e) {
        // Ignore permission errors
      }
    }

    // 2. Connect to real-time Socket.io server
    const socket = io(baseOrigin, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      socket.emit('join-tenant', user.tenantId);
    });

    socket.on('new-notice', async (data: any) => {
      if (Notifications && Notifications.scheduleNotificationAsync) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: data.title || 'New Announcement',
              body: data.body || 'You have a new notice.',
              sound: true,
              priority: Notifications.AndroidNotificationPriority?.HIGH || 'high',
            },
            trigger: null,
          });
        } catch (e) {
          // Ignore
        }
      }
    });

    socket.on('new-event', async (data: any) => {
      if (Notifications && Notifications.scheduleNotificationAsync) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: data.title || 'New Event Created',
              body: data.body || 'A new event has been scheduled.',
              sound: true,
              priority: Notifications.AndroidNotificationPriority?.HIGH || 'high',
            },
            trigger: null,
          });
        } catch (e) {
          // Ignore
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, isAuthenticated]);
}
