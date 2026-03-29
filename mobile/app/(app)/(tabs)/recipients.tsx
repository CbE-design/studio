import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { firestore } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import type { Beneficiary } from '@/lib/definitions';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';

type FormState = {
  name: string;
  bank: string;
  accountNumber: string;
  phoneNumber: string;
};

const EMPTY_FORM: FormState = { name: '', bank: '', accountNumber: '', phoneNumber: '' };

function RecipientRow({
  item,
  onDelete,
}: {
  item: Beneficiary;
  onDelete: (item: Beneficiary) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0], extrapolate: 'clamp' });
    return (
      <TouchableOpacity
        onPress={() => {
          swipeRef.current?.close();
          onDelete(item);
        }}
        style={styles.deleteAction}
        activeOpacity={0.85}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name={'trash-outline' as IoniconsName} size={22} color="#fff" />
        </Animated.View>
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} rightThreshold={40}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={{ color: PRIMARY, fontSize: 18, fontWeight: '700' }}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#111827', fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
          <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
            {item.bank} · {item.accountNumber}
          </Text>
          {item.phoneNumber ? (
            <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>{item.phoneNumber}</Text>
          ) : null}
        </View>
        <Ionicons name={'chevron-forward' as IoniconsName} size={16} color="#d1d5db" />
      </View>
    </Swipeable>
  );
}

export default function RecipientsScreen() {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
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

  const filtered = recipients.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.bank.toLowerCase().includes(search.toLowerCase()) ||
    r.accountNumber.includes(search),
  );

  const handleAdd = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.bank.trim() || !form.accountNumber.trim()) {
      Alert.alert('Missing fields', 'Name, bank and account number are required.');
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(firestore, `users/${user.uid}/beneficiaries`), {
        name: form.name.trim(),
        bank: form.bank.trim(),
        accountNumber: form.accountNumber.trim(),
        phoneNumber: form.phoneNumber.trim(),
      });
      setForm(EMPTY_FORM);
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to add recipient. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (recipient: Beneficiary) => {
    if (!user) return;
    Alert.alert(
      'Delete recipient',
      `Remove ${recipient.name} from your recipients?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, `users/${user.uid}/beneficiaries/${recipient.id}`));
            } catch {
              Alert.alert('Error', 'Failed to delete recipient.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Recipients</Text>
          <TouchableOpacity
            onPress={() => { setForm(EMPTY_FORM); setModalVisible(true); }}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 6 }}
          >
            <Ionicons name={'person-add-outline' as IoniconsName} size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name={'search-outline' as IoniconsName} size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search recipients..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={{ flex: 1, color: '#fff', paddingVertical: 8, paddingHorizontal: 8, fontSize: 14 }}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={PRIMARY} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Ionicons name={'people-outline' as IoniconsName} size={56} color="#d1d5db" />
          <Text style={{ color: '#6b7280', fontSize: 16, fontWeight: '600', marginTop: 16 }}>
            {search ? 'No matches found' : 'No recipients yet'}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 6, textAlign: 'center' }}>
            {search ? 'Try a different search term' : 'Add recipients to quickly send payments'}
          </Text>
          {!search && (
            <TouchableOpacity
              onPress={() => { setForm(EMPTY_FORM); setModalVisible(true); }}
              style={{ backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Add recipient</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <RecipientRow item={item} onDelete={handleDelete} />
          )}
          ListFooterComponent={
            <Text style={styles.swipeHint}>
              Swipe left to delete a recipient
            </Text>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add recipient</Text>

            {(['name', 'bank', 'accountNumber', 'phoneNumber'] as const).map((field) => (
              <View key={field} style={{ marginBottom: 14 }}>
                <Text style={styles.label}>
                  {field === 'accountNumber' ? 'Account number' :
                   field === 'phoneNumber' ? 'Phone number (optional)' :
                   field.charAt(0).toUpperCase() + field.slice(1)}
                </Text>
                <TextInput
                  value={form[field]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))}
                  placeholder={
                    field === 'name' ? 'Full name' :
                    field === 'bank' ? 'Bank name' :
                    field === 'accountNumber' ? '000 000 0000' :
                    '+27 00 000 0000'
                  }
                  keyboardType={
                    field === 'accountNumber' || field === 'phoneNumber' ? 'numeric' : 'default'
                  }
                  style={styles.input}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={handleAdd}
              disabled={isSaving}
              style={[styles.btn, { opacity: isSaving ? 0.7 : 1 }]}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Add recipient</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
              <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 44, height: 44,
    backgroundColor: '#e8f5ee',
    borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  deleteAction: {
    backgroundColor: '#ef4444',
    borderRadius: 14,
    marginLeft: 8,
    marginBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    flexDirection: 'column',
    gap: 2,
  },
  deleteActionText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  swipeHint: {
    textAlign: 'center', color: '#d1d5db', fontSize: 11,
    marginTop: 12, marginBottom: 8,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#e5e7eb',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20,
  },
  label: {
    fontSize: 13, color: '#6b7280', marginBottom: 6, fontWeight: '500',
  },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827', backgroundColor: '#f9fafb',
  },
  btn: {
    backgroundColor: PRIMARY, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  cancelBtn: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
});
