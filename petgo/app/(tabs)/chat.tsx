import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import api from '@/utils/api';

export default function ChatListScreen() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, roomsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/chat/rooms')
      ]);

      if (userRes.data.success) {
        setCurrentUser(userRes.data.user);
      }
      if (roomsRes.data.success) {
        setRooms(roomsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const getOtherParty = (room: any) => {
    if (!currentUser) return null;
    return currentUser.role === 'shop_owner' ? room.customer : room.shop;
  };

  const renderItem = ({ item }: { item: any }) => {
    const otherParty = getOtherParty(item);
    if (!otherParty) return null;

    const timeString = new Date(item.lastMessageAt).toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit'
    });

    return (
      <TouchableOpacity 
        style={styles.roomItem}
        onPress={() => router.push(`/chat/${item._id}` as any)}
      >
        <Image 
          source={{ uri: otherParty.avatar && otherParty.avatar !== 'default.jpg' ? otherParty.avatar : 'https://i.pravatar.cc/150?u=' + otherParty._id }} 
          style={styles.avatar} 
        />
        <View style={styles.roomContent}>
          <View style={styles.roomHeader}>
            <ThemedText style={styles.roomName}>{otherParty.name}</ThemedText>
            <ThemedText style={styles.roomTime}>{timeString}</ThemedText>
          </View>
          <ThemedText numberOfLines={1} style={styles.lastMessage}>
            {item.lastMessage || 'Chưa có tin nhắn nào...'}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Tin nhắn</ThemedText>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6F61" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <ThemedText style={styles.emptyText}>Bạn chưa có cuộc trò chuyện nào</ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    flexGrow: 1,
  },
  roomItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: '#eee'
  },
  roomContent: {
    flex: 1,
    justifyContent: 'center',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roomTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    color: '#8E8E93',
    fontSize: 16,
  }
});
