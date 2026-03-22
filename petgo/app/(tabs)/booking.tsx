import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';

import ShopBookingsScreen from '../user/shop-bookings';

const STATUS_MAP: any = {
  pending: { label: 'Đang chờ', color: '#FFB800', bg: '#FFF9E6' },
  confirmed: { label: 'Đã xác nhận', color: '#007AFF', bg: '#E5F1FF' },
  completed: { label: 'Hoàn thành', color: '#34C759', bg: '#EBF9EE' },
  cancelled: { label: 'Đã hủy', color: '#FF3B30', bg: '#FFEBEA' },
};

export default function BookingScreen() {
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchUserRole = async () => {
        try {
          const res = await api.get('/users/me');
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (error) {
          console.error('Error fetching user for booking tab:', error);
        } finally {
          setIsReady(true);
        }
      };
      fetchUserRole();
    }, [])
  );

  if (!isReady) {
    return (
      <SafeAreaView style={[styles.centered, { flex: 1 }]}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </SafeAreaView>
    );
  }

  if (user && user.role === 'shop_owner') {
    return <ShopBookingsScreen />;
  }

  return <CustomerBookingScreen />;
}

function CustomerBookingScreen() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      const res = await api.get('/bookings/my');
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
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

  const onRefresh = () => fetchBookings(true);

  const handleCancel = async (id: string) => {
    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc chắn muốn hủy lịch đặt này không? Lịch đặt chỉ có thể hủy trước ít nhất 24 giờ.',
      [
        { text: 'Quay lại', style: 'cancel' },
        { 
          text: 'Hủy lịch', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.put(`/bookings/${id}/cancel`);
              if (res.data.success) {
                Alert.alert('Thành công', 'Lịch đặt đã được hủy');
                fetchBookings(true);
              }
            } catch (error: any) {
              console.error('Lỗi hủy lịch:', error);
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hủy lịch đặt');
            }
          }
        }
      ]
    );
  };

  const renderBookingItem = ({ item }: { item: any }) => {
    const status = STATUS_MAP[item.status] || STATUS_MAP.pending;
    const date = new Date(item.bookingDate);
    const dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    const canCancel = (item.status === 'pending' || item.status === 'confirmed') && diffDays > 1;

    return (
      <View style={styles.card}>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => router.push(`/shop/${item.shopOwner?._id}` as any)}
        >
          <View style={styles.cardHeader}>
            <ThemedText style={styles.shopName} numberOfLines={1}>
              🏪 {item.shopOwner?.name || 'Shop'}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <ThemedText style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </ThemedText>
            </View>
          </View>

          <View style={styles.cardBody}>
            {item.service?.image && item.service.image !== 'no-photo.jpg' ? (
              <Image source={{ uri: item.service.image }} style={styles.serviceImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="paw" size={24} color="#ccc" />
              </View>
            )}

            <View style={styles.details}>
              <ThemedText style={styles.serviceName}>{item.service?.name}</ThemedText>
              <ThemedText style={styles.petName}>Thú cưng: {item.pet?.name}</ThemedText>
              
              <View style={styles.timeRow}>
                <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
                <ThemedText style={styles.timeText}>{dateString}</ThemedText>
                <Ionicons name="time-outline" size={14} color="#8E8E93" style={{ marginLeft: 12 }} />
                <ThemedText style={styles.timeText}>{item.timeSlot}</ThemedText>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <View>
            <ThemedText style={styles.price}>
              {item.price?.toLocaleString('vi-VN')} đ
            </ThemedText>
            <ThemedText style={styles.paymentMethod}>
              {item.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
            </ThemedText>
          </View>
          
          {canCancel && (
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => handleCancel(item._id)}
            >
              <ThemedText style={styles.cancelBtnText}>Hủy lịch</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Lịch sử đặt lịch</ThemedText>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6F61']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyText}>Bạn chưa có lịch đặt nào.</ThemedText>
            <TouchableOpacity 
              style={styles.bookNowBtn}
              onPress={() => router.push('/')}
            >
              <ThemedText style={styles.bookNowText}>Khám phá dịch vụ ngay</ThemedText>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopName: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  petName: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6F61',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 24,
  },
  bookNowBtn: {
    backgroundColor: '#FF6F61',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookNowText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: '#FFEBEA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelBtnText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
