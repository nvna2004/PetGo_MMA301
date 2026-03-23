import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/utils/api';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [])
  );

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching user for home:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </SafeAreaView>
    );
  }


  if (user && user.role === 'shop_owner') {
    return <ShopOwnerDashboard user={user} />;
  }

  return <CustomerHome user={user} />;
}


function ShopOwnerDashboard({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, bookingsRes] = await Promise.all([
        api.get('/shop/dashboard-stats'),
        api.get('/shop/pending-bookings')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (bookingsRes.data.success) {
        setPendingBookings(bookingsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching shop dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleApprove = async (id: string, action: 'confirmed' | 'cancelled') => {
    try {
      const res = await api.put(`/bookings/shop/${id}/status`, { status: action });
      if (res.data.success) {
        Alert.alert('Thành công', action === 'confirmed' ? 'Đã duyệt lịch hẹn thành công' : 'Đã từ chối lịch hẹn');
        fetchData();
      } else {
        Alert.alert('Lỗi', res.data.message || 'Không thể cập nhật trạng thái');
      }
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        

        <View style={shopStyles.headerContainer}>
          <View>
            <ThemedText style={shopStyles.greeting}>Xin chào {user?.name} 👋</ThemedText>
            <TouchableOpacity 
              style={shopStyles.shopInfoCard} 
              onPress={() => router.push('/user/edit-profile' as any)}
              activeOpacity={0.7}
            >
              <View style={shopStyles.shopAvatarPlaceholder}>
                <Ionicons name="storefront" size={24} color="#555" />
              </View>
              <View style={shopStyles.shopInfoText}>
                <ThemedText style={shopStyles.shopName}>{stats?.shopInfo?.name || 'Cửa hàng của bạn'}</ThemedText>
                <ThemedText style={shopStyles.shopAddress}>📍 {stats?.shopInfo?.address || 'Chưa cập nhật địa chỉ'}</ThemedText>
              </View>
              <Ionicons name="settings-outline" size={20} color="#FF6F61" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={shopStyles.bellIcon}>
            <Ionicons name="notifications-outline" size={28} color="#333" />
            <View style={shopStyles.badge}><ThemedText style={shopStyles.badgeText}>{stats?.stats?.pendingOrders || 0}</ThemedText></View>
          </TouchableOpacity>
        </View>


        <View style={shopStyles.statsGrid}>
          <View style={[shopStyles.statCard, { backgroundColor: '#F8FBFF' }]}>
            <View style={shopStyles.statIconRow}>
              <Ionicons name="calendar-outline" size={24} color="#4A90E2" />
              <View style={[shopStyles.badgeSmall, { backgroundColor: '#E0F0FF' }]} />
            </View>
            <ThemedText style={shopStyles.statLabel}><ThemedText style={{fontWeight: 'bold'}}>Booking</ThemedText> hôm nay</ThemedText>
            <ThemedText style={shopStyles.statValue}>{stats?.stats?.bookingsToday || 0}</ThemedText>
          </View>

          <View style={[shopStyles.statCard, { backgroundColor: '#F8FAF9' }]}>
            <View style={shopStyles.statIconRow}>
              <Ionicons name="paw-outline" size={24} color="#34C759" />
            </View>
            <ThemedText style={shopStyles.statLabel}><ThemedText style={{fontWeight: 'bold'}}>Thú cưng</ThemedText> đang chăm sóc</ThemedText>
            <ThemedText style={shopStyles.statValue}>{stats?.stats?.activePets || 0}</ThemedText>
          </View>

          <View style={[shopStyles.statCard, { backgroundColor: '#FFF9F9' }]}>
            <View style={shopStyles.statIconRow}>
              <Ionicons name="document-text-outline" size={24} color="#FF3B30" />
              <View style={[shopStyles.badgeSmall, { backgroundColor: '#FF3B30' }]}>
                <ThemedText style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>{stats?.stats?.pendingOrders || 0}</ThemedText>
              </View>
            </View>
            <ThemedText style={shopStyles.statLabel}><ThemedText style={{fontWeight: 'bold'}}>Đơn mới</ThemedText> chờ duyệt</ThemedText>
          </View>

          <View style={[shopStyles.statCard, { backgroundColor: '#FFFAF5' }]}>
            <View style={shopStyles.statIconRow}>
              <Ionicons name="cash-outline" size={24} color="#FF9500" />
            </View>
            <ThemedText style={shopStyles.statLabel}><ThemedText style={{fontWeight: 'bold'}}>Doanh thu</ThemedText> tháng này</ThemedText>
            <ThemedText style={shopStyles.statValueRevenue}>{(stats?.stats?.monthlyRevenue || 0).toLocaleString()} đ</ThemedText>
          </View>
        </View>


        <View style={shopStyles.sectionRow}>
          <ThemedText type="subtitle" style={shopStyles.sectionTitle}>Danh sách Booking 🐾</ThemedText>
          <TouchableOpacity><ThemedText style={shopStyles.viewAll}>Xem tất cả &gt;</ThemedText></TouchableOpacity>
        </View>

        {refreshing && pendingBookings.length === 0 ? (
          <ActivityIndicator size="small" color="#FF6F61" style={{ marginTop: 20 }} />
        ) : pendingBookings.length === 0 ? (
          <ThemedView style={shopStyles.emptyBox}>
            <ThemedText style={shopStyles.emptyText}>Không có booking nào chờ duyệt</ThemedText>
          </ThemedView>
        ) : (
          <View style={shopStyles.bookingList}>
            {pendingBookings.map((booking: any) => (
              <View key={booking._id} style={shopStyles.bookingItem}>
                <Image 
                  source={{ uri: booking.pet?.image && booking.pet.image !== 'no-photo.jpg' ? booking.pet.image : 'https://via.placeholder.com/60' }} 
                  style={shopStyles.petAvatar} 
                />
                <View style={shopStyles.bookingItemInfo}>
                  <ThemedText style={shopStyles.bookingItemTitle}>Khách: <ThemedText style={{fontWeight: 'bold'}}>{booking.user?.name}</ThemedText></ThemedText>
                  <ThemedText style={shopStyles.bookingItemSub}>{booking.pet?.name} • {booking.service?.name}</ThemedText>
                  <ThemedText style={shopStyles.bookingItemTime}>{booking.timeSlot} - {new Date(booking.bookingDate).toLocaleDateString('vi-VN')} | {booking.pet?.weight} kg</ThemedText>
                </View>
                <View style={shopStyles.bookingActions}>
                  <TouchableOpacity style={shopStyles.rejectBtn} onPress={() => handleApprove(booking._id, 'cancelled')}>
                    <ThemedText style={shopStyles.rejectBtnText}>Từ chối</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={shopStyles.approveBtn} onPress={() => handleApprove(booking._id, 'confirmed')}>
                    <ThemedText style={shopStyles.approveBtnText}>Duyệt</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}


        <View style={shopStyles.footerActions}>
          <TouchableOpacity 
            style={shopStyles.footerBtn} 
            onPress={() => router.push('/user/shop-bookings' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="list-outline" size={28} color="#4A90E2" />
            <ThemedText style={shopStyles.footerBtnTitle}>Danh sách{'\n'}booking</ThemedText>
            <View style={shopStyles.badgeBadge}><ThemedText style={shopStyles.badgeText}>{stats?.stats?.pendingOrders || 0}</ThemedText></View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[shopStyles.footerBtn, { backgroundColor: '#FDF7F7' }]}
            onPress={() => router.push('/(tabs)/chat' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#FF6F61" />
            <ThemedText style={[shopStyles.footerBtnTitle, { color: '#333' }]}>Chat với{'\n'}khách</ThemedText>
            <View style={[shopStyles.badgeBadge, { right: 8 }]}><ThemedText style={shopStyles.badgeText}>0</ThemedText></View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


function CustomerHome({ user }: { user: any }) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const initLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      try {
        const loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]) as Location.LocationObject;
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        coordsRef.current = coords;
        setUserCoords(coords);
        return coords;
      } catch {
        console.log('Location unavailable or timed out, skipping...');
        coordsRef.current = null;
        return null;
      }
    } catch (e) {
      console.error('Error requesting location permission:', e);
      return null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadContent = async () => {
        // 1. Fetch services ngay lập tức (không chờ GPS)
        if (isActive) {
          fetchServices(selectedCategory, searchText);
        }

        // 2. Lấy GPS song song — khi có tọa độ thì reload để hiện khoảng cách
        if (!coordsRef.current) {
          const coords = await initLocation();
          if (coords && isActive) {
            fetchServices(selectedCategory, searchText);
          }
        }
      };

      loadContent();

      return () => {
        isActive = false;
      };
    }, [selectedCategory])
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/services/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  const fetchServices = async (categoryId: string, q?: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryId) params.category = categoryId;
      if (q && q.trim()) params.q = q.trim();
      
      // Thêm tọa độ vào params để backend sắp xếp theo khoảng cách
      const coords = coordsRef.current;
      if (coords) {
        params.lat = coords.latitude;
        params.lng = coords.longitude;
      }

      const res = await api.get('/services/all', { params });
      if (res.data.success) {
        setServices(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    fetchServices(selectedCategory, text);
  }, [selectedCategory]);

  const handleSelectCategory = (id: string) => {
    const next = selectedCategory === id ? '' : id;
    setSelectedCategory(next);

  };

  const handleClearFilter = () => {
    setSearchText('');
    setSelectedCategory('');
    fetchServices('', '');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>

        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Xin chào {user ? user.name : 'bạn'} 👋</ThemedText>
          <View style={styles.searchBarContainer}>
            <IconSymbol name="magnifyingglass" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              placeholder="Tìm dịch vụ: tắm sấy, cắt lông..."
              style={styles.searchInput}
              placeholderTextColor="#8E8E93"
              value={searchText}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={18} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </ThemedView>


        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }}
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          >
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === '' && styles.filterChipActive]}
              onPress={() => handleSelectCategory('')}
            >
              <ThemedText style={[styles.filterChipText, selectedCategory === '' && styles.filterChipTextActive]}>
                Tất cả
              </ThemedText>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat._id}
                style={[styles.filterChip, selectedCategory === cat._id && styles.filterChipActive]}
                onPress={() => handleSelectCategory(cat._id)}
              >
                <ThemedText style={[styles.filterChipText, selectedCategory === cat._id && styles.filterChipTextActive]}>
                  {cat.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}


        <View style={styles.sectionHeaderBetween}>
          <ThemedText type="subtitle">
            {selectedCategory
              ? `${categories.find(c => c._id === selectedCategory)?.name || 'Dịch vụ'} 🏷️`
              : searchText
              ? `Kết quả tìm kiếm 🔍`
              : 'Dịch vụ nổi bật 🐾'}
          </ThemedText>
          {(selectedCategory || searchText) ? (
            <TouchableOpacity onPress={handleClearFilter}>
              <ThemedText style={styles.viewMore}>Xoá bộ lọc</ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#FF6F61" style={{ marginVertical: 20 }} />
        ) : services.length === 0 ? (
          <ThemedView style={styles.emptyShops}>
            <Ionicons name="search-outline" size={40} color="#ccc" />
            <ThemedText style={styles.emptyShopsText}>
              {searchText ? `Không tìm thấy dịch vụ "${searchText}"` : 'Chưa có dịch vụ nào'}
            </ThemedText>
          </ThemedView>
        ) : (
          <View style={styles.shopsContainer}>
            {services.map((service: any) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceCard({ service }: { service: any }) {
  const distanceLabel = service._distance != null 
    ? (service._distance < 1 ? '< 1 km' : `${service._distance.toFixed(1)} km`)
    : null;

  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => router.push(`/shop/${service.shopOwner?._id}` as any)}
      activeOpacity={0.8}
    >
      {service.image && service.image !== 'no-photo.jpg' ? (
        <Image source={{ uri: service.image }} style={styles.serviceImage} />
      ) : (
        <View style={[styles.serviceImage, styles.shopImagePlaceholder]}>
          <Ionicons name="paw" size={28} color="#ccc" />
        </View>
      )}
      <View style={styles.serviceDetails}>
        <ThemedText style={styles.serviceName} numberOfLines={1}>{service.name}</ThemedText>
        
        <View style={styles.serviceMetaRow}>
          <View style={styles.serviceBadge}>
            <Ionicons name="pricetag-outline" size={12} color="#FF6F61" />
            <ThemedText style={styles.serviceBadgeText}>
              {service.price?.toLocaleString('vi-VN')} đ
            </ThemedText>
          </View>
          <View style={[styles.serviceBadge, { backgroundColor: '#E8F5FF' }]}>
            <Ionicons name="time-outline" size={12} color="#4A90E2" />
            <ThemedText style={[styles.serviceBadgeText, { color: '#4A90E2' }]}>
              {service.duration} phút
            </ThemedText>
          </View>
        </View>

        <View style={styles.serviceFooterRow}>
          <ThemedText style={styles.serviceShopName} numberOfLines={1}>
            🏪 {service.shopOwner?.name || 'Shop'}
          </ThemedText>
          {distanceLabel && (
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate" size={10} color="#FF6F61" />
              <ThemedText style={styles.distanceBadgeText}>{distanceLabel}</ThemedText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}


function CategoryItem({ icon, label }: { icon: any, label: string }) {
  return (
    <TouchableOpacity style={styles.categoryItem}>
      <View style={styles.categoryIconSquare}>
        <IconSymbol name={icon} size={32} color="#000" />
      </View>
      <ThemedText style={styles.categoryLabel}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

function ShopCard({ shopId, name, address, imageUri, distance }: {
  shopId: string;
  name: string;
  address: string;
  imageUri: string | null;
  distance: number | null;
}) {
  const distanceLabel = distance != null
    ? distance < 1
      ? `${Math.round(distance * 1000)} m`
      : `${distance.toFixed(1)} km`
    : null;

  return (
    <TouchableOpacity style={styles.shopCard} onPress={() => router.push(`/shop/${shopId}` as any)}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.shopImage} />
      ) : (
        <View style={[styles.shopImage, styles.shopImagePlaceholder]}>
          <Ionicons name="storefront" size={32} color="#ccc" />
        </View>
      )}
      <View style={styles.shopDetails}>
        <View style={styles.shopHeaderRow}>
          <ThemedText style={styles.shopName}>{name}</ThemedText>
          {distanceLabel && (
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate" size={10} color="#FF6F61" />
              <ThemedText style={styles.distanceBadgeText}>{distanceLabel}</ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={styles.distance} numberOfLines={2}>📍 {address}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const shopStyles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  shopInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    width: 260,
  },
  shopAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopInfoText: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  shopAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  bellIcon: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badgeSmall: {
    minWidth: 16,
    paddingHorizontal: 4,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#555',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statValueRevenue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAll: {
    color: '#007AFF',
    fontSize: 14,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    color: '#999',
  },
  bookingList: {
    gap: 12,
  },
  bookingItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  petAvatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  bookingItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bookingItemTitle: {
    fontSize: 14,
    color: '#333',
  },
  bookingItemSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  bookingItemTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  bookingActions: {
    justifyContent: 'space-between',
    width: 80,
  },
  rejectBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  approveBtn: {
    backgroundColor: '#34C759',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  footerBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F8FF',
    padding: 16,
    borderRadius: 16,
    position: 'relative',
  },
  footerBtnTitle: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  badgeBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    backgroundColor: '#FF3B30',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 20,
    gap: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionSub: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderBetween: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    width: '22%',
  },
  categoryIconSquare: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  serviceTags: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255, 111, 97, 0.12)',
    borderColor: '#FF6F61',
  },
  filterChipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FF6F61',
    fontWeight: 'bold',
  },
  shopsContainer: {
    marginTop: 20,
    gap: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  serviceDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  serviceBadgeText: {
    fontSize: 12,
    color: '#FF6F61',
    fontWeight: '600',
  },
  serviceFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceShopName: {
    fontSize: 13,
    color: '#8E8E93',
    flex: 1,
    marginRight: 8,
  },
  shopCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  shopImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  shopDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  shopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewMore: {
    fontSize: 12,
    color: '#007AFF',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  stars: {
    fontSize: 12,
  },
  distance: {
    fontSize: 12,
    color: '#8E8E93',
  },
  shopTags: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  shopTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  shopTagText: {
    fontSize: 10,
    color: '#8E8E93',
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  bookingImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  bookingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bookingSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  bookingTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyShops: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 32,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyShopsText: {
    marginTop: 8,
    color: '#ccc' as const,
    fontSize: 14,
  },
  shopImagePlaceholder: {
    backgroundColor: '#F2F2F7',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  distanceBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF0EE',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  distanceBadgeText: {
    fontSize: 11,
    color: '#FF6F61',
    fontWeight: '600' as const,
  },
});

