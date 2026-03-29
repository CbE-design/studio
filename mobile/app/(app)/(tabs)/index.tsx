import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useAllTransactions } from '@/hooks/useAllTransactions';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ComponentProps } from 'react';
import type { Account, Transaction } from '@/lib/definitions';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';

type WidgetConfig = { label: string; icon: IoniconsName; isNew?: boolean };

const widgets: WidgetConfig[] = [
  { label: 'Approvals', icon: 'checkmark-circle-outline', isNew: true },
  { label: 'Applications', icon: 'document-text-outline' },
  { label: 'Insure', icon: 'umbrella-outline' },
  { label: 'Shop', icon: 'cart-outline' },
  { label: 'Latest', icon: 'gift-outline' },
  { label: 'Quick Pay', icon: 'swap-horizontal-outline' },
  { label: 'Get cash', icon: 'business-outline' },
  { label: 'Home loans', icon: 'home-outline' },
  { label: 'Statements\nand docs', icon: 'copy-outline' },
];

function WidgetItem({ label, icon, isNew }: WidgetConfig) {
  return (
    <TouchableOpacity
      style={{ width: '25%', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 }}
      activeOpacity={0.7}
    >
      <View style={{
        width: 72, height: 72,
        backgroundColor: '#ffffff', borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
        borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden',
      }}>
        {isNew && (
          <View style={{
            position: 'absolute', top: -8, left: -14,
            backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 3,
            transform: [{ rotate: '-45deg' }], zIndex: 1,
          }}>
            <Text style={{ color: '#fff', fontSize: 7, fontWeight: '800', letterSpacing: 0.5 }}>NEW</Text>
          </View>
        )}
        <Ionicons name={icon} size={28} color={PRIMARY} />
      </View>
      <Text style={{
        fontSize: 11, color: '#374151', textAlign: 'center',
        marginTop: 6, lineHeight: 15, height: 32,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function AccountCard({ account }: { account: Account }) {
  const router = useRouter();
  const masked = account.accountNumber
    ? `•••• ${account.accountNumber.slice(-4)}`
    : '••••';
  const isNegative = account.balance < 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/account/${account.id}`)}
      style={{
        backgroundColor: PRIMARY, borderRadius: 20,
        padding: 20, marginRight: 12, width: 260,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
      }}
      activeOpacity={0.85}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <View>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {account.type}
          </Text>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
            {account.name}
          </Text>
        </View>
        <Ionicons name="card-outline" size={22} color="rgba(255,255,255,0.7)" />
      </View>
      <Text style={{
        color: isNegative ? '#fca5a5' : '#fff',
        fontSize: 24, fontWeight: '700', marginBottom: 16,
      }}>
        {formatCurrency(account.balance, account.currency)}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, letterSpacing: 1 }}>
          {masked}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
          {account.currency}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function AccountSkeleton() {
  return (
    <View style={{
      width: 260, height: 150, borderRadius: 20, marginRight: 12,
      backgroundColor: 'rgba(255,255,255,0.3)',
    }} />
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === 'credit';
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: isCredit ? '#dcfce7' : '#fee2e2',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
      }}>
        <Ionicons
          name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={16}
          color={isCredit ? '#16a34a' : '#dc2626'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#111827', fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
          {tx.recipientName ?? tx.description}
        </Text>
        <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
          {formatDate(tx.date, 'short')}
        </Text>
      </View>
      <Text style={{ color: isCredit ? '#16a34a' : '#111827', fontSize: 14, fontWeight: '600' }}>
        {isCredit ? '+' : '-'}{formatCurrency(tx.amount, 'ZAR')}
      </Text>
    </View>
  );
}

export default function OverviewScreen() {
  const { appUser, logOut } = useAuth();
  const { accounts, isLoading: accountsLoading, totalBalance } = useAccounts();
  const { transactions, isLoading: txLoading } = useAllTransactions();
  const recentTxs = transactions.slice(0, 5);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="menu" size={24} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              {appUser?.firstName ? `Hi, ${appUser.firstName}` : 'MoneyGO'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <TouchableOpacity onPress={logOut}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {accountsLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <AccountSkeleton />
            <AccountSkeleton />
          </ScrollView>
        ) : accounts.length > 0 ? (
          <FlatList
            data={accounts}
            keyExtractor={(a) => a.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <AccountCard account={item} />}
            ListFooterComponent={
              <View style={{
                width: 200, height: 150, borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.12)',
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Ionicons name="add-circle-outline" size={32} color="rgba(255,255,255,0.7)" />
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8 }}>
                  Total: {formatCurrency(totalBalance)}
                </Text>
              </View>
            }
          />
        ) : (
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 16, padding: 20,
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>No accounts found</Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#374151', marginBottom: 16 }}>
          My widgets
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {widgets.map((w) => (
            <WidgetItem key={w.label} label={w.label} icon={w.icon} isNew={w.isNew} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151' }}>
            Recent transactions
          </Text>
          {txLoading && <ActivityIndicator size="small" color={PRIMARY} />}
        </View>

        <View style={{
          backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16,
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
        }}>
          {txLoading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5e7eb', marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <View style={{ width: '60%', height: 14, borderRadius: 6, backgroundColor: '#e5e7eb', marginBottom: 6 }} />
                  <View style={{ width: '35%', height: 11, borderRadius: 5, backgroundColor: '#f3f4f6' }} />
                </View>
                <View style={{ width: 56, height: 14, borderRadius: 6, backgroundColor: '#e5e7eb' }} />
              </View>
            ))
          ) : recentTxs.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={36} color="#d1d5db" />
              <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 8 }}>
                No transactions yet
              </Text>
            </View>
          ) : (
            recentTxs.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
