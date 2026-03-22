import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import api, { BASE_URL } from '@/utils/api';
import io from 'socket.io-client';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams(); // could be roomId OR receiverId
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState<string | null>(null);
  
  const socketRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // 1. Initialize Socket
    socketRef.current = io(BASE_URL);

    // 2. Fetch User and History
    const initData = async () => {
      try {
        const userRes = await api.get('/users/me');
        if (userRes.data.success) {
          setCurrentUser(userRes.data.user);
        }

        // We try to fetch messages assuming `id` is `roomId`
        // If it returns 404 or 400, it means it's a new chat and `id` is `receiverId` (handled via POST /send later)
        try {
          const msgRes = await api.get(`/chat/${id}/messages`);
          if (msgRes.data.success) {
            setMessages(msgRes.data.data);
            const actualRoomId = msgRes.data.roomId || (id as string);
            setRoomId(actualRoomId);
            socketRef.current.emit('joinRoom', actualRoomId);
          }
        } catch (err) {
          // It's likely a receiverId instead of roomId, wait until first message is sent
          console.log("No existing room found, will create on first message");
        }
      } catch (error) {
        console.error('Error fetching chat init:', error);
      } finally {
        setLoading(false);
      }
    };

    initData();

    // 3. Listen to incoming messages
    socketRef.current.on('newMessage', (newMsg: any) => {
      setMessages((prev) => {
        if (prev.find(m => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [id]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const messageText = text.trim();
    setText(''); // clear input early for UX

    try {
      const payload = roomId ? { roomId, text: messageText } : { receiverId: id, text: messageText };
      const res = await api.post('/chat/send', payload);
      
      if (res.data.success) {
        // If it was a new room, we now have the roomId
        if (!roomId && res.data.roomId) {
          setRoomId(res.data.roomId);
          socketRef.current.emit('joinRoom', res.data.roomId);
        }
      }
    } catch (error) {
      console.error('Send error:', error);
      setText(messageText); // restore text on failure
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.sender._id === currentUser?._id || item.sender === currentUser?._id;
    const timeString = new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.messageWrapper, isMine ? styles.messageMine : styles.messageTheirs]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <ThemedText style={[styles.messageText, isMine && { color: '#fff' }]}>{item.text}</ThemedText>
          <ThemedText style={[styles.timeText, isMine && { color: 'rgba(255,255,255,0.7)' }]}>{timeString}</ThemedText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Hội thoại</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#4A90E2" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>Hãy gửi lời chào đầu tiên!</ThemedText>
              </View>
            }
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  messageMine: {
    justifyContent: 'flex-end',
  },
  messageTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleMine: {
    backgroundColor: '#4A90E2',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#E9ECEF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  timeText: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F3F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#A0C4EA',
  }
});
