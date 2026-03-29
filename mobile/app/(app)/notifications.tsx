import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '@/lib/firebase';
import { triggerUnreadRefresh } from '@/hooks/useUnreadCount';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Transaction } from '@/lib/definitions';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';
const READ_IDS_KEY = 'readTransactionIds';

type NotificationItem = Transaction & { accountId: string };

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setIsLoading(false); return; }
    try {
      const accountsSnap = await getDocs(collection(firestore, 'users', uid, 'bankAccounts'));
      const all: NotificationItem[] = [];
      await Promise.all(
        accountsSnap.docs.map(async (accDoc) => {
          const txSnap = await getDocs(collection(firestore, 'users', uid, 'bankAccounts', accDoc.id, 'transactions'));
          txSnap.docs.forEach((d) => {
            all.push({ id: d.id, ...d.data(), accountId: accDoc.id } as NotificationItem);
          });
        }),
      );
      all.sort((a, b) => {
        const da = new Date(typeof a.date === 'string' ? a.date : (a.date as unknown as { toDate: () => Date }).toDate()).getTime();
        const db = new Date(typeof b.date === 'string' ? b.date : (b.date as unknown as { toDate: () => Date }).toDate()).getTime();
        return db - da;
      });
      setItems(all);

      const stored = await AsyncStorage.getItem(READ_IDS_KEY);
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      setReadIds(new Set(parsed));
    } catch {
      // fetch failed
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const markRead = async (id: string) => {
    if (readIds.has(id)) return;
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...next]));
    triggerUnreadRefresh();
  };

  const handleToggle = (item: NotificationItem) => {
    setExpanded((prev) => (prev === item.id ? null : item.id));
    markRead(item.id);
  };

  const filtered = items.filter((tx) => {
    const desc = tx.recipientName ?? tx.description;
    return (
      desc.toLowerCase().includes(search.toLowerCase()) ||
      (tx.bank ?? '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const unreadCount = items.filter((tx) => !readIds.has(tx.id)).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
            <Ionicons name={'arrow-back' as IoniconsName} size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' }}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={{ backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                {unreadCount > 99 ? '99+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.searchBar}>
          <Ionicons name={'search-outline' as IoniconsName} size={16} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={PRIMARY} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Ionicons name={'notifications-off-outline' as IoniconsName} size={56} color="#d1d5db" />
          <Text style={{ color: '#6b7280', fontSize: 16, fontWeight: '600', marginTop: 16 }}>
            {search ? 'No matches' : 'No notifications'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isRead = readIds.has(item.id);
            const isExp = expanded === item.id;
            const desc = item.recipientName ? `Payment: ${item.recipientName}` : item.description;
            return (
              <TouchableOpacity
                onPress={() => handleToggle(item)}
                activeOpacity={0.85}
                style={[styles.notifCard, !isRead && styles.notifUnread]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  {!isRead && <View style={styles.dot} />}
                  <View style={{ flex: 1, marginLeft: isRead ? 0 : 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={[styles.notifDesc, !isRead && { fontWeight: '700' }]} numberOfLines={isExp ? undefined : 1}>
                        {desc.toUpperCase()}
                      </Text>
                      <Text style={[styles.notifAmount, !isRead && { fontWeight: '700' }]}>
                        {formatCurrency(item.amount, 'ZAR')}
                      </Text>
                    </View>
                    <Text style={styles.notifDate}>{formatDate(item.date, 'full')}</Text>
                    {isExp && (
                      <View style={{ marginTop: 12, gap: 8 }}>
                        {item.bank && <InfoRow label="Bank / Location" value={item.bank} />}
                        {item.accountNumber && <InfoRow label="Account number" value={item.accountNumber} />}
                        {item.recipientReference && <InfoRow label="Reference" value={item.recipientReference} />}
                        <InfoRow label="Type" value={item.type === 'credit' ? 'Credit' : 'Debit'} />
                        <TouchableOpacity
                          onPress={() => router.push(`/account/${item.accountId}/transaction/${item.id}`)}
                          style={styles.viewBtn}
                        >
                          <Text style={{ color: PRIMARY, fontWeight: '600', fontSize: 13 }}>View full details</Text>
                          <Ionicons name={'arrow-forward' as IoniconsName} size={14} color={PRIMARY} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <Ionicons
                    name={(isExp ? 'chevron-up' : 'chevron-down') as IoniconsName}
                    size={16}
                    color="#9ca3af"
                    style={{ marginLeft: 8, marginTop: 2 }}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontSize: 11, color: '#9ca3af' }}>{label}</Text>
      <Text style={{ fontSize: 14, color: '#374151', fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1, color: '#111827', paddingVertical: 8, paddingHorizontal: 8, fontSize: 14,
  },
  notifCard: {
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    padding: 16,
  },
  notifUnread: {
    backgroundColor: '#f0faf4',
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: PRIMARY, marginTop: 6,
  },
  notifDesc: {
    flex: 1, fontSize: 14, color: '#111827', marginRight: 12,
  },
  notifAmount: {
    fontSize: 14, color: '#111827',
  },
  notifDate: {
    fontSize: 12, color: '#9ca3af', marginTop: 4,
  },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
  },
});
