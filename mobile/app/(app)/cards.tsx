import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';

type CardAction = { label: string; icon: IoniconsName };

const cardActions: CardAction[] = [
  { label: 'Freeze card', icon: 'snow-outline' },
  { label: 'View PIN', icon: 'lock-closed-outline' },
  { label: 'Limits', icon: 'speedometer-outline' },
  { label: 'Replace', icon: 'refresh-outline' },
];

export default function CardsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>My Cards</Text>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        <View style={{
          backgroundColor: PRIMARY,
          borderRadius: 20,
          padding: 24,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>NEDBANK</Text>
              <Text style={{ color: '#f0a500', fontSize: 16, fontWeight: '700' }}>MONEY App</Text>
            </View>
            <Ionicons name="wifi" size={24} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={{ color: '#fff', fontSize: 18, letterSpacing: 4, fontWeight: '600', marginBottom: 20 }}>
            •••• •••• •••• 4242
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>CARD HOLDER</Text>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Account Holder</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>EXPIRES</Text>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>12/28</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {cardActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={{
                flex: 1,
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <Ionicons name={action.icon} size={20} color={PRIMARY} />
              <Text style={{ color: '#374151', fontSize: 10, marginTop: 4, textAlign: 'center' }}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 1,
        }}>
          <Text style={{ color: '#374151', fontSize: 15, fontWeight: '600', marginBottom: 4 }}>Card management</Text>
          <Text style={{ color: '#9ca3af', fontSize: 13 }}>
            Full card management features will be available in a future update.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
