import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Account, Transaction } from '@/lib/definitions';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

type DetailRowProps = { label: string; value?: string | null };

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
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

type ShareMode = 'email' | 'share' | null;
type ToastState = { message: string; variant: 'success' | 'error' } | null;

function InAppToast({ toast }: { toast: ToastState }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [toast, opacity]);

  if (!toast) return null;
  return (
    <Animated.View style={[toastStyles.container, { opacity, backgroundColor: toast.variant === 'success' ? '#16a34a' : '#dc2626' }]}>
      <Text style={toastStyles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute', top: 80, left: 16, right: 16,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    zIndex: 9999, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
  text: { color: '#fff', fontWeight: '600', fontSize: 14, textAlign: 'center' },
});

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { accountId, txId } = useLocalSearchParams<{ accountId: string; txId: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>(null);
  const [emailInput, setEmailInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, variant: 'success' | 'error') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, variant });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    if (!accountId || !txId) { setIsLoading(false); return; }
    const uid = auth.currentUser?.uid;
    if (!uid) { setIsLoading(false); return; }
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

  const handleNativeShare = async () => {
    if (!transaction) return;
    const isNegative = transaction.type === 'debit';
    const msg = [
      'MoneyGO Proof of Payment',
      `Recipient: ${transaction.recipientName ?? transaction.description}`,
      `Amount: ${isNegative ? '-' : '+'}${formatCurrency(transaction.amount, account?.currency)}`,
      `Date: ${formatDate(transaction.date, 'full')}`,
      `Reference: ${transaction.popReferenceNumber ?? transaction.yourReference ?? '-'}`,
    ].join('\n');
    try {
      await Share.share({ message: msg });
    } catch {
      // cancelled
    }
  };

  const handleSendEmail = async () => {
    if (!transaction || !emailInput.trim()) return;
    setIsSending(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/api/email/pop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken ?? ''}`,
        },
        body: JSON.stringify({ transaction, recipientEmail: emailInput.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) throw new Error(data.message ?? 'Failed to send');
      setShareMode(null);
      setShareSheetOpen(false);
      setEmailInput('');
      showToast('Proof of payment email sent successfully.', 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      showToast(msg || 'Failed to send email.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name={'alert-circle-outline' as IoniconsName} size={48} color="#ef4444" />
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
  const canShare = !isReturn && !isCredit;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <InAppToast toast={toast} />
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name={'arrow-back' as IoniconsName} size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Transaction details</Text>
      </View>

      <View style={{ alignItems: 'center', paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <View style={{
          width: 60, height: 60, borderRadius: 30,
          backgroundColor: isCredit ? '#dcfce7' : '#fee2e2',
          alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        }}>
          <Ionicons
            name={(isCredit ? 'arrow-down-outline' : 'arrow-up-outline') as IoniconsName}
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
            backgroundColor: transaction.status === 'SUCCESS' ? '#dcfce7' : transaction.status === 'FAILED' ? '#fee2e2' : '#fef3c7',
            borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4,
          }}>
            <Text style={{
              color: transaction.status === 'SUCCESS' ? '#16a34a' : transaction.status === 'FAILED' ? '#dc2626' : '#d97706',
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
        <DetailRow label="Transaction type" value={isReturn ? 'Reversal / Return' : isCredit ? 'Credit' : 'Payment'} />
        <DetailRow label="POP reference" value={transaction.popReferenceNumber} />
        <DetailRow label="Status" value={transaction.status} />
      </ScrollView>

      <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 10 }}>
        {canShare && (
          <TouchableOpacity
            onPress={() => setShareSheetOpen(true)}
            style={styles.primaryBtn}
            activeOpacity={0.85}
          >
            <Ionicons name={'share-outline' as IoniconsName} size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Share proof of payment</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.outlineBtn}
          activeOpacity={0.85}
        >
          <Text style={{ color: PRIMARY, fontSize: 16, fontWeight: '600' }}>Done</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={shareSheetOpen} transparent animationType="slide" onRequestClose={() => setShareSheetOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setShareSheetOpen(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Share Proof of Payment</Text>
          <TouchableOpacity
            onPress={() => { setShareSheetOpen(false); setShareMode('email'); }}
            style={styles.sheetRow}
          >
            <Ionicons name={'mail-outline' as IoniconsName} size={20} color={PRIMARY} style={{ marginRight: 12 }} />
            <Text style={styles.sheetRowText}>Send via Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setShareSheetOpen(false); handleNativeShare(); }}
            style={styles.sheetRow}
          >
            <Ionicons name={'share-social-outline' as IoniconsName} size={20} color={PRIMARY} style={{ marginRight: 12 }} />
            <Text style={styles.sheetRowText}>Share (SMS, WhatsApp…)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShareSheetOpen(false)}
            style={[styles.sheetRow, { borderBottomWidth: 0 }]}
          >
            <Ionicons name={'close-outline' as IoniconsName} size={20} color="#6b7280" style={{ marginRight: 12 }} />
            <Text style={[styles.sheetRowText, { color: '#6b7280' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={shareMode === 'email'} transparent animationType="slide" onRequestClose={() => setShareMode(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Send Proof of Payment</Text>
            <Text style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
              Enter the recipient's email address.
            </Text>
            <TextInput
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="name@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.emailInput}
            />
            <TouchableOpacity
              onPress={handleSendEmail}
              disabled={isSending || !emailInput.trim()}
              style={[styles.primaryBtn, { opacity: isSending || !emailInput.trim() ? 0.6 : 1, marginTop: 12, borderRadius: 12 }]}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Send Email</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShareMode(null)} style={{ paddingVertical: 14, alignItems: 'center', marginTop: 4 }}>
              <Text style={{ color: '#6b7280', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  primaryBtn: {
    backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  outlineBtn: {
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: PRIMARY,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#e5e7eb',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  sheetRowText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  emailInput: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: '#111827', backgroundColor: '#f9fafb',
  },
});
