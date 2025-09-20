import { Tabs } from 'expo-router';
import { Home, Clock, BarChart3, Settings } from 'lucide-react-native';
import React from 'react';
import { useAppStore } from '@/hooks/useAppStore';

export default function TabLayout() {
  const { t } = useAppStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(1, 141, 54, 0.95)',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 90,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          tabBarTestID: 'ts-tab-home',
        }}
      />
      <Tabs.Screen
        name="entries"
        options={{
          title: t('timeEntries'),
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
          tabBarTestID: 'ts-tab-entries',
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('reports'),
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
          tabBarTestID: 'ts-tab-reports',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          tabBarTestID: 'ts-tab-settings',
        }}
      />
    </Tabs>
  );
}