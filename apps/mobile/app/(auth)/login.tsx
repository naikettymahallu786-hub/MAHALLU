import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const loginStore = useAuthStore();
  const [tenantCode, setTenantCode] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!tenantCode || !identifier || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login', {
        tenantCode,
        identifier,
        password,
      });

      const { user, tokens } = response.data.data;
      loginStore.login(user, tokens);
      
      // Redirect based on role
      switch (user.role) {
        case 'ustadh':
        case 'parent':
        case 'sadar_mualim':
          router.replace('/(member)/home');
          break;
        case 'student':
          router.replace('/(student)/home');
          break;
        default:
          router.replace('/(admin)/home');
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo / Header */}
          <View className="items-center mb-8 mt-12">
            <View className="w-24 h-24 bg-emerald-500 rounded-3xl items-center justify-center mb-6 shadow-lg shadow-emerald-500/40">
              <Text className="text-white text-5xl font-bold">م</Text>
            </View>
            <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">Mahallu ERP</Text>
            <Text className="text-emerald-600 text-sm mt-2 font-medium">Community Management Platform</Text>
          </View>

          {/* Form */}
          <View className="bg-white border border-slate-100 p-8 rounded-3xl shadow-xl shadow-slate-200/50">
            <Text className="text-slate-800 text-xl font-bold mb-6">Sign In to Continue</Text>

            {error ? (
              <View className="bg-rose-50 border border-rose-200 p-3 rounded-xl mb-5">
                <Text className="text-rose-600 text-xs font-semibold text-center">{error}</Text>
              </View>
            ) : null}

            {/* Tenant Code */}
            <View className="mb-5">
              <Text className="text-slate-600 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">Mahallu Code</Text>
              <TextInput
                placeholder="e.g. JMM001"
                placeholderTextColor="#94a3b8"
                value={tenantCode}
                onChangeText={setTenantCode}
                autoCapitalize="characters"
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 focus:bg-white"
              />
            </View>

            {/* Identifier */}
            <View className="mb-5">
              <Text className="text-slate-600 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">Email or Phone</Text>
              <TextInput
                placeholder="admin@mahallu.app"
                placeholderTextColor="#94a3b8"
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 focus:bg-white"
              />
            </View>

            {/* Password */}
            <View className="mb-8">
              <Text className="text-slate-600 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">Password</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 focus:bg-white"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-emerald-500 active:bg-emerald-600 rounded-2xl py-4 items-center shadow-lg shadow-emerald-500/30"
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text className="text-white font-bold text-sm">Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View className="mt-8 flex-row justify-center items-center">
              <Text className="text-slate-500 text-sm font-medium">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register-role')}>
                <Text className="text-emerald-600 font-bold text-sm">Register here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
