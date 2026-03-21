import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';
import { showError, showSuccess, showConfirm } from '@/utils/alertHelper';

export default function ServicesScreen() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchServices();
    }, [])
  );

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('services/my');
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Fetch services error:', error);
      showError('Lỗi', 'Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = (id: string) => {
    showConfirm(
      'Xóa dịch vụ',
      'Bạn có chắc chắn muốn xóa dịch vụ này không?',
      async () => {
        try {
          const response = await api.delete(`services/${id}`);
          if (response.data.success) {
            showSuccess('Thành công', 'Đã xóa dịch vụ');
            fetchServices();
          }
        } catch (error) {
          console.error('Delete service error:', error);
          showError('Lỗi', 'Không thể xóa dịch vụ');
        }
      }
    );
  };

  const renderServiceItem = ({ item }: { item: any }) => (
    <View style={styles.serviceCard}>
      <Image
        source={{ uri: item.image === 'no-photo.jpg' ? 'https://via.placeholder.com/150' : item.image }}
        style={styles.serviceImage}
      />
      <View style={styles.serviceInfo}>
        <ThemedText style={styles.serviceName}>{item.name}</ThemedText>
        <ThemedText style={styles.serviceCategory}>{item.category?.name || 'Chưa phân loại'}</ThemedText>
        <ThemedText style={styles.servicePrice}>{item.price.toLocaleString('vi-VN')}đ</ThemedText>
        <ThemedText style={styles.serviceDuration}>
          <Ionicons name="time-outline" size={14} color="#666" /> {item.duration} phút
        </ThemedText>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push({ pathname: '/user/add-service', params: { id: item._id } } as any)}
        >
          <Ionicons name="create-outline" size={20} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteService(item._id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF4D4D" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF6F61" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Quản lý dịch vụ</ThemedText>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/user/add-service' as any)}
        >
          <Ionicons name="add-circle" size={32} color="#FF6F61" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6F61" />
        </View>
      ) : services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="list" size={80} color="#ddd" />
          <ThemedText style={styles.emptyText}>Bạn chưa có dịch vụ nào.</ThemedText>
          <TouchableOpacity 
            style={styles.emptyAddButton}
            onPress={() => router.push('/user/add-service' as any)}
          >
            <ThemedText style={styles.emptyAddButtonText}>Thêm dịch vụ ngay</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchServices}
          refreshing={loading}
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    color: '#FF6F61',
    flex: 1,
    marginLeft: 12,
  },
  addButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6F61',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyAddButton: {
    marginTop: 24,
    backgroundColor: '#FF6F61',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
