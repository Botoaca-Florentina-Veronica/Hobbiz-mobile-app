import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import CustomTabBar from '@/components/navigation/CustomTabBar';
import { TabBarProvider } from '@/src/context/TabBarContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <TabBarProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
      <Tabs.Screen name="index" options={{ title: 'Explorează' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favorite' }} />
      <Tabs.Screen name="sell" options={{ title: 'Vinde' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="account" options={{ title: 'Cont' }} />
      </Tabs>
    </TabBarProvider>
  );
}
