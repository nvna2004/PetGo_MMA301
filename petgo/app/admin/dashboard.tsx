import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';
import { showError } from '@/utils/alertHelper';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    try {
      const response = await api.get('admin/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      showError('Lỗi', 'Không thể tải thống kê hệ thống');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Bảng quản trị' }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF6F61" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Quản trị hệ thống</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="people" size={32} color="#1976D2" />
            <ThemedText style={styles.statValue}>{stats?.users || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Người dùng</ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#F1F8E9' }]}>
            <Ionicons name="paw" size={32} color="#388E3C" />
            <ThemedText style={styles.statValue}>{stats?.pets || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Thú cưng</ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="checkmark-circle" size={32} color="#F57C00" />
            <ThemedText style={styles.statValue}>{stats?.activeUsers || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Active Users</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.sectionTitle}>Quản lý chi tiết</ThemedText>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/admin/users' as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#E8EAF6' }]}>
              <Ionicons name="people-outline" size={24} color="#3F51B5" />
            </View>
            <View>
              <ThemedText style={styles.menuItemTitle}>Dánh sách người dùng</ThemedText>
              <ThemedText style={styles.menuItemDesc}>Quản lý trạng thái kích hoạt tài khoản</ThemedText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { marginTop: 12 }]}
          onPress={() => router.push('/admin/pets' as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#FCE4EC' }]}>
              <Ionicons name="paw-outline" size={24} color="#E91E63" />
            </View>
            <View>
              <ThemedText style={styles.menuItemTitle}>Danh sách thú cưng</ThemedText>
              <ThemedText style={styles.menuItemDesc}>Xem thông tin và loại thú cưng hệ thống</ThemedText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { marginTop: 12 }]}
          onPress={() => router.push('/admin/shop-requests' as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="document-text-outline" size={24} color="#F57C00" />
            </View>
            <View>
              <ThemedText style={styles.menuItemTitle}>Yêu cầu mở Shop</ThemedText>
              <ThemedText style={styles.menuItemDesc}>Duyệt yêu cầu đăng ký mở cửa hàng</ThemedText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

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
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    color: '#FF6F61',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    opacity: 0.8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItemDesc: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
});
