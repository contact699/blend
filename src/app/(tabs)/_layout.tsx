import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Heart, MessageCircle, User, Mail, Sparkles, CalendarDays } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#27272a',
          borderTopWidth: 1,
          height: 85,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#c084fc',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-purple-500/20 p-2 rounded-full' : 'p-2'}>
              <Sparkles size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-purple-500/20 p-2 rounded-full' : 'p-2'}>
              <CalendarDays size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: 'Likes',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-purple-500/20 p-2 rounded-full' : 'p-2'}>
              <Heart size={22} color={color} fill={focused ? color : 'transparent'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="pinds"
        options={{
          title: 'Pings',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-purple-500/20 p-2 rounded-full' : 'p-2'}>
              <Mail size={22} color={color} fill={focused ? color : 'transparent'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-purple-500/20 p-2 rounded-full' : 'p-2'}>
              <MessageCircle size={22} color={color} fill={focused ? color : 'transparent'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-purple-500/20 p-2 rounded-full' : 'p-2'}>
              <User size={22} color={color} fill={focused ? color : 'transparent'} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
