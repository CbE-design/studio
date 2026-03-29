import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const PRIMARY = '#00843d';

const widgets = [
  { label: 'Offers for you', icon: 'cash-outline' },
  { label: 'Applications', icon: 'document-text-outline' },
  { label: 'Insure', icon: 'umbrella-outline' },
  { label: 'Shop', icon: 'cart-outline' },
  { label: 'PayShap', icon: 'flash-outline', isNew: true },
  { label: 'Latest', icon: 'gift-outline' },
  { label: 'Quick Pay', icon: 'swap-horizontal-outline' },
  { label: 'Get cash', icon: 'business-outline' },
  { label: 'Home loans', icon: 'home-outline' },
  { label: 'Statements\nand docs', icon: 'copy-outline' },
];

function WidgetItem({ label, icon, isNew }: { label: string; icon: string; isNew?: boolean }) {
  return (
    <TouchableOpacity
      style={{ width: '25%', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 }}
      activeOpacity={0.7}
    >
      <View style={{
        width: 72,
        height: 72,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        overflow: 'hidden',
      }}>
        {isNew && (
          <View style={{
            position: 'absolute',
            top: -8,
            left: -14,
            backgroundColor: PRIMARY,
            paddingHorizontal: 20,
            paddingVertical: 3,
            transform: [{ rotate: '-45deg' }],
            zIndex: 1,
          }}>
            <Text style={{ color: '#fff', fontSize: 7, fontWeight: '800', letterSpacing: 0.5 }}>NEW</Text>
          </View>
        )}
        <Ionicons name={icon as any} size={28} color={PRIMARY} />
      </View>
      <Text style={{
        fontSize: 11,
        color: '#374151',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 15,
        height: 32,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function OverviewScreen() {
  const { appUser, logOut } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="menu" size={24} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              {appUser?.firstName ? `Hi, ${appUser.firstName}` : 'MoneyGO'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <TouchableOpacity onPress={logOut}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: 16,
          padding: 20,
          marginTop: 16,
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Total balance</Text>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 4 }}>
            Loading...
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8 }}>
            Accounts will load in Phase 2
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 1,
        }}>
          <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
            Account Summary
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 13 }}>
            Your accounts and balances will appear here in Phase 2.
          </Text>
        </View>

        <Text style={{ fontSize: 22, fontWeight: '700', color: '#374151', marginBottom: 16 }}>
          My widgets
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {widgets.map((w) => (
            <WidgetItem key={w.label} label={w.label} icon={w.icon} isNew={w.isNew} />
          ))}
        </View>

        <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 8, marginBottom: 12 }}>
          Recent transactions
        </Text>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 20,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 1,
        }}>
          <Ionicons name="receipt-outline" size={36} color="#d1d5db" />
          <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 8 }}>
            Transactions will load in Phase 2
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
