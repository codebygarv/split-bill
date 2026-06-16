import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Theme.colors.background },
        tabBarActiveTintColor: Theme.colors.primary,
      }}
    >
      <Tabs.Screen name="dashboard" options={{
        title: 'Home',
        tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />
      }} />
      <Tabs.Screen name="members" options={{
        title: 'Members',
        tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />
      }} />
      <Tabs.Screen name="notifications" options={{
        title: 'Activity',
        tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />
      }} />
    </Tabs>
  );
}
