import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';
import { showError, showSuccess } from '@/utils/alertHelper';

export default function UserManagementScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchCurrentAdmin()]);
        setLoading(false);
      };
      loadData();
    }, [])
  );

  const fetchCurrentAdmin = async () => {
    try {
      const response = await api.get('/users/me');
      if (response.data.success) {
        setCurrentUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('admin/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Lỗi', 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await api.put(`admin/users/${userId}/activate`);
      if (response.data.success) {
        showSuccess('Thành công', `Đã ${!currentStatus ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản`);
        setUsers(users.map(u => u._id === userId ? { ...u, active: !currentStatus } : u));
      }
    } catch (error) {
      console.error('Toggle active error:', error);
      showError('Lỗi', 'Không thể thực hiện yêu cầu');
    }
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.avatarPlaceholder}>
          <ThemedText style={styles.avatarInitial}>{item.name.charAt(0)}</ThemedText>
        </View>
        <View style={styles.userInfo}>
          <ThemedText style={styles.userName}>{item.name}</ThemedText>
          <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
        </View>
        <View style={styles.roleTag}>
          <ThemedText style={styles.roleText}>
            {item.role === 'admin' ? 'Admin' : item.role === 'shop_owner' ? 'Shop' : 'User'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.userDetail}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <ThemedText style={styles.addressText}>
          {item.address?.city ? `${item.address.ward ? item.address.ward + ', ' : ''}${item.address.city}` : 'Chưa cập nhật địa chỉ'}
        </ThemedText>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusRow}>
          <ThemedText style={[styles.statusLabel, { color: item.active ? '#4CAF50' : '#FF5252' }]}>
            {item.active ? 'Đang hoạt động' : 'Đã khóa'}
          </ThemedText>
          <Switch
            value={item.active}
            onValueChange={() => handleToggleActive(item._id, item.active)}
            trackColor={{ false: '#f5f5f5', true: '#FF6F61' }}
            thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
            disabled={item._id === currentUser?._id}
          />
        </View>
        {item._id === currentUser?._id && (
          <ThemedText style={styles.selfNote}>(Tài khoản của bạn - Không thể khóa)</ThemedText>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Quản lý người dùng' }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF6F61" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Người dùng</ThemedText>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText>Không có người dùng nào</ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const Platform = require('react-native').Platform;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    color: '#FF6F61',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6F61',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 12,
    opacity: 0.5,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  userDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    opacity: 0.7,
  },
  addressText: {
    fontSize: 13,
    marginLeft: 6,
  },
  cardFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  selfNote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
});
