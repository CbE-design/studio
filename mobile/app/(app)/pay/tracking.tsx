import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAllTransactions } from '@/hooks/useAllTransactions';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Transaction } from '@/lib/definitions';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];
const PRIMARY = '#00843d';

type Tab = 'pending' | 'processed';

export default function TrackingScreen() {
  const router = useRouter();
  const { transactions, isLoading } = useAllTransactions();
  const [activeTab, setActiveTab] = useState<Tab>('pending');

  const { pending, processed } = useMemo(() => {
    const list = transactions.filter(tx => tx.type === 'debit');
    return {
      pending: list.filter(tx => tx.status === 'PENDING_APPROVAL'),
      processed: list.filter(tx => tx.status !== 'PENDING_APPROVAL'),
    };
  }, [transactions]);

  const currentData = activeTab === 'pending' ? pending : processed;

  const renderItem = ({ item }: { item: Transaction }) => {
    const isPending = item.status === 'PENDING_APPROVAL';
    const isRejected = item.status === 'REJECTED';

    return (
      <TouchableOpacity
        onPress={() => router.push(`/account/${item.fromAccountId}/transaction/${item.id}`)}
        style={styles.card}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.dateLabel}>{formatDate(item.date, 'medium')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Text style={styles.recipientName} numberOfLines={1}>
              {(item.recipientName ?? item.description).toUpperCase()}
            </Text>
            {isPending && <Ionicons name="time" size={14} color="#d97706" />}
          </View>
          {isPending && (
            <Text style={styles.statusSub}>Awaiting Trustee signature</Text>
          )}
          {isRejected && (
             <Text style={[styles.statusSub, { color: '#dc2626' }]}>Instruction rejected by mandate</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amount, isRejected && styles.rejectedAmount]}>
            -{formatCurrency(item.amount)}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#d1d5db" style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tracking instructions</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('pending')}
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            AWAITING ({pending.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('processed')}
          style={[styles.tab, activeTab === 'processed' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'processed' && styles.activeTabText]}>
            PROCESSED
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={PRIMARY} size="large" />
        </View>
      ) : currentData.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name={activeTab === 'pending' ? 'time-outline' : 'checkmark-circle-outline'} size={64} color="#e5e7eb" />
          <Text style={styles.emptyText}>
            {activeTab === 'pending' 
              ? 'No instructions awaiting authorisation.' 
              : 'No processed payments found.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: PRIMARY,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 1,
  },
  activeTabText: {
    color: PRIMARY,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' },
  recipientName: { fontSize: 14, fontWeight: '700', color: '#374151', flexShrink: 1 },
  statusSub: { fontSize: 11, color: '#d97706', marginTop: 2, fontWeight: '600' },
  amount: { fontSize: 15, fontWeight: '700', color: '#111827' },
  rejectedAmount: { color: '#d1d5db', textDecorationLine: 'line-through' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center', marginTop: 16, fontWeight: '500' },
});
