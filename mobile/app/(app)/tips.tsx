import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';

type Tip = { icon: IoniconsName; title: string; body: string; color: string };

const TIPS: Tip[] = [
  {
    icon: 'trending-up-outline',
    title: 'Build an Emergency Fund',
    body: 'Aim to keep 3–6 months of living expenses in a liquid savings account. This cushion protects you from unexpected costs without dipping into investments.',
    color: '#dcfce7',
  },
  {
    icon: 'calculator-outline',
    title: 'Track Every Transaction',
    body: 'Review your transactions weekly. Categorising spending reveals patterns and helps you identify areas to cut back and redirect funds toward your goals.',
    color: '#dbeafe',
  },
  {
    icon: 'repeat-outline',
    title: 'Automate Savings',
    body: 'Set up automatic transfers on payday so saving happens before you have a chance to spend. Even small consistent amounts compound significantly over time.',
    color: '#fef9c3',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Protect Your Accounts',
    body: 'Enable transaction notifications for all accounts. Immediate alerts let you spot and dispute unauthorised transactions before they cause lasting damage.',
    color: '#ffe4e6',
  },
  {
    icon: 'pie-chart-outline',
    title: 'Use the 50/30/20 Rule',
    body: 'Allocate 50% of after-tax income to needs, 30% to wants, and 20% to savings and debt repayment. This simple framework keeps spending balanced.',
    color: '#ede9fe',
  },
  {
    icon: 'refresh-outline',
    title: 'Review Debit Orders Regularly',
    body: 'Check for subscriptions or debit orders you no longer use. Cancelling even one unused service per month can free up meaningful cash over a year.',
    color: '#ffedd5',
  },
];

export default function TipsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name={'arrow-back' as IoniconsName} size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Financial Tips</Text>
          <Text style={styles.headerSub}>Smart money management advice</Text>
        </View>
        <Ionicons name={'bulb-outline' as IoniconsName} size={22} color="rgba(255,255,255,0.8)" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={styles.banner}>
          <Ionicons name={'information-circle-outline' as IoniconsName} size={20} color={PRIMARY} style={{ marginRight: 10 }} />
          <Text style={{ flex: 1, color: '#166534', fontSize: 13 }}>
            These tips are curated to help Trust account holders manage finances effectively. AI-personalised tips are coming soon.
          </Text>
        </View>

        {TIPS.map((tip) => (
          <View key={tip.title} style={[styles.card, { backgroundColor: tip.color }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(0,0,0,0.06)' }]}>
              <Ionicons name={tip.icon} size={22} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipBody}>{tip.body}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => router.push('/(app)/ai-chat')}
          activeOpacity={0.85}
        >
          <Ionicons name={'chatbubbles-outline' as IoniconsName} size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Chat with AI Assistant</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  banner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#dcfce7', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#bbf7d0',
  },
  card: {
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  tipBody: { fontSize: 13, color: '#374151', lineHeight: 19 },
  chatBtn: {
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    marginTop: 8, marginBottom: 16,
  },
});
