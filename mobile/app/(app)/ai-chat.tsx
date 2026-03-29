import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { auth } from '@/lib/firebase';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const PRIMARY = '#00843d';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm your MoneyGO AI assistant. How can I help you with your Trust accounts today?",
};

export default function AiChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    setIsLoading(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken ?? ''}`,
        },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json()) as { response?: string };
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response ?? "I'm here to help!",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name={'arrow-back' as IoniconsName} size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.botIcon}>
          <Ionicons name={'hardware-chip-outline' as IoniconsName} size={20} color={PRIMARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>MoneyGO AI Support</Text>
          <Text style={styles.headerSub}>Intelligent customer service</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.botBubble]}>
              {item.role === 'assistant' && (
                <View style={styles.botAvatar}>
                  <Ionicons name={'hardware-chip-outline' as IoniconsName} size={14} color={PRIMARY} />
                </View>
              )}
              <View style={[styles.bubbleText, item.role === 'user' ? styles.userBubbleText : styles.botBubbleText]}>
                <Text style={{ color: item.role === 'user' ? '#fff' : '#111827', fontSize: 14, lineHeight: 20 }}>
                  {item.content}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            isLoading ? (
              <View style={[styles.bubble, styles.botBubble]}>
                <View style={styles.botAvatar}>
                  <Ionicons name={'hardware-chip-outline' as IoniconsName} size={14} color={PRIMARY} />
                </View>
                <View style={[styles.bubbleText, styles.botBubbleText]}>
                  <ActivityIndicator size="small" color="#9ca3af" />
                </View>
              </View>
            ) : null
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor="#9ca3af"
            style={styles.textInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={isLoading || !input.trim()}
            style={[styles.sendBtn, { opacity: isLoading || !input.trim() ? 0.5 : 1 }]}
          >
            <Ionicons name={'send' as IoniconsName} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  botIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#e8f5ee', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ade80' },
  bubble: { flexDirection: 'row', alignItems: 'flex-end', maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end' },
  botBubble: { alignSelf: 'flex-start', gap: 8 },
  botAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e8f5ee', alignItems: 'center', justifyContent: 'center',
  },
  bubbleText: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  userBubbleText: { backgroundColor: PRIMARY, borderBottomRightRadius: 4 },
  botBubbleText: { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 12, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 10,
  },
  textInput: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#111827', maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
  },
});
