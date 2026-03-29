import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { usePayment } from '@/context/PaymentContext';
import type { Beneficiary } from '@/lib/definitions';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';

const BANKS = [
  'Nedbank',
  'ABSA',
  'Standard Bank',
  'FNB',
  'Capitec',
  'Investec',
  'African Bank',
  'Bidvest Bank',
];

export default function SelectRecipientScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { setPayment } = usePayment();

  const [search, setSearch] = useState('');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'saved' | 'new'>('saved');

  const [newName, setNewName] = useState('');
  const [newBank, setNewBank] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [bankPickerOpen, setBankPickerOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const snap = await getDocs(
          query(collection(firestore, 'users', user.uid, 'beneficiaries')),
        );
        const list: Beneficiary[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Beneficiary, 'id'>),
        }));
        setBeneficiaries(list);
      } catch {
        setBeneficiaries([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const filtered = beneficiaries.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.accountNumber.includes(search) ||
      b.bank.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelectSaved = (b: Beneficiary) => {
    setPayment((p) => ({
      ...p,
      recipient: b,
      recipientName: b.name,
      bank: b.bank,
      accountNumber: b.accountNumber,
    }));
    router.push('/pay/amount');
  };

  const handleNewRecipient = () => {
    if (!newName.trim() || !newBank.trim() || !newAccountNumber.trim()) return;
    setPayment((p) => ({
      ...p,
      recipient: null,
      recipientName: newName.trim(),
      bank: newBank.trim(),
      accountNumber: newAccountNumber.trim(),
    }));
    router.push('/pay/amount');
  };

  const isNewValid = newName.trim() && newBank.trim() && newAccountNumber.trim();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 }}>Pay someone</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={{ padding: 4 }}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, overflow: 'hidden' }}>
          {(['saved', 'new'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                backgroundColor: tab === t ? '#fff' : 'transparent',
                borderRadius: 8,
              }}
            >
              <Text style={{ color: tab === t ? PRIMARY : '#fff', fontWeight: '600', fontSize: 13 }}>
                {t === 'saved' ? 'Saved recipients' : 'New recipient'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'saved' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              paddingHorizontal: 10,
            }}>
              <Ionicons name="search" size={18} color="#9ca3af" />
              <TextInput
                style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: '#111827' }}
                placeholder="Search recipients..."
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={PRIMARY} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text style={{ color: '#9ca3af', fontSize: 15, marginTop: 12, textAlign: 'center' }}>
                {search ? 'No recipients found' : 'No saved recipients yet'}
              </Text>
              <TouchableOpacity onPress={() => setTab('new')} style={{ marginTop: 16 }}>
                <Text style={{ color: PRIMARY, fontWeight: '600', fontSize: 14 }}>+ Add a new recipient</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectSaved(item)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#e8f5ee',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Text style={{ color: PRIMARY, fontWeight: '700', fontSize: 16 }}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#111827', fontWeight: '600', fontSize: 15 }}>{item.name}</Text>
                    <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                      {item.bank} • {item.accountNumber}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                </TouchableOpacity>
              )}
            />
          )}
        </KeyboardAvoidingView>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
            <Field label="Recipient's name" value={newName} onChangeText={setNewName} placeholder="e.g. John Smith" />

            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '600' }}>BANK</Text>
            <TouchableOpacity
              onPress={() => setBankPickerOpen(!bankPickerOpen)}
              style={{
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: bankPickerOpen ? PRIMARY : '#e5e7eb',
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <Text style={{ flex: 1, color: newBank ? '#111827' : '#9ca3af', fontSize: 14 }}>
                {newBank || 'Select bank'}
              </Text>
              <Ionicons name={bankPickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#9ca3af" />
            </TouchableOpacity>
            {bankPickerOpen && (
              <View style={{
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 10,
                marginTop: -10,
                marginBottom: 14,
                overflow: 'hidden',
              }}>
                {BANKS.map((bank) => (
                  <TouchableOpacity
                    key={bank}
                    onPress={() => { setNewBank(bank); setBankPickerOpen(false); }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderBottomWidth: bank !== BANKS[BANKS.length - 1] ? 1 : 0,
                      borderBottomColor: '#f3f4f6',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ flex: 1, color: '#111827', fontSize: 14 }}>{bank}</Text>
                    {newBank === bank && <Ionicons name="checkmark" size={16} color={PRIMARY} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Field
              label="Account number"
              value={newAccountNumber}
              onChangeText={setNewAccountNumber}
              placeholder="e.g. 1234567890"
              keyboardType="numeric"
            />
          </View>

          <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
            <TouchableOpacity
              onPress={handleNewRecipient}
              disabled={!isNewValid}
              style={{
                backgroundColor: isNewValid ? PRIMARY : '#d1d5db',
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
      )}
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
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '600' }}>
        {label.toUpperCase()}
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
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}
