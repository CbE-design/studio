import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { usePayment } from '@/context/PaymentContext';
import { formatCurrency } from '@/lib/format';
import type { Account } from '@/lib/definitions';

const PRIMARY = '#00843d';

function calculateFee(amount: number, paymentType: string, accountType: string): number {
  if (accountType === 'Cheque' || accountType === 'Savings') {
    if (paymentType === 'Instant Pay') return 40;
    return 1;
  }
  if (accountType === 'Student') {
    if (paymentType === 'Instant Pay') return 10;
    return 0;
  }
  return 0;
}

export default function AmountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { payment, setPayment } = usePayment();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(payment.amount || '');
  const [yourReference, setYourReference] = useState(payment.yourReference || '');
  const [recipientReference, setRecipientReference] = useState(payment.recipientReference || '');
  const [notifyEmail, setNotifyEmail] = useState(payment.notifyEmail || '');
  const [selectedAccountId, setSelectedAccountId] = useState(payment.fromAccountId || '');

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const snap = await getDocs(
          query(collection(firestore, 'users', user.uid, 'bankAccounts')),
        );
        const list: Account[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Account, 'id'>),
        }));
        setAccounts(list);
        if (!selectedAccountId) {
          const cheque = list.find((a) => a.type === 'Cheque') ?? list[0];
          if (cheque) setSelectedAccountId(cheque.id);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const numericAmount = parseFloat(amount) || 0;
  const fee = useMemo(
    () => calculateFee(numericAmount, payment.paymentType, selectedAccount?.type ?? 'Cheque'),
    [numericAmount, payment.paymentType, selectedAccount?.type],
  );
  const total = numericAmount + fee;
  const chequeAccounts = accounts.filter((a) => a.type === 'Cheque' || a.type === 'Savings');
  const isValid = numericAmount > 0 && !!selectedAccountId && !!selectedAccount && selectedAccount.balance >= total;

  const handleNext = () => {
    if (!selectedAccount) return;
    setPayment((p) => ({
      ...p,
      fromAccountId: selectedAccountId,
      fromAccountName: `${selectedAccount.name} – ${selectedAccount.accountNumber}`,
      fromAccountBalance: selectedAccount.balance,
      amount,
      yourReference,
      recipientReference,
      notifyEmail,
    }));
    router.push('/pay/review');
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                Pay {payment.recipientName}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                {payment.bank} • {payment.accountNumber}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)')} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', marginBottom: 4 }}>
            AMOUNT
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300', marginRight: 2 }}>R</Text>
            <TextInput
              style={{ flex: 1, color: '#fff', fontSize: 28, fontWeight: '300', paddingVertical: 0 }}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={amount}
              onChangeText={(t) => {
                const clean = t.replace(/[^0-9.]/g, '');
                const parts = clean.split('.');
                if (parts.length > 2) return;
                setAmount(clean);
              }}
              keyboardType="decimal-pad"
            />
          </View>
          {selectedAccount && numericAmount > selectedAccount.balance && (
            <Text style={{ color: '#fbbf24', fontSize: 12, marginTop: 6 }}>
              Insufficient funds (balance: {formatCurrency(selectedAccount.balance, selectedAccount.currency)})
            </Text>
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>
              From which account?
            </Text>
            {chequeAccounts.map((acc) => {
              const selected = acc.id === selectedAccountId;
              return (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => setSelectedAccountId(acc.id)}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1.5,
                    borderColor: selected ? PRIMARY : '#e5e7eb',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#111827', fontWeight: '600', fontSize: 14 }}>{acc.name}</Text>
                    <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{acc.accountNumber}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#111827', fontWeight: '700', fontSize: 15 }}>
                      {formatCurrency(acc.balance, acc.currency)}
                    </Text>
                    <Text style={{ color: '#9ca3af', fontSize: 10, marginTop: 2 }}>Available</Text>
                  </View>
                  {selected && (
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: PRIMARY,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 10,
                    }}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>
              What is the payment for?
            </Text>
            <Field label="Your reference" value={yourReference} onChangeText={setYourReference} placeholder="e.g. Rent March" />
            <Field label="Recipient's reference" value={recipientReference} onChangeText={setRecipientReference} placeholder="Optional" />
          </View>

          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>
              Notifications (optional)
            </Text>
            <Field label="Email proof of payment to" value={notifyEmail} onChangeText={setNotifyEmail} placeholder="email@example.com" keyboardType="email-address" />
          </View>

          {numericAmount > 0 && (
            <View style={{
              marginHorizontal: 16,
              marginTop: 8,
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}>
              <SummaryRow label="Amount" value={formatCurrency(numericAmount, 'ZAR')} />
              <SummaryRow label={`${payment.paymentType} fee`} value={fee === 0 ? 'Free' : formatCurrency(fee, 'ZAR')} />
              <View style={{ height: 1, backgroundColor: '#f3f4f6', marginVertical: 8 }} />
              <SummaryRow label="Total deduction" value={formatCurrency(total, 'ZAR')} bold />
            </View>
          )}
        </ScrollView>

        <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!isValid}
            style={{
              backgroundColor: isValid ? PRIMARY : '#d1d5db',
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Next</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'numeric' | 'email-address';
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 5, fontWeight: '600' }}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        style={{
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: '#e5e7eb',
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 11,
          fontSize: 14,
          color: '#111827',
        }}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <Text style={{ color: '#6b7280', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: '#111827', fontSize: 13, fontWeight: bold ? '700' : '400' }}>{value}</Text>
    </View>
  );
}
