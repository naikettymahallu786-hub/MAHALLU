import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '../../components/ui/TabBar';

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation, descriptors }) => {
        const routes = state.routes;
        const activeRoute = routes[state.index].name;

        const tabs = [
          { name: 'home', label: 'Home', icon: 'home-outline' as any, iconFocused: 'home' as any },
          { name: 'academics', label: 'Academics', icon: 'book-outline' as any, iconFocused: 'book' as any },
          { name: 'schedule', label: 'Schedule', icon: 'time-outline' as any, iconFocused: 'time' as any },
          { name: 'more', label: 'More', icon: 'menu-outline' as any, iconFocused: 'menu' as any },
        ];

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
      <Tabs.Screen name="academics" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="more" />
      
      {/* Hidden from tab bar */}
      <Tabs.Screen name="homework/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="exams/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
