import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { useRouter } from 'expo-router';

export default function AdminHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView className="flex-1 p-6">
        {/* Welcome Section */}
        <View className="mb-8">
          <Text className="text-zinc-400 text-sm">Welcome back,</Text>
          <Text className="text-white text-2xl font-extrabold mt-1">{user?.name || 'Administrator'}</Text>
          <Text className="text-emerald-500 text-xs font-semibold uppercase tracking-wider mt-1">{user?.role || 'SUPER_ADMIN'}</Text>
        </View>

        {/* Info Card */}
        <View className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-6">
          <Text className="text-white text-lg font-bold mb-4">Mahallu Profile</Text>
          
          <View className="space-y-4">
            <View>
              <Text className="text-zinc-500 text-xs">Email</Text>
              <Text className="text-zinc-200 text-sm mt-0.5">{user?.email || 'N/A'}</Text>
            </View>

            <View className="mt-3">
              <Text className="text-zinc-500 text-xs">Phone</Text>
              <Text className="text-zinc-200 text-sm mt-0.5">{user?.phone || 'N/A'}</Text>
            </View>

            <View className="mt-3">
              <Text className="text-zinc-500 text-xs">Tenant ID</Text>
              <Text className="text-zinc-200 text-sm mt-0.5">{user?.tenantId || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-8">
          <Text className="text-white text-lg font-bold mb-4">System Actions</Text>
          <Text className="text-zinc-400 text-sm mb-6">Mobile management features are fully connected to the backend API.</Text>

          <TouchableOpacity
            onPress={handleLogout}
            className="bg-emerald-600 active:bg-emerald-700 py-3.5 rounded-xl items-center"
          >
            <Text className="text-white font-bold text-sm">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
