import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TabBar } from '../../components/ui/TabBar';

export default function MemberLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation, descriptors }) => {
        const routes = state.routes;
        const activeRoute = routes[state.index].name;

        // The custom tab bar component handles the UI, we just need to map the config
        const tabs = [
          { name: 'home', label: 'Home', icon: 'home-outline' as any, iconFocused: 'home' as any },
          { name: 'family', label: 'Family', icon: 'people-outline' as any, iconFocused: 'people' as any },
          { name: 'services', label: 'Services', icon: 'grid-outline' as any, iconFocused: 'grid' as any },
          { name: 'more', label: 'More', icon: 'menu-outline' as any, iconFocused: 'menu' as any },
        ];

        // Hide tab bar for nested stack screens (like payments, events detail, etc.)
        const activeDescriptor = descriptors[routes[state.index].key];
        const tabBarStyle = activeDescriptor.options.tabBarStyle as any;
        if (tabBarStyle?.display === 'none') return null;

        return (
          <TabBar
            tabs={tabs}
            activeTab={activeRoute}
            onTabPress={(name) => {
              const event = navigation.emit({
                type: 'tabPress',
                target: routes.find(r => r.name === name)?.key || '',
                canPreventDefault: true,
              });

              if (!event.defaultPrevented) {
                navigation.navigate(name);
              }
            }}
          />
        );
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="family" />
      <Tabs.Screen name="services" />
      <Tabs.Screen name="more" />
      
      {/* Screens that should be hidden from bottom tab bar but part of the router */}
      <Tabs.Screen name="payments" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="children" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="events/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="events/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="ustadh/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="ustadh/class/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="ustadh/attendance/[classId]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="ustadh/notify/[classId]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
