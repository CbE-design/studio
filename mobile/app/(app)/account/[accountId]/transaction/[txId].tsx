import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Account, Transaction } from '@/lib/definitions';

const PRIMARY = '#00843d';

type DetailRowProps = { label: string; value?: string | null };

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={{
      paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    }}>
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: '#111827', fontSize: 16 }}>{value ?? '-'}</Text>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ backgroundColor: PRIMARY, padding: 16, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 12 }} />
        <View style={{ width: 140, height: 18, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' }} />
      </View>
      <View style={{ padding: 20, gap: 16 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i}>
            <View style={{ width: 80, height: 12, borderRadius: 6, backgroundColor: '#e5e7eb', marginBottom: 8 }} />
            <View style={{ width: '100%', height: 18, borderRadius: 6, backgroundColor: '#f3f4f6' }} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { accountId, txId } = useLocalSearchParams<{ accountId: string; txId: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accountId || !txId) {
      setIsLoading(false);
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const [txSnap, accSnap] = await Promise.all([
          getDoc(doc(firestore, 'users', uid, 'bankAccounts', accountId, 'transactions', txId)),
          getDoc(doc(firestore, 'users', uid, 'bankAccounts', accountId)),
        ]);
        if (txSnap.exists()) setTransaction({ id: txSnap.id, ...txSnap.data() } as Transaction);
        if (accSnap.exists()) setAccount({ id: accSnap.id, ...accSnap.data() } as Account);
      } catch {
        // fetch failed
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [accountId, txId]);

  const handleShare = async () => {
    if (!transaction) return;
    const isNegative = transaction.type === 'debit';
    const msg = [
      `Nedbank Proof of Payment`,
      `Recipient: ${transaction.recipientName ?? transaction.description}`,
      `Amount: ${isNegative ? '-' : '+'}${formatCurrency(transaction.amount, account?.currency)}`,
      `Date: ${formatDate(transaction.date, 'full')}`,
      `Reference: ${transaction.popReferenceNumber ?? transaction.yourReference ?? '-'}`,
    ].join('\n');
    try {
      await Share.share({ message: msg });
    } catch {
      // share cancelled or failed
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ color: '#374151', fontSize: 16, marginTop: 12 }}>Transaction not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCredit = transaction.type === 'credit';
  const isReturn = transaction.description.startsWith('RETURN:');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Transaction details</Text>
      </View>

      <View style={{
        alignItems: 'center', paddingVertical: 24,
        borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
      }}>
        <View style={{
          width: 60, height: 60, borderRadius: 30,
          backgroundColor: isCredit ? '#dcfce7' : '#fee2e2',
          alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        }}>
          <Ionicons
            name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={28}
            color={isCredit ? '#16a34a' : '#dc2626'}
          />
        </View>
        <Text style={{ color: isCredit ? '#16a34a' : '#dc2626', fontSize: 28, fontWeight: '800' }}>
          {isCredit ? '+' : '-'}{formatCurrency(transaction.amount, account?.currency)}
        </Text>
        <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>
          {formatDate(transaction.date, 'full')}
        </Text>
        {transaction.status && (
          <View style={{
            marginTop: 8,
            backgroundColor: transaction.status === 'SUCCESS' ? '#dcfce7'
              : transaction.status === 'FAILED' ? '#fee2e2'
              : '#fef3c7',
            borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4,
          }}>
            <Text style={{
              color: transaction.status === 'SUCCESS' ? '#16a34a'
                : transaction.status === 'FAILED' ? '#dc2626'
                : '#d97706',
              fontSize: 12, fontWeight: '600',
            }}>
              {transaction.status}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 24 }}>
        <DetailRow label="Recipient" value={transaction.recipientName ?? transaction.description} />
        <DetailRow label="Their reference" value={transaction.recipientReference} />
        <DetailRow label="Your reference" value={transaction.yourReference} />
        <DetailRow label="Bank" value={transaction.bank} />
        <DetailRow label="Account number" value={transaction.accountNumber} />
        <DetailRow
          label="Transaction type"
          value={isReturn ? 'Reversal / Return' : isCredit ? 'Credit' : 'Payment'}
        />
        <DetailRow label="POP reference" value={transaction.popReferenceNumber} />
        <DetailRow label="Status" value={transaction.status} />
      </ScrollView>

      <View style={{
        padding: 16, backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: '#f3f4f6',
        gap: 10,
      }}>
        <TouchableOpacity
          onPress={handleShare}
          style={{
            backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="share-outline" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            Share proof of payment
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            borderRadius: 12, paddingVertical: 14,
            alignItems: 'center', borderWidth: 1, borderColor: PRIMARY,
          }}
          activeOpacity={0.85}
        >
          <Text style={{ color: PRIMARY, fontSize: 16, fontWeight: '600' }}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
