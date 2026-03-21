import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api, { BASE_URL } from '@/utils/api';
import { showError } from '@/utils/alertHelper';

export default function AdminPetsScreen() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchPets();
    }, [])
  );

  const fetchPets = async () => {
    try {
      const response = await api.get('admin/pets');
      if (response.data.success) {
        setPets(response.data.pets);
      }
    } catch (error) {
      console.error('Error fetching admin pets:', error);
      showError('Lỗi', 'Không thể tải danh sách thú cưng toàn hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const getPetImage = (imagePath: string) => {
    if (!imagePath || imagePath === 'no-pet-photo.jpg') {
      return 'https://via.placeholder.com/150';
    }
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}/${imagePath}`;
  };

  const renderPetItem = ({ item }: { item: any }) => (
    <View style={styles.petCard}>
      <Image
        source={{ uri: getPetImage(item.image) }}
        style={styles.petImage}
      />
      <View style={styles.petInfo}>
        <View style={styles.petHeader}>
          <ThemedText style={styles.petName}>{item.name}</ThemedText>
          <View style={styles.typeTag}>
            <ThemedText style={styles.typeText}>{item.type}</ThemedText>
          </View>
        </View>
        
        <ThemedText style={styles.petBreed}>Giống: {item.breed || 'Không rõ'}</ThemedText>
        
        <View style={styles.ownerInfo}>
          <Ionicons name="person" size={12} color="#888" />
          <ThemedText style={styles.ownerText}>
            Chủ: {item.owner?.name || 'Không rõ'} ({item.owner?.email || 'N/A'})
          </ThemedText>
        </View>
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
      <Stack.Screen options={{ title: 'Quản lý thú cưng' }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF6F61" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Tất cả thú cưng</ThemedText>
      </View>

      <FlatList
        data={pets}
        keyExtractor={(item) => item._id}
        renderItem={renderPetItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText>Không có thú cưng nào trên hệ thống</ThemedText>
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
  petCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  petInfo: {
    flex: 1,
    marginLeft: 16,
  },
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  typeTag: {
    backgroundColor: '#FFF0EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    color: '#FF6F61',
    fontWeight: 'bold',
  },
  petBreed: {
    fontSize: 14,
    opacity: 0.6,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ownerText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
});
