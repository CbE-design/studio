import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PRIMARY = '#00843d';

const transactOptions = [
  { label: 'Pay someone', icon: 'arrow-up-circle-outline', desc: 'Send money to a recipient', route: '/(app)/pay' },
  { label: 'Transfer between accounts', icon: 'swap-horizontal-outline', desc: 'Move money between your accounts', route: null },
  { label: 'Buy prepaid', icon: 'phone-portrait-outline', desc: 'Airtime, electricity, and more', route: null },
  { label: 'Pay bills', icon: 'receipt-outline', desc: 'Utilities, insurance, and more', route: null },
];

export default function TransactScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Transact</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
          What would you like to do?
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {transactOptions.map((option) => (
          <TouchableOpacity
            key={option.label}
            onPress={() => option.route && router.push(option.route as any)}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 1,
            }}
            activeOpacity={0.7}
          >
            <View style={{
              width: 48,
              height: 48,
              backgroundColor: '#e8f5ee',
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
              <Ionicons name={option.icon as any} size={24} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#111827', fontSize: 15, fontWeight: '600' }}>{option.label}</Text>
              <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{option.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
