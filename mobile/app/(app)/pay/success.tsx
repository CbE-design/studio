import { View, Text, TouchableOpacity, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/format';

const PRIMARY = '#00843d';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount: string;
    recipientName: string;
    bank: string;
    accountNumber: string;
    yourReference: string;
    recipientReference: string;
    transactionId: string;
    popReferenceNumber: string;
    paymentType: string;
    emailStatus: 'sent' | 'failed' | 'skipped';
    notifyEmail: string;
  }>();

  const amount = parseFloat(params.amount ?? '0');
  const dateStr = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
  const isInstant = params.paymentType === 'Instant Pay';

  const handleShare = async () => {
    const lines = [
      `Payment Confirmation`,
      `Amount: ${formatCurrency(amount, 'ZAR')}`,
      `To: ${params.recipientName}`,
      `Bank: ${params.bank}`,
      `Account: ${params.accountNumber}`,
      `Date: ${dateStr}`,
      params.yourReference ? `Your ref: ${params.yourReference}` : '',
      params.recipientReference ? `Recipient ref: ${params.recipientReference}` : '',
      params.popReferenceNumber ? `POP ref: ${params.popReferenceNumber}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Share.share({ message: lines, title: 'Payment Confirmation' });
    } catch {
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, alignItems: 'center', position: 'relative' }}>
        <TouchableOpacity
          onPress={handleShare}
          style={{ position: 'absolute', right: 16, top: 8, padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          <Ionicons name="share-outline" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: 'rgba(255,255,255,0.25)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          marginTop: 8,
        }}>
          <Ionicons name="checkmark" size={30} color="#fff" />
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '300', textAlign: 'center', paddingHorizontal: 24, lineHeight: 28 }}>
          {formatCurrency(amount, 'ZAR')} paid to {params.recipientName}&apos;s bank account
        </Text>
      </View>

      {isInstant && (
        <View style={{ backgroundColor: '#fefce8', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Ionicons name="information-circle-outline" size={18} color="#92400e" style={{ marginTop: 1 }} />
          <Text style={{ color: '#78350f', fontSize: 12, flex: 1, lineHeight: 18 }}>
            Instant payments take up to 30 minutes to process. Once successful, you can share your proof of payment from payment history.
          </Text>
        </View>
      )}

      {params.emailStatus === 'sent' && !!params.notifyEmail && (
        <View style={{ backgroundColor: '#f0fdf4', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="mail-outline" size={16} color="#15803d" />
          <Text style={{ color: '#15803d', fontSize: 12, flex: 1 }}>
            Proof of payment emailed to {params.notifyEmail}
          </Text>
        </View>
      )}

      {params.emailStatus === 'failed' && !!params.notifyEmail && (
        <View style={{ backgroundColor: '#fef2f2', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="warning-outline" size={16} color="#b91c1c" />
          <Text style={{ color: '#b91c1c', fontSize: 12, flex: 1 }}>
            Payment was successful but the email notification to {params.notifyEmail} could not be sent.
          </Text>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <DetailRow label="Payment date" value={dateStr} />
        <Divider />
        <DetailRow label="Bank name" value={params.bank ?? '-'} />
        <Divider />
        <DetailRow label="Account number" value={params.accountNumber ?? '-'} />
        {params.yourReference ? (
          <>
            <Divider />
            <DetailRow label="Your reference" value={params.yourReference} />
          </>
        ) : null}
        {params.recipientReference ? (
          <>
            <Divider />
            <DetailRow label="Recipient's reference" value={params.recipientReference} />
          </>
        ) : null}
        {params.popReferenceNumber ? (
          <>
            <Divider />
            <DetailRow label="POP reference" value={params.popReferenceNumber} />
          </>
        ) : null}
      </ScrollView>

      <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
        <TouchableOpacity
          onPress={() => router.replace('/(app)/(tabs)')}
          style={{ backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ paddingVertical: 12 }}>
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 2 }}>{label}</Text>
      <Text style={{ color: '#111827', fontSize: 15, fontWeight: '300' }}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#f3f4f6' }} />;
}
