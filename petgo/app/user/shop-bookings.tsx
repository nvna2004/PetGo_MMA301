import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';

const STATUS_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ duyệt' },
  { id: 'confirmed', label: 'Đã duyệt' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã huỷ' }
];

export default function ShopBookingsScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/bookings/shop');
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching shop bookings:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const handleUpdateStatus = async (id: string, action: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const res = await api.put(`/bookings/shop/${id}/status`, { status: action });
      if (res.data.success) {
        Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng');
        fetchBookings(false);
      } else {
        Alert.alert('Lỗi', res.data.message || 'Không thể cập nhật');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const filteredBookings = bookings.filter(b => activeTab === 'all' || b.status === activeTab);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'Chờ duyệt', color: '#FF9500' };
      case 'confirmed': return { text: 'Đã duyệt', color: '#34C759' };
      case 'completed': return { text: 'Hoàn thành', color: '#007AFF' };
      case 'cancelled': return { text: 'Đã huỷ', color: '#FF3B30' };
      default: return { text: status, color: '#333' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Quản lý Đơn hàng</ThemedText>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {STATUS_TABS.map(tab => (
            <TouchableOpacity 
              key={tab.id} 
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <ThemedText style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6F61" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {refreshing && <ActivityIndicator size="small" color="#4A90E2" style={{ marginBottom: 12 }} />}
          
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={60} color="#ccc" />
              <ThemedText style={styles.emptyText}>Không có đơn hàng nào</ThemedText>
            </View>
          ) : (
            filteredBookings.map((booking: any) => {
              const statusInfo = getStatusText(booking.status);
              return (
                <View key={booking._id} style={styles.bookingCard}>
                  <View style={styles.cardHeader}>
                    <ThemedText style={styles.timeText}>{new Date(booking.createdAt).toLocaleString('vi-VN')}</ThemedText>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                      <ThemedText style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Image 
                      source={{ uri: booking.pet?.image && booking.pet.image !== 'no-photo.jpg' ? booking.pet.image : 'https://via.placeholder.com/60' }} 
                      style={styles.petImage} 
                    />
                    <View style={styles.serviceInfo}>
                      <ThemedText style={styles.serviceName}>{booking.service?.name}</ThemedText>
                      <ThemedText style={styles.petText}>{booking.pet?.name} ({booking.pet?.breed || booking.pet?.type})</ThemedText>
                      <ThemedText style={styles.bookingTime}>⏰ {booking.timeSlot} | {new Date(booking.bookingDate).toLocaleDateString('vi-VN')}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.customerInfo}>
                    <ThemedText style={styles.customerDetail}>👤 {booking.user?.name || 'Khách hàng'}</ThemedText>
                    <ThemedText style={styles.priceText}>{booking.price?.toLocaleString('vi-VN')} đ</ThemedText>
                  </View>

                  {booking.status === 'pending' && (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleUpdateStatus(booking._id, 'cancelled')}>
                        <ThemedText style={styles.rejectText}>Từ chối</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleUpdateStatus(booking._id, 'confirmed')}>
                        <ThemedText style={styles.approveText}>Duyệt đơn</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}

                  {booking.status === 'confirmed' && (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={() => handleUpdateStatus(booking._id, 'completed')}>
                        <ThemedText style={styles.completeText}>Đánh dấu Hoàn thành</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 12
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0'
  },
  tabBtnActive: {
    backgroundColor: '#4A90E2'
  },
  tabText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500'
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold'
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    marginTop: 16,
    color: '#888',
    fontSize: 16
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petImage: {
    width: 65,
    height: 65,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#f5f5f5'
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  petText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingTime: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerDetail: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6F61',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: '#FFF0F0',
  },
  rejectText: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  approveBtn: {
    backgroundColor: '#4A90E2',
  },
  approveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  completeBtn: {
    backgroundColor: '#E8F5E9',
  },
  completeText: {
    color: '#34C759',
    fontWeight: 'bold',
  }
});
