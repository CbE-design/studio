import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { usePayment } from '@/context/PaymentContext';
import { formatCurrency } from '@/lib/format';
import { calculateFee } from '@/lib/fees';
import type { Transaction } from '@/lib/definitions';

const PRIMARY = '#00843d';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function ReviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { payment, resetPayment } = usePayment();

  const [notifyEmail, setNotifyEmail] = useState(payment.notifyEmail || '');
  const [processing, setProcessing] = useState(false);

  const amount = parseFloat(payment.amount) || 0;
  const fee = calculateFee(amount, payment.paymentType, payment.fromAccountType);
  const total = amount + fee;

  const dateLabel = new Date().toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handleCapture = async () => {
    if (!user?.uid) return;
    setProcessing(true);

    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      if (!idToken) {
        Alert.alert('Session expired', 'Please log in again.');
        setProcessing(false);
        return;
      }

      // This calls the backend createTransactionAction which now defaults to PENDING_APPROVAL for Trust accounts
      const res = await fetch(`${API_BASE}/api/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fromAccountId: payment.fromAccountId,
          amount: payment.amount,
          recipientName: payment.recipientName,
          yourReference: payment.yourReference,
          recipientReference: payment.recipientReference,
          bankName: payment.bank,
          accountNumber: payment.accountNumber,
          paymentType: payment.paymentType,
        }),
      });

      const result = (await res.json()) as {
        success: boolean;
        message: string;
        transactionId?: string;
        popReferenceNumber?: string;
      };

      if (!result.success) {
        Alert.alert('Capture failed', result.message);
        return;
      }

      // Instructions are captured for signing, email notification is usually sent after final approval
      // but we allow immediate "Instruction Captured" alerts if requested.
      
      router.push({
        pathname: '/pay/success',
        params: {
          amount: payment.amount,
          recipientName: payment.recipientName,
          bank: payment.bank,
          accountNumber: payment.accountNumber,
          yourReference: payment.yourReference,
          recipientReference: payment.recipientReference,
          transactionId: result.transactionId ?? '',
          popReferenceNumber: result.popReferenceNumber ?? '',
          paymentType: payment.paymentType,
          isTrustInstruction: 'true' // New flag for realism
        },
      });
      resetPayment();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not capture your instruction.';
      Alert.alert('Error', msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 }}>Review instruction</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)')} style={{ padding: 4 }}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#f59e0b' }}>
          <Ionicons name="shield-outline" size={24} color="#d97706" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#92400e', fontSize: 13, fontWeight: '700' }}>Trust Signing Mandate</Text>
            <Text style={{ color: '#78350f', fontSize: 11 }}>This instruction will require a Trustee signature before processing.</Text>
          </View>
        </View>

        <View style={{
          backgroundColor: '#fff',
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#e8f5ee',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}>
            <Text style={{ color: PRIMARY, fontWeight: '700', fontSize: 18 }}>
              {payment.recipientName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '600' }}>{payment.bank}</Text>
            <Text style={{ color: '#111827', fontWeight: '700', fontSize: 16 }}>{payment.recipientName}</Text>
            <Text style={{ color: '#6b7280', fontSize: 13 }}>{payment.accountNumber}</Text>
          </View>
        </View>

        <View style={{
          backgroundColor: '#fff',
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <DetailRow label="Payment type" value={payment.paymentType} />
          <Divider />
          <DetailRow label="Amount" value={formatCurrency(amount, 'ZAR')} />
          <Divider />
          <DetailRow label="Estimated Fee" value={fee === 0 ? 'Free' : formatCurrency(fee, 'ZAR')} />
          <Divider />
          <DetailRow label="Total deduction upon approval" value={formatCurrency(total, 'ZAR')} bold />
          <Divider />
          <DetailRow label="From account" value={payment.fromAccountName} />
          <Divider />
          <DetailRow label="Proposed date" value={dateLabel} />
        </View>

        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>
            Audit notification (optional)
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '600' }}>
            NOTIFY TRUSTEE VIA EMAIL
          </Text>
          <TextInput
            style={{
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              color: '#111827',
            }}
            placeholder="trustee@example.com"
            placeholderTextColor="#9ca3af"
            value={notifyEmail}
            onChangeText={setNotifyEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </ScrollView>

      <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
        <TouchableOpacity
          onPress={handleCapture}
          disabled={processing}
          style={{
            backgroundColor: processing ? '#6b7280' : PRIMARY,
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          ) : null}
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {processing ? 'Capturing…' : 'Capture Instruction'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ paddingVertical: 10 }}>
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 2 }}>{label}</Text>
      <Text style={{ color: '#111827', fontSize: 15, fontWeight: bold ? '700' : '400' }}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#f3f4f6' }} />;
}
