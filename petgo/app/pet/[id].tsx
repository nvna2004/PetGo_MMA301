import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api, { BASE_URL } from '@/utils/api';
import { showSuccess, showError, showConfirm } from '@/utils/alertHelper';

const PET_TYPES = [
  { label: 'Chó', value: 'Dog', icon: 'paw' },
  { label: 'Mèo', value: 'Cat', icon: 'logo-github' },
  { label: 'Chim', value: 'Bird', icon: 'airplane' },
  { label: 'Khác', value: 'Other', icon: 'help-circle' },
];

export default function PetDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);


  const [name, setName] = useState('');
  const [type, setType] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);

  const getPetImage = (imagePath: string) => {
    if (!imagePath || imagePath === 'no-pet-photo.jpg') {
      return 'https://via.placeholder.com/150';
    }
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}/${imagePath}`;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
    }
  };

  useEffect(() => {
    fetchPetDetails();
  }, [id]);

  const fetchPetDetails = async () => {
    try {
      const response = await api.get(`pets/${id}`);
      if (response.data.success) {
        const data = response.data.pet;
        setPet(data);
        setName(data.name || '');
        setType(data.type || 'Dog');
        setBreed(data.breed || '');
        setWeight(data.weight?.toString() || '');
        setAge(data.age?.toString() || '');
        setMedicalNotes(data.medicalNotes || '');
      }
    } catch (error) {
      console.error('Error fetching pet details:', error);
      showError('Lỗi', 'Không thể tải thông tin thú cưng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePet = async () => {
    if (!name || !type) {
      showError('Lỗi', 'Vui lòng nhập tên và loại thú cưng');
      return;
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('type', type);
      formData.append('breed', breed);
      if (weight) formData.append('weight', weight);
      if (age) formData.append('age', age);
      formData.append('medicalNotes', medicalNotes);

      if (newImage) {
        if (Platform.OS === 'web') {
          const response = await fetch(newImage);
          const blob = await response.blob();
          formData.append('image', blob, `pet-${id}-${Date.now()}.jpg`);
        } else {
          const uriParts = newImage.split('.');
          const fileType = uriParts[uriParts.length - 1];
          formData.append('image', {
            uri: newImage,
            name: `pet-${id}-${Date.now()}.${fileType}`,
            type: `image/${fileType}`,
          } as any);
        }
      }

      const response = await api.put(`pets/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        showSuccess('Thành công', 'Đã cập nhật thông tin thú cưng');
        setPet(response.data.pet);
        setNewImage(null);
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Update pet error:', error);
      showError('Lỗi', error.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePet = () => {
    showConfirm(
      'Xóa thú cưng',
      'Bạn có chắc chắn muốn xóa hồ sơ thú cưng này không?',
      async () => {
        try {
          const response = await api.delete(`pets/${id}`);
          if (response.data.success) {
            showSuccess('Thành công', 'Đã xóa hồ sơ thú cưng');
            router.replace('/(tabs)/pets');
          }
        } catch (error: any) {
          showError('Lỗi', error.response?.data?.message || 'Không thể xóa hồ sơ');
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

  if (!pet) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Không tìm thấy thông tin thú cưng</ThemedText>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <ThemedText style={styles.backLinkText}>Quay lại</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        title: isEditing ? 'Chỉnh sửa' : pet.name,
        headerRight: () => (
          <TouchableOpacity onPress={() => isEditing ? handleUpdatePet() : setIsEditing(true)}>
            <ThemedText style={styles.headerAction}>{isEditing ? 'Lưu' : 'Sửa'}</ThemedText>
          </TouchableOpacity>
        )
      }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {isEditing ? (
            <View style={styles.form}>
              <View style={styles.imagePickerContainer}>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  <Image source={{ uri: newImage || getPetImage(pet.image) }} style={styles.previewImage} />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={24} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Tên thú cưng *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <ThemedText style={styles.label}>Loại thú cưng *</ThemedText>
              <View style={styles.typeSelector}>
                {PET_TYPES.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.typeItem,
                      type === item.value && styles.typeItemActive,
                    ]}
                    onPress={() => setType(item.value)}
                  >
                    <Ionicons 
                      name={item.icon as any} 
                      size={24} 
                      color={type === item.value ? '#fff' : '#FF6F61'} 
                    />
                    <ThemedText style={[
                      styles.typeLabel,
                      type === item.value && styles.typeLabelActive
                    ]}>
                      {item.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Giống loài</ThemedText>
                <TextInput
                  style={styles.input}
                  value={breed}
                  onChangeText={setBreed}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 12 }]}>
                  <ThemedText style={styles.label}>Cân nặng (kg)</ThemedText>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <ThemedText style={styles.label}>Tuổi</ThemedText>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={age}
                    onChangeText={setAge}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Ghi chú y tế / Thói quen</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  value={medicalNotes}
                  onChangeText={setMedicalNotes}
                />
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                <ThemedText style={styles.cancelButtonText}>Hủy bỏ</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.viewMode}>
              <View style={styles.imageHeader}>
                <Image source={{ uri: getPetImage(pet.image) }} style={styles.detailImage} />
              </View>

              <View style={styles.infoSection}>
                <ThemedText style={styles.sectionTitle}>Thông tin cơ bản</ThemedText>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Loại:</ThemedText>
                  <ThemedText style={styles.infoValue}>{pet.type === 'Dog' ? 'Chó' : pet.type === 'Cat' ? 'Mèo' : pet.type === 'Bird' ? 'Chim' : 'Khác'}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Giống:</ThemedText>
                  <ThemedText style={styles.infoValue}>{pet.breed || 'Chưa cập nhật'}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Cân nặng:</ThemedText>
                  <ThemedText style={styles.infoValue}>{pet.weight ? `${pet.weight} kg` : 'Chưa cập nhật'}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Tuổi:</ThemedText>
                  <ThemedText style={styles.infoValue}>{pet.age ? `${pet.age} tuổi` : 'Chưa cập nhật'}</ThemedText>
                </View>
              </View>

              <View style={styles.infoSection}>
                <ThemedText style={styles.sectionTitle}>Ghi chú y tế & Thói quen</ThemedText>
                <ThemedText style={styles.notesText}>
                  {pet.medicalNotes || 'Không có ghi chú nào.'}
                </ThemedText>
              </View>

              <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePet}>
                <Ionicons name="trash-outline" size={20} color="#FF4D4D" />
                <ThemedText style={styles.deleteButtonText}>Xóa hồ sơ thú cưng</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAction: {
    color: '#FF6F61',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
  form: {
    width: '100%',
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePicker: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,111,97,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FF6F61',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeItem: {
    width: '23%',
    height: 80,
    backgroundColor: 'rgba(255,111,97,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeItemActive: {
    backgroundColor: '#FF6F61',
    borderColor: '#FF6F61',
  },
  typeLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#FF6F61',
    fontWeight: '600',
  },
  typeLabelActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 16,
  },
  viewMode: {
    width: '100%',
  },
  infoSection: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FF6F61',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    opacity: 0.6,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF4D4D',
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#FF4D4D',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    color: '#FF6F61',
    fontWeight: 'bold',
  },
});
