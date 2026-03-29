import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';
const INACTIVE = '#9ca3af';

function TabBarIcon({ name, color, size }: { name: IoniconsName; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="radio-button-on-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cards',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="card-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="transact"
        options={{
          title: 'Transact',
          tabBarIcon: ({ color, size }) => (
            <View
              style={{
                width: 40,
                height: 40,
                backgroundColor: color === PRIMARY ? PRIMARY : '#e5e7eb',
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <TabBarIcon name="add" color={color === PRIMARY ? '#fff' : INACTIVE} size={20} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="recipients"
        options={{
          title: 'Recipients',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="person-add-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="ellipsis-horizontal" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
