import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

const CARD_COLORS = ['#dcfce7', '#dbeafe', '#fef9c3', '#ffe4e6', '#ede9fe', '#ffedd5'];

type Tip = { title: string; body: string; icon: string };

export default function TipsScreen() {
  const router = useRouter();
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/api/tips`, {
        headers: { Authorization: `Bearer ${idToken ?? ''}` },
      });
      const data = (await res.json()) as { tips?: Tip[]; error?: string };
      if (!res.ok || !data.tips) throw new Error(data.error ?? 'Failed to load tips');
      setTips(data.tips);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load tips');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void fetchTips(); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name={'arrow-back' as IoniconsName} size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>AI Financial Tips</Text>
          <Text style={styles.headerSub}>Personalised money management advice</Text>
        </View>
        <Ionicons name={'bulb-outline' as IoniconsName} size={22} color="rgba(255,255,255,0.8)" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={styles.banner}>
          <Ionicons name={'information-circle-outline' as IoniconsName} size={20} color={PRIMARY} style={{ marginRight: 10 }} />
          <Text style={{ flex: 1, color: '#166534', fontSize: 13 }}>
            Tips are personalised for Trust account holders and refreshed each session by our AI engine.
          </Text>
        </View>

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={{ color: '#9ca3af', marginTop: 12, fontSize: 14 }}>Generating your tips…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name={'alert-circle-outline' as IoniconsName} size={32} color="#ef4444" />
            <Text style={{ color: '#374151', marginTop: 8, fontSize: 14, textAlign: 'center' }}>{error}</Text>
            <TouchableOpacity onPress={fetchTips} style={styles.retryBtn}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tips.map((tip, i) => (
            <View key={tip.title} style={[styles.card, { backgroundColor: CARD_COLORS[i % CARD_COLORS.length] }]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0,0,0,0.06)' }]}>
                <Ionicons name={(tip.icon || 'bulb-outline') as IoniconsName} size={22} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipBody}>{tip.body}</Text>
              </View>
            </View>
          ))
        )}

        {!isLoading && !error && (
          <TouchableOpacity onPress={fetchTips} style={styles.refreshBtn} activeOpacity={0.85}>
            <Ionicons name={'refresh-outline' as IoniconsName} size={18} color={PRIMARY} style={{ marginRight: 8 }} />
            <Text style={{ color: PRIMARY, fontWeight: '600', fontSize: 14 }}>Refresh tips</Text>
          </TouchableOpacity>
        )}

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
  errorBox: {
    alignItems: 'center', padding: 32,
    borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#fee2e2',
  },
  retryBtn: {
    backgroundColor: PRIMARY, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 14,
  },
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: PRIMARY, backgroundColor: '#fff',
  },
  chatBtn: {
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    marginTop: 4, marginBottom: 16,
  },
});
