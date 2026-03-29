import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';

type MoreItem = { label: string; icon: IoniconsName };
type MoreSection = { section: string; items: MoreItem[] };

const moreItems: MoreSection[] = [
  { section: 'Services', items: [
    { label: 'AI Financial Tips', icon: 'bulb-outline' },
    { label: 'Locate ATM / Branch', icon: 'location-outline' },
    { label: 'Notifications', icon: 'notifications-outline' },
    { label: 'Documents', icon: 'document-outline' },
    { label: 'Approvals', icon: 'checkmark-circle-outline' },
  ]},
  { section: 'System', items: [
    { label: 'CBS Integration', icon: 'server-outline' },
    { label: 'SAP ERP Sync', icon: 'sync-outline' },
  ]},
  { section: 'Account', items: [
    { label: 'Profile settings', icon: 'person-outline' },
    { label: 'Security', icon: 'lock-closed-outline' },
    { label: 'Help & Support', icon: 'help-circle-outline' },
  ]},
];

export default function MoreScreen() {
  const { appUser, logOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logOut },
    ]);
  };

  const displayName = appUser?.firstName && appUser?.lastName
    ? `${appUser.firstName} ${appUser.lastName}`
    : appUser?.email ?? 'User';

  const initial = appUser?.firstName?.charAt(0) ?? appUser?.email?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>More</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 1,
        }}>
          <View style={{
            width: 52,
            height: 52,
            backgroundColor: '#e8f5ee',
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}>
            <Text style={{ color: PRIMARY, fontSize: 20, fontWeight: '700' }}>{initial}</Text>
          </View>
          <View>
            <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700' }}>{displayName}</Text>
            <Text style={{ color: '#6b7280', fontSize: 13 }}>{appUser?.email ?? ''}</Text>
          </View>
        </View>

        {moreItems.map((section) => (
          <View key={section.section} style={{ marginBottom: 20 }}>
            <Text style={{ color: '#9ca3af', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
              {section.section}
            </Text>
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 1,
            }}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderBottomWidth: idx < section.items.length - 1 ? 1 : 0,
                    borderBottomColor: '#f3f4f6',
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 36,
                    height: 36,
                    backgroundColor: '#e8f5ee',
                    borderRadius: 9,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name={item.icon} size={18} color={PRIMARY} />
                  </View>
                  <Text style={{ flex: 1, color: '#111827', fontSize: 15 }}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            borderWidth: 1,
            borderColor: '#fee2e2',
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '600' }}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
