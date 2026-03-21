import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';
import { showSuccess, showError } from '@/utils/alertHelper';

import * as ImagePicker from 'expo-image-picker';

const PET_TYPES = [
  { label: 'Chó', value: 'Dog', icon: 'paw' },
  { label: 'Mèo', value: 'Cat', icon: 'logo-github' },
  { label: 'Chim', value: 'Bird', icon: 'airplane' },
  { label: 'Khác', value: 'Other', icon: 'help-circle' },
];

export default function AddPetScreen() {
  const [name, setName] = useState('');
  const [type, setType] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleAddPet = async () => {
    if (!name || !type) {
      showError('Lỗi', 'Vui lòng nhập tên và loại thú cưng');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('type', type);
      formData.append('breed', breed);
      if (weight) formData.append('weight', weight);
      if (age) formData.append('age', age);
      formData.append('medicalNotes', medicalNotes);

      if (image) {
        if (Platform.OS === 'web') {
          const response = await fetch(image);
          const blob = await response.blob();
          formData.append('image', blob, `pet-${Date.now()}.jpg`);
        } else {
          const uriParts = image.split('.');
          const fileType = uriParts[uriParts.length - 1];
          formData.append('image', {
            uri: image,
            name: `pet-${Date.now()}.${fileType}`,
            type: `image/${fileType}`,
          } as any);
        }
      }

      const response = await api.post('pets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        showSuccess('Thành công', 'Đã thêm thú cưng mới');
        router.back();
      }
    } catch (error: any) {
      console.error('Add pet error:', error);
      showError('Lỗi', error.response?.data?.message || 'Không thể thêm thú cưng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Thêm thú cưng', headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FF6F61" />
        </TouchableOpacity>
      )}} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FF6F61" />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>Thêm thú cưng</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.imagePickerContainer}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={40} color="#FF6F61" />
                    <ThemedText style={styles.imagePlaceholderText}>Thêm ảnh</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Tên thú cưng *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên thú cưng"
                placeholderTextColor="#999"
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
                placeholder="Ví dụ: Poodle, Golden, Mèo Anh..."
                placeholderTextColor="#999"
                value={breed}
                onChangeText={setBreed}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 12 }]}>
                <ThemedText style={styles.label}>Cân nặng (kg)</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 5.5"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <ThemedText style={styles.label}>Tuổi</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 2"
                  placeholderTextColor="#999"
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
                placeholder="Nhập ghi chú (nếu có)"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={medicalNotes}
                onChangeText={setMedicalNotes}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleAddPet}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.saveButtonText}>Thêm thú cưng</ThemedText>
              )}
            </TouchableOpacity>
          </View>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    color: '#FF6F61',
  },
  form: {
    width: '100%',
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,111,97,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF6F61',
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#FF6F61',
    marginTop: 4,
    fontWeight: '600',
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
  saveButton: {
    backgroundColor: '#FF6F61',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
