import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="account/[accountId]/index" />
      <Stack.Screen name="account/[accountId]/transaction/[txId]" />
    </Stack>
  );
}
