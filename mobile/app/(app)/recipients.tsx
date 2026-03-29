import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Beneficiary } from '@/lib/definitions';

const PRIMARY = '#00843d';

export default function RecipientsScreen() {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const q = collection(firestore, `users/${user.uid}/beneficiaries`);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRecipients(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Beneficiary));
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );
    return () => unsub();
  }, [user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Recipients</Text>
          <TouchableOpacity>
            <Ionicons name="person-add-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={PRIMARY} />
        </View>
      ) : recipients.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Ionicons name="people-outline" size={56} color="#d1d5db" />
          <Text style={{ color: '#6b7280', fontSize: 16, fontWeight: '600', marginTop: 16 }}>
            No recipients yet
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 6, textAlign: 'center' }}>
            Add recipients to quickly send payments
          </Text>
          <TouchableOpacity style={{
            backgroundColor: PRIMARY,
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
            marginTop: 20,
          }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Add recipient</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recipients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}>
              <View style={{
                width: 44,
                height: 44,
                backgroundColor: '#e8f5ee',
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ color: PRIMARY, fontSize: 18, fontWeight: '700' }}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#111827', fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
                <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                  {item.bank} · {item.accountNumber}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
