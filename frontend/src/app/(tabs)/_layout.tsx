import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { Platform, Pressable } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Theme.colors.background },
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          backgroundColor: Theme.colors.surface,
        },
        tabBarButton: ({ ref, ...rest }) => (
          <Pressable
            {...rest}
            ref={ref as any}
            android_ripple={null}
            style={({ pressed }) => [
              rest.style,
              Platform.select({
                web: {
                  outlineStyle: 'none',
                } as any,
              }),
            ]}
          />
        ),
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

