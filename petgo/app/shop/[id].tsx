import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shopRes, servicesRes] = await Promise.all([
        api.get(`/shop/${id}`),
        api.get(`/shop/${id}/services`),
      ]);
      if (shopRes.data.success) setShop(shopRes.data.data);
      if (servicesRes.data.success) setServices(servicesRes.data.data);
    } catch (error) {
      console.error('Error fetching shop detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = () => {
    const lat = shop?.coordinates?.latitude;
    const lng = shop?.coordinates?.longitude;
    const name = encodeURIComponent(shop?.name || 'Shop');

    if (lat != null && lng != null) {

      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      Linking.openURL(url).catch(() =>
        Alert.alert('Lỗi', 'Không thể mở Google Maps')
      );
    } else if (shop?.address?.street) {

      const addr = encodeURIComponent(shop.address.street);
      const url = `https://www.google.com/maps/search/?api=1&query=${addr}`;
      Linking.openURL(url).catch(() =>
        Alert.alert('Lỗi', 'Không thể mở Google Maps')
      );
    } else {
      Alert.alert('Thông báo', 'Shop chưa cập nhật địa chỉ hoặc tọa độ.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={styles.centered}>
        <ThemedText>Không tìm thấy shop.</ThemedText>
      </SafeAreaView>
    );
  }

  const hasImage = shop.image && shop.image !== 'no-photo.jpg';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {shop.name}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {hasImage ? (
          <Image source={{ uri: shop.image }} style={styles.banner} />
        ) : (
          <View style={[styles.banner, styles.bannerPlaceholder]}>
            <Ionicons name="storefront" size={64} color="#ddd" />
          </View>
        )}


        <ThemedView style={styles.infoCard}>
          <ThemedText style={styles.shopName}>
            {shop.name}
          </ThemedText>


          <TouchableOpacity style={styles.locationRow} onPress={openGoogleMaps} activeOpacity={0.7}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={18} color="#FF6F61" />
            </View>
            <ThemedText style={styles.locationText} numberOfLines={2}>
              {shop.address?.street || 'Chưa cập nhật địa chỉ'}
            </ThemedText>
            <View style={styles.mapBtn}>
              <Ionicons name="map" size={16} color="#fff" />
              <ThemedText style={styles.mapBtnText}>Chỉ đường</ThemedText>
            </View>
          </TouchableOpacity>


          {shop.phone ? (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${shop.phone}`)}
            >
              <Ionicons name="call" size={16} color="#4A90E2" />
              <ThemedText style={styles.contactText}>{shop.phone}</ThemedText>
            </TouchableOpacity>
          ) : null}


          {shop.email ? (
            <View style={styles.contactRow}>
              <Ionicons name="mail" size={16} color="#4A90E2" />
              <ThemedText style={styles.contactText}>{shop.email}</ThemedText>
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.bookBtn, { backgroundColor: '#4A90E2', marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]}
            onPress={() => router.push(`/chat/${id}` as any)}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            <ThemedText style={styles.bookBtnText}>Nhắn tin cho Shop</ThemedText>
          </TouchableOpacity>
        </ThemedView>


        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Dịch vụ cung cấp 🐾</ThemedText>
        </View>

        {services.length === 0 ? (
          <ThemedView style={styles.emptyBox}>
            <Ionicons name="sad-outline" size={36} color="#ccc" />
            <ThemedText style={styles.emptyText}>Shop chưa có dịch vụ nào</ThemedText>
          </ThemedView>
        ) : (
          <View style={styles.serviceList}>
            {services.map((svc) => (
              <ThemedView key={svc._id} style={styles.serviceCard}>
                <View style={styles.serviceTop}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.serviceName}>{svc.name}</ThemedText>
                    {svc.category?.name ? (
                      <View style={styles.categoryTag}>
                        <ThemedText style={styles.categoryTagText}>{svc.category.name}</ThemedText>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.priceBox}>
                    <ThemedText style={styles.price}>
                      {svc.price.toLocaleString('vi-VN')}đ
                    </ThemedText>
                  </View>
                </View>
                {svc.description ? (
                  <ThemedText style={styles.serviceDesc}>{svc.description}</ThemedText>
                ) : null}
                <View style={styles.serviceFooter}>
                  <View style={styles.serviceMeta}>
                    <Ionicons name="time-outline" size={13} color="#999" />
                    <ThemedText style={styles.serviceMetaText}>{svc.duration} phút</ThemedText>
                  </View>
                  <TouchableOpacity 
                    style={styles.bookBtn}
                    onPress={() => router.push(`/shop/book-service?serviceId=${svc._id}&shopId=${id}&serviceName=${encodeURIComponent(svc.name)}&price=${svc.price}` as any)}
                  >
                    <ThemedText style={styles.bookBtnText}>Đặt dịch vụ</ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  banner: { width: '100%', height: 200 },
  bannerPlaceholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shopName: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F4',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  locationIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFE8E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: { flex: 1, fontSize: 13, color: '#555' },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6F61',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  mapBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingVertical: 4,
  },
  contactText: { fontSize: 14, color: '#4A90E2' },
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  emptyBox: {
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { color: '#aaa', fontSize: 14 },
  serviceList: { paddingHorizontal: 16, gap: 12 },
  serviceCard: {
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  serviceTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  serviceName: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  categoryTag: {
    backgroundColor: '#EEF4FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  categoryTagText: { fontSize: 11, color: '#4A90E2' },
  priceBox: {
    backgroundColor: '#FFF5F4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  price: { fontSize: 15, fontWeight: 'bold', color: '#FF6F61' },
  serviceDesc: { fontSize: 13, color: '#888', marginBottom: 8, lineHeight: 18 },
  serviceFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  serviceMetaText: { fontSize: 12, color: '#999' },
  bookBtn: {
    backgroundColor: '#FF6F61',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
