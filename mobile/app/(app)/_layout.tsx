import { Stack } from 'expo-router';
import { PaymentProvider } from '@/context/PaymentContext';

export default function AppLayout() {
  return (
    <PaymentProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="account/[accountId]/index" />
        <Stack.Screen name="account/[accountId]/transaction/[txId]" />
        <Stack.Screen name="pay/select-recipient" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="pay/amount" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="pay/review" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="pay/success" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      </Stack>
    </PaymentProvider>
  );
}
