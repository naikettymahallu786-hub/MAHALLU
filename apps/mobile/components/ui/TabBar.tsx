import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (name: string) => void;
}

export function TabBar({ tabs, activeTab, onTabPress }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white border-t border-slate-100 flex-row"
      style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 16 }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => onTabPress(tab.name)}
            className="flex-1 items-center pt-2 pb-1"
            activeOpacity={0.7}
          >
            <View className={`items-center ${isActive ? '' : 'opacity-50'}`}>
              {isActive && (
                <View className="absolute -top-2 w-5 h-0.5 bg-emerald-500 rounded-full" />
              )}
              <Ionicons
                name={isActive ? tab.iconFocused : tab.icon}
                size={22}
                color={isActive ? '#10b981' : '#94a3b8'}
              />
              <Text
                className={`text-[10px] mt-0.5 font-semibold ${
                  isActive ? 'text-emerald-500' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
