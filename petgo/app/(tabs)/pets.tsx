import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api, { BASE_URL } from '@/utils/api';
import { showError } from '@/utils/alertHelper';

export default function PetsScreen() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchPets();
    }, [])
  );

  const fetchPets = async () => {
    try {
      const response = await api.get('pets');
      if (response.data.success) {
        setPets(response.data.pets);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      showError('Lỗi', 'Không thể tải danh sách thú cưng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPets();
  };

  const getPetImage = (imagePath: string) => {
    if (!imagePath || imagePath === 'no-pet-photo.jpg') {
      return 'https://via.placeholder.com/150';
    }
    if (imagePath.startsWith('http')) return imagePath;
    
    return `${BASE_URL}/${imagePath}`;
  };

  const renderPetItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => router.push(`/pet/${item._id}` as any)}
    >
      <Image
        source={{ uri: getPetImage(item.image) }}
        style={styles.petImage}
      />
      <View style={styles.petInfo}>
        <ThemedText style={styles.petName}>{item.name}</ThemedText>
        <ThemedText style={styles.petBreed}>
          {item.type} • {item.breed || 'Không rõ giống'}
        </ThemedText>
        <View style={styles.tagRow}>
          {item.age && (
            <View style={styles.tag}>
              <ThemedText style={styles.tagText}>{item.age} tuổi</ThemedText>
            </View>
          )}
          {item.weight && (
            <View style={styles.tag}>
              <ThemedText style={styles.tagText}>{item.weight} kg</ThemedText>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Thú cưng của tôi</ThemedText>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/pet/add-pet')}
        >
          <Ionicons name="add-circle" size={32} color="#FF6F61" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={pets}
        keyExtractor={(item) => item._id}
        renderItem={renderPetItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6F61']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="paw-outline" size={80} color="#ccc" />
            <ThemedText style={styles.emptyText}>Bạn chưa có thú cưng nào</ThemedText>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/pet/add-pet')}
            >
              <ThemedText style={styles.createButtonText}>Thêm thú cưng ngay</ThemedText>
            </TouchableOpacity>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    color: '#FF6F61',
  },
  addButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  petImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#fff',
  },
  petInfo: {
    flex: 1,
    marginLeft: 16,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  petBreed: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  tag: {
    backgroundColor: '#FFF0EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#FF6F61',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#FF6F61',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
