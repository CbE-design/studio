import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { Account } from '@/lib/definitions';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

type DocLink = { label: string; icon: IoniconsName; path: string };

function getDocLinks(accountId: string): DocLink[] {
  return [
    {
      label: 'View Statement',
      icon: 'document-text-outline',
      path: `/account/${accountId}/statement`,
    },
    {
      label: 'Confirmation Letter',
      icon: 'shield-checkmark-outline',
      path: `/account/${accountId}/confirmation-letter`,
    },
  ];
}

export default function DocumentsScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setIsLoading(false); return; }
    getDocs(collection(firestore, 'users', uid, 'bankAccounts'))
      .then((snap) => {
        const accs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Account);
        setAccounts(accs);
        if (accs.length > 0) setSelectedId(accs[0].id);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleOpenDoc = (path: string) => {
    const url = `${API_BASE}${path}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Cannot open', 'Please open the MoneyGO web app to view this document.');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Could not open document.');
      });
  };

  const selectedAccount = accounts.find((a) => a.id === selectedId);
  const docLinks = selectedId ? getDocLinks(selectedId) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name={'arrow-back' as IoniconsName} size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents & Statements</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Generate Documents</Text>
          <Text style={styles.cardSub}>Select an account to access its documents</Text>

          {isLoading ? (
            <ActivityIndicator color={PRIMARY} style={{ marginTop: 16 }} />
          ) : accounts.length === 0 ? (
            <Text style={{ color: '#9ca3af', marginTop: 12 }}>No accounts found.</Text>
          ) : (
            <View style={{ marginTop: 14, gap: 8 }}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => setSelectedId(acc.id)}
                  style={[styles.accRow, selectedId === acc.id && styles.accRowSelected]}
                >
                  <View style={[styles.accIcon, selectedId === acc.id && { backgroundColor: PRIMARY }]}>
                    <Ionicons
                      name={'card-outline' as IoniconsName}
                      size={16}
                      color={selectedId === acc.id ? '#fff' : PRIMARY}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.accName, selectedId === acc.id && { color: PRIMARY }]}>{acc.name}</Text>
                    <Text style={styles.accNumber}>{acc.accountNumber}</Text>
                  </View>
                  {selectedId === acc.id && (
                    <Ionicons name={'checkmark-circle' as IoniconsName} size={20} color={PRIMARY} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {selectedId && selectedAccount && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{selectedAccount.name}</Text>
            <Text style={styles.cardSub}>Available documents</Text>
            <View style={{ marginTop: 14, gap: 10 }}>
              {docLinks.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => handleOpenDoc(link.path)}
                  style={styles.docRow}
                  activeOpacity={0.8}
                >
                  <View style={styles.docIcon}>
                    <Ionicons name={link.icon} size={20} color={PRIMARY} />
                  </View>
                  <Text style={styles.docLabel}>{link.label}</Text>
                  <Ionicons name={'open-outline' as IoniconsName} size={16} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Uploaded Documents</Text>
          <View style={styles.emptyBox}>
            <Ionicons name={'cloud-upload-outline' as IoniconsName} size={40} color="#d1d5db" />
            <Text style={{ color: '#9ca3af', marginTop: 10, fontSize: 14 }}>No uploaded documents</Text>
            <Text style={{ color: '#d1d5db', fontSize: 12, marginTop: 4 }}>Upload feature coming soon</Text>
          </View>
        </View>
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
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  accRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  accRowSelected: { borderColor: PRIMARY, backgroundColor: '#f0faf4' },
  accIcon: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: '#e8f5ee', alignItems: 'center', justifyContent: 'center',
  },
  accName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  accNumber: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
  },
  docIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#e8f5ee', alignItems: 'center', justifyContent: 'center',
  },
  docLabel: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  emptyBox: {
    alignItems: 'center', paddingVertical: 32,
    borderRadius: 12, borderWidth: 2, borderColor: '#f3f4f6',
    borderStyle: 'dashed', marginTop: 12,
  },
});
