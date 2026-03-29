import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';

type MoreItem = { label: string; icon: IoniconsName; route?: string; badge?: string; badgeColor?: string };
type MoreSection = { section: string; items: MoreItem[] };

const moreItems: MoreSection[] = [
  {
    section: 'Services',
    items: [
      { label: 'AI Financial Tips', icon: 'bulb-outline', route: '/(app)/tips' },
      { label: 'AI Chat Support', icon: 'chatbubbles-outline', route: '/(app)/ai-chat' },
      { label: 'Notifications', icon: 'notifications-outline', route: '/(app)/notifications' },
      { label: 'Documents & Statements', icon: 'document-outline', route: '/(app)/documents' },
      { label: 'Approvals', icon: 'checkmark-circle-outline' },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'CBS Integration', icon: 'server-outline', badge: 'Online', badgeColor: '#16a34a' },
      { label: 'SAP ERP Sync', icon: 'sync-outline', badge: 'Synced', badgeColor: '#2563eb' },
    ],
  },
  {
    section: 'Account',
    items: [
      { label: 'Profile settings', icon: 'person-outline' },
      { label: 'Security', icon: 'lock-closed-outline' },
      { label: 'Help & Support', icon: 'help-circle-outline', route: '/(app)/ai-chat' },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();
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

  const handlePress = (item: MoreItem) => {
    if (item.route) {
      router.push(item.route as Parameters<typeof router.push>[0]);
    } else {
      Alert.alert('Coming soon', `${item.label} will be available in a future update.`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>More</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={{ color: PRIMARY, fontSize: 20, fontWeight: '700' }}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{appUser?.email ?? ''}</Text>
          </View>
        </View>

        {moreItems.map((section) => (
          <View key={section.section} style={{ marginBottom: 20 }}>
            <Text style={styles.sectionLabel}>{section.section}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => handlePress(item)}
                  style={[
                    styles.row,
                    idx < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconBox}>
                    <Ionicons name={item.icon} size={18} color={PRIMARY} />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: item.badgeColor ?? '#6b7280' }]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Ionicons name={'chevron-forward' as IoniconsName} size={16} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name={'log-out-outline' as IoniconsName} size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '600' }}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>MoneyGO v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  avatar: {
    width: 52, height: 52, backgroundColor: '#e8f5ee',
    borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  profileName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  profileEmail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  sectionLabel: {
    color: '#9ca3af', fontSize: 12, fontWeight: '600',
    letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
  },
  iconBox: {
    width: 36, height: 36, backgroundColor: '#e8f5ee',
    borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowLabel: { flex: 1, color: '#111827', fontSize: 15 },
  badge: {
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, marginRight: 8,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  logoutBtn: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, borderWidth: 1, borderColor: '#fee2e2',
  },
  version: {
    textAlign: 'center', fontSize: 11, color: '#d1d5db',
    marginBottom: 32, textTransform: 'uppercase', letterSpacing: 1,
  },
});
