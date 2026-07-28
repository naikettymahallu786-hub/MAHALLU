import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../../store/auth.store';
import { io } from 'socket.io-client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // 1. Request notifications permissions
    const requestPermissions = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    };
    requestPermissions();

    // 2. Connect to real-time Socket.io server
    const socket = io('https://mahallu-backend-clae.onrender.com');

    socket.on('connect', () => {
      socket.emit('join-tenant', user.tenantId);
    });

    socket.on('new-notice', async (data: any) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title || 'New Announcement',
          body: data.body || 'You have a new notice.',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    });

    socket.on('new-event', async (data: any) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title || 'New Event Created',
          body: data.body || 'A new event has been scheduled.',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, isAuthenticated]);
}
