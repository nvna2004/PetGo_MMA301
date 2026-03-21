import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api, { removeStoredToken } from '@/utils/api';
import { showSuccess, showError, showToast, showConfirm } from '@/utils/alertHelper';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin cá nhân');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    showConfirm(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      async () => {
        try {

          await api.post('/users/logout');

          await removeStoredToken();
          showToast('Đăng xuất thành công!', 'success');
          router.replace('/(auth)/login');
        } catch (error) {
          console.error('Error during logout:', error);

          await removeStoredToken();
          router.replace('/(auth)/login');
        }
      }
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Không tìm thấy thông tin người dùng</ThemedText>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/(auth)/login')}>
          <ThemedText style={styles.loginButtonText}>Đăng nhập lại</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user.avatar === 'no-avatar.jpg' ? 'https://via.placeholder.com/150' : user.avatar }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <ThemedText type="title" style={styles.userName}>{user.name}</ThemedText>
        <ThemedText style={styles.userRole}>{user.role === 'customer' ? 'Khách hàng' : user.role === 'shop_owner' ? 'Chủ cửa hàng' : 'Quản trị viên'}</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Thông tin cá nhân</ThemedText>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={24} color="#FF6F61" />
          <View style={styles.infoTextContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <ThemedText style={styles.value}>{user.email}</ThemedText>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={24} color="#FF6F61" />
          <View style={styles.infoTextContainer}>
            <ThemedText style={styles.label}>Số điện thoại</ThemedText>
            <ThemedText style={styles.value}>{user.phone}</ThemedText>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={24} color="#FF6F61" />
          <View style={styles.infoTextContainer}>
            <ThemedText style={styles.label}>Địa chỉ</ThemedText>
            <ThemedText style={styles.value}>
              {(user.address?.street) ? `${user.address.street}, ` : ''}
              {(user.address?.ward) ? `${user.address.ward}, ` : ''}
              {(user.address?.city) ? `${user.address.city}` : 'Chưa cập nhật'}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Cài đặt tài khoản</ThemedText>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/user/edit-profile' as any)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="person-outline" size={24} color="#FF6F61" />
            <ThemedText style={styles.menuItemText}>Chỉnh sửa hồ sơ</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {user.role === 'admin' && (
          <TouchableOpacity 
            style={[styles.menuItem, { marginTop: 12 }]} 
            onPress={() => router.push('/admin/dashboard' as any)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#FF6F61" />
              <ThemedText style={styles.menuItemText}>Bảng quản trị (Admin)</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.menuItem, { marginTop: 12 }]}
          onPress={() => router.push('/user/change-password' as any)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="key-outline" size={24} color="#FF6F61" />
            <ThemedText style={styles.menuItemText}>Đổi mật khẩu</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {user.role === 'customer' && (
          <TouchableOpacity 
            style={[styles.menuItem, { marginTop: 12 }]} 
            onPress={() => router.push('/user/shop-registration' as any)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="storefront-outline" size={24} color="#FF6F61" />
              <ThemedText style={styles.menuItemText}>Đăng ký mở Shop</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#FF4D4D" />
        <ThemedText style={styles.logoutText}>Đăng xuất</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FF6F61',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#4A90E2',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  userRole: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 0,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    opacity: 0.6,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  label: {
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 16,
    borderRadius: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF4D4D',
    marginTop: 20,
  },
  logoutText: {
    color: '#FF4D4D',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: '#FF6F61',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editProfileButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cancelEditButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editProfileButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  editNameContainer: {
    alignItems: 'center',
    width: '80%',
  },
  editNameInput: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    width: '100%',
    paddingVertical: 4,
  },
  editAddressContainer: {
    marginTop: 8,
  },
  editInput: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  editLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
    fontWeight: '600',
  },
  editLabelWhite: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
});
