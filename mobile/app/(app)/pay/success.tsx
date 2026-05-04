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
    isTrustInstruction?: string;
  }>();

  const amount = parseFloat(params.amount ?? '0');
  const dateStr = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
  const isTrust = params.isTrustInstruction === 'true';

  const handleShare = async () => {
    const lines = [
      isTrust ? `Payment Instruction Captured` : `Payment Confirmation`,
      `Amount: ${formatCurrency(amount, 'ZAR')}`,
      `To: ${params.recipientName}`,
      `Bank: ${params.bank}`,
      `Account: ${params.accountNumber}`,
      `Date: ${dateStr}`,
      `Status: ${isTrust ? 'Awaiting Authorization' : 'Successful'}`,
      params.yourReference ? `Your ref: ${params.yourReference}` : '',
      params.popReferenceNumber ? `Reference: ${params.popReferenceNumber}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Share.share({ message: lines, title: isTrust ? 'Instruction Captured' : 'Payment Confirmation' });
    } catch {
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ backgroundColor: isTrust ? '#f59e0b' : PRIMARY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, alignItems: 'center', position: 'relative' }}>
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
          <Ionicons name={isTrust ? "time" : "checkmark"} size={30} color="#fff" />
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '300', textAlign: 'center', paddingHorizontal: 24, lineHeight: 28 }}>
          {isTrust 
            ? `Instruction for ${formatCurrency(amount, 'ZAR')} captured. Awaiting Trustee signature.`
            : `${formatCurrency(amount, 'ZAR')} paid to ${params.recipientName}'s bank account`
          }
        </Text>
      </View>

      {isTrust && (
        <View style={{ backgroundColor: '#fffbeb', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderBottomWidth: 1, borderBottomColor: '#fef3c7' }}>
          <Ionicons name="information-circle-outline" size={18} color="#b45309" style={{ marginTop: 1 }} />
          <Text style={{ color: '#92400e', fontSize: 12, flex: 1, lineHeight: 18 }}>
            The funds will remain in your account until a Trustee authorizes this instruction. You can track the status in Tracking Instructions.
          </Text>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <DetailRow label="Instruction date" value={dateStr} />
        <Divider />
        <DetailRow label="Recipient" value={params.recipientName ?? '-'} />
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
        <Divider />
        <DetailRow label="Status" value={isTrust ? "AWAITING AUTHORIZATION" : "SUCCESS"} />
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
