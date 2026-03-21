import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';
import { showError, showSuccess } from '@/utils/alertHelper';

export default function AddServiceScreen() {
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30',
    image: 'no-photo.jpg',
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchServiceDetails();
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('services/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const fetchServiceDetails = async () => {
    try {
      const response = await api.get(`services/my`);
      if (response.data.success) {
        const service = response.data.data.find((s: any) => s._id === id);
        if (service) {
          setFormData({
            name: service.name,
            description: service.description || '',
            price: service.price.toString(),
            duration: service.duration.toString(),
            image: service.image,
          });
          setSelectedCategory(service.category?._id || '');
        }
      }
    } catch (error) {
      console.error('Fetch service details error:', error);
      showError('Lỗi', 'Không thể tải thông tin dịch vụ');
    } finally {
      setFetching(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      // In a real app, you would upload to a server
      // For now, we'll just use the local URI
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Thiếu thông tin', 'Vui lòng nhập tên dịch vụ');
      return;
    }
    if (!selectedCategory) {
      showError('Thiếu thông tin', 'Vui lòng chọn loại dịch vụ');
      return;
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      showError('Thiếu thông tin', 'Vui lòng nhập giá dịch vụ hợp lệ');
      return;
    }
    if (!formData.duration || isNaN(Number(formData.duration)) || Number(formData.duration) <= 0) {
      showError('Thiếu thông tin', 'Vui lòng nhập thời gian thực hiện hợp lệ');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        category: selectedCategory,
      };

      let response;
      if (isEditing) {
        response = await api.put(`services/${id}`, payload);
      } else {
        response = await api.post('services', payload);
      }

      if (response.data.success) {
        showSuccess('Thành công', isEditing ? 'Cập nhật dịch vụ thành công' : 'Thêm dịch vụ thành công');
        router.back();
      }
    } catch (error: any) {
      console.error('Submit service error:', error);
      showError('Lỗi', error.response?.data?.message || 'Không thể lưu dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF6F61" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>{isEditing ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</ThemedText>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
            {formData.image && formData.image !== 'no-photo.jpg' ? (
              <Image source={{ uri: formData.image }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#999" />
                <ThemedText style={styles.imagePlaceholderText}>Chọn ảnh dịch vụ</ThemedText>
              </View>
            )}
            <View style={styles.editImageIcon}>
              <Ionicons name="pencil" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Tên dịch vụ *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Tắm sấy chó mèo"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Loại dịch vụ *</ThemedText>
            <View style={styles.categoryContainer}>
              {categories.length === 0 && (
                <ThemedText style={{ color: '#FF4D4D', fontStyle: 'italic' }}>
                  Đang tải hoặc chưa có loại dịch vụ nào.
                </ThemedText>
              )}
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat._id && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat._id)}
                >
                  <ThemedText 
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat._id && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
              <ThemedText style={styles.label}>Giá dịch vụ (vnđ) *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <ThemedText style={styles.label}>Thời gian (phút) *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="30"
                keyboardType="numeric"
                value={formData.duration}
                onChangeText={(text) => setFormData({ ...formData, duration: text })}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Mô tả</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả chi tiết về dịch vụ..."
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.submitButtonText}>{isEditing ? 'Lưu thay đổi' : 'Thêm dịch vụ'}</ThemedText>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  imagePicker: {
    height: 180,
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  editImageIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  categoryChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipSelected: {
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
    borderColor: '#FF6F61',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextSelected: {
    color: '#FF6F61',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#FF6F61',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
