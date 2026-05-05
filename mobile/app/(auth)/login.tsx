import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useRouter } from 'expo-router';

function getLoginErrorMessage(code: string, message?: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return `Sign in failed. Please check your details.`;
  }
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Prototype Trustee Role Mapping
  const TRUSTEE_EMAIL = 'trustee@nedbank.co.za';

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const userCredential = await signIn(email.trim(), password);
      const user = userCredential.user;

      // Unified Role-Based Redirection
      if (user.email?.toLowerCase() === TRUSTEE_EMAIL.toLowerCase()) {
        router.replace('/trustee/dashboard' as any);
        return;
      }

      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'trustee') {
        router.replace('/trustee/dashboard' as any);
      } else {
        router.replace('/(app)/(tabs)' as any);
      }
    } catch (err: unknown) {
      const code = err instanceof Error && 'code' in err ? String((err as { code: string }).code) : '';
      setError(getLoginErrorMessage(code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#00843d', '#006830']} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48 }}>
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 20,
                padding: 20,
                marginBottom: 24,
              }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#ffffff', letterSpacing: 2, textAlign: 'center' }}>
                  NEDBANK
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#f0a500', letterSpacing: 1 }}>
                    MONEY
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#ffffff', marginTop: 2 }}>
                    App
                  </Text>
                </View>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center' }}>
                Sign in with your Nedbank ID
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 6, fontWeight: '500' }}>
                  Email address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: '#ffffff',
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.25)',
                  }}
                />
              </View>

              <View>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 6, fontWeight: '500' }}>
                  Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      paddingRight: 56,
                      color: '#ffffff',
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.25)',
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: [{ translateY: -10 }],
                    }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <View style={{
                  backgroundColor: 'rgba(220,38,38,0.2)',
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(220,38,38,0.4)',
                }}>
                  <Text style={{ color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginTop: 8,
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#00843d" />
                ) : (
                  <Text style={{ color: '#00843d', fontSize: 16, fontWeight: '700' }}>
                    Sign in
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 48, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center' }}>
                Nedbank Ltd Reg No 1951/000009/06.{'\n'}
                Licensed financial services provider (FSP9363)
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
