import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatDate, groupDateLabel } from '@/lib/format';
import type { Account, Transaction } from '@/lib/definitions';

const PRIMARY = '#00843d';

type GroupedTransactions = Record<string, Transaction[]>;

const GROUP_ORDER = ['THIS WEEK', 'LAST WEEK', 'OLDER'];

function buildGrouped(txs: Transaction[]): GroupedTransactions {
  return txs.reduce<GroupedTransactions>((acc, tx) => {
    const label = groupDateLabel(tx.date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(tx);
    return acc;
  }, {});
}

type ListItem =
  | { kind: 'header'; label: string }
  | { kind: 'tx'; tx: Transaction };

function buildFlatData(grouped: GroupedTransactions): ListItem[] {
  const items: ListItem[] = [];
  for (const g of GROUP_ORDER) {
    const txs = grouped[g];
    if (txs && txs.length > 0) {
      items.push({ kind: 'header', label: g });
      for (const tx of txs) {
        items.push({ kind: 'tx', tx });
      }
    }
  }
  return items;
}

function AccountSkeleton() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: PRIMARY, padding: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 12 }} />
          <View>
            <View style={{ width: 160, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 6 }} />
            <View style={{ width: 100, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          </View>
        </View>
        <View style={{ width: 140, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' }} />
      </View>
      <View style={{ padding: 16, gap: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ height: 64, borderRadius: 12, backgroundColor: '#e5e7eb' }} />
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function AccountDetailScreen() {
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [search, setSearch] = useState('');

  const { transactions, isLoading: txLoading } = useTransactions(accountId ?? '');

  useEffect(() => {
    if (!accountId) {
      setIsAccountLoading(false);
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setIsAccountLoading(false);
      return;
    }
    const fetchAccount = async () => {
      try {
        const snap = await getDoc(doc(firestore, 'users', uid, 'bankAccounts', accountId));
        if (snap.exists()) {
          setAccount({ id: snap.id, ...snap.data() } as Account);
        }
      } catch {
        // account fetch failed
      } finally {
        setIsAccountLoading(false);
      }
    };
    fetchAccount();
  }, [accountId]);

  const filtered = search.trim()
    ? transactions.filter((tx) => {
        const q = search.toLowerCase();
        return (
          (tx.recipientName ?? tx.description).toLowerCase().includes(q) ||
          String(tx.amount).includes(q)
        );
      })
    : transactions;

  const grouped = buildGrouped(filtered);
  const flatData = buildFlatData(grouped);

  if (isAccountLoading) return <AccountSkeleton />;

  if (!account) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ color: '#374151', fontSize: 16, marginTop: 12 }}>Account not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isNegative = account.balance < 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{account.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                {account.accountNumber}
              </Text>
            </View>
          </View>
          <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.8)" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>Current balance</Text>
            <Text style={{ color: isNegative ? '#fca5a5' : '#fff', fontSize: 22, fontWeight: '700', marginTop: 2 }}>
              {formatCurrency(account.balance, account.currency)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>Available</Text>
            <Text style={{ color: isNegative ? '#fca5a5' : '#fff', fontSize: 22, fontWeight: '700', marginTop: 2 }}>
              {formatCurrency(account.balance, account.currency)}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions"
            placeholderTextColor="#9ca3af"
            style={{ flex: 1, fontSize: 14, color: '#111827' }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {txLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={PRIMARY} />
        </View>
      ) : flatData.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
          <Text style={{ color: '#9ca3af', fontSize: 15, marginTop: 12 }}>No transactions found</Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, idx) =>
            item.kind === 'header' ? `header-${item.label}` : `tx-${item.tx.id}-${idx}`
          }
          renderItem={({ item }) => {
            if (item.kind === 'header') {
              return (
                <View style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: '#6b7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                    {item.label}
                  </Text>
                </View>
              );
            }
            const tx = item.tx;
            const isCredit = tx.type === 'credit';
            return (
              <TouchableOpacity
                onPress={() => router.push(`/account/${accountId}/transaction/${tx.id}`)}
                style={{
                  backgroundColor: '#fff',
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
                  flexDirection: 'row', alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: isCredit ? '#dcfce7' : '#fee2e2',
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Ionicons
                    name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
                    size={18}
                    color={isCredit ? '#16a34a' : '#dc2626'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#111827', fontSize: 14, fontWeight: '500', textTransform: 'uppercase' }} numberOfLines={1}>
                    {tx.recipientName ?? tx.description}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                    {formatDate(tx.date, 'medium')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{
                    color: isCredit ? '#16a34a' : '#dc2626',
                    fontSize: 14, fontWeight: '600',
                  }}>
                    {isCredit ? '+' : '-'}{formatCurrency(tx.amount, account.currency)}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#d1d5db" style={{ marginTop: 4 }} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
