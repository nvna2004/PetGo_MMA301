import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';


import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';
import { showSuccess, showError, showToast } from '@/utils/alertHelper';
import { CityPicker } from '@/components/city-picker';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [ward, setWard] = useState('');
  const [city, setCity] = useState('');
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const params = useLocalSearchParams();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (params?.selectedLat && params?.selectedLng) {
      setLatitude(params.selectedLat as string);
      setLongitude(params.selectedLng as string);
    }
  }, [params?.selectedLat, params?.selectedLng]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me');
      if (response.data.success) {
        const user = response.data.user;
        setName(user.name || '');
        setStreet(user.address?.street || '');
        setWard(user.address?.ward || '');
        setCity(user.address?.city || '');
        setUserRole(user.role || '');
        if (user.coordinates) {
          if (!params?.selectedLat) {
            setLatitude(user.coordinates.latitude?.toString() || '');
          }
          if (!params?.selectedLng) {
            setLongitude(user.coordinates.longitude?.toString() || '');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showError('Lỗi', 'Không thể tải thông tin cá nhân');
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = async () => {
    try {
      setGettingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('Lỗi cấp quyền', 'Vui lòng cấp quyền truy cập vị trí để lấy tọa độ tự động.');
        setGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
      
      showToast('Đã lấy vị trí hiện tại');
    } catch (error) {
      console.error('Error getting location:', error);
      showError('Lỗi', 'Không thể lấy vị trí hiện tại');
    } finally {
      setGettingLocation(false);
    }
  };


  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      showError('Lỗi', 'Họ và tên không được để trống');
      return;
    }

    setUpdating(true);
    try {
      const response = await api.put('/users/update-profile', {
        name,
        street,
        ward,
        city,
        latitude,
        longitude
      });

      if (response.data.success) {
        showSuccess('Thành công', 'Cập nhật hồ sơ thành công');
        router.navigate('/(tabs)/profile');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      showError('Lỗi', error.response?.data?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FF6F61" />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>Chỉnh sửa hồ sơ</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Họ và tên *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            </View>

            <ThemedText style={styles.sectionLabel}>Địa chỉ</ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Số nhà / Tên đường</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 123 Đường ABC"
                placeholderTextColor="#999"
                value={street}
                onChangeText={setStreet}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Thôn / Phường / Xã</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Thôn 1 / Phường 1 / Xã ABC"
                placeholderTextColor="#999"
                value={ward}
                onChangeText={setWard}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Tỉnh / Thành phố</ThemedText>
              <TouchableOpacity 
                style={styles.input} 
                onPress={() => setCityPickerVisible(true)}
              >
                <ThemedText style={[styles.inputText, !city && styles.placeholderText]}>
                  {city || 'Ví dụ: TP. Hồ Chí Minh'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <CityPicker
              visible={cityPickerVisible}
              onClose={() => setCityPickerVisible(false)}
              onSelect={setCity}
              currentValue={city}
            />

            {userRole === 'shop_owner' && (
              <>
                <ThemedText style={styles.sectionLabel}>Vị trí Shop trên bản đồ</ThemedText>
                <ThemedText style={styles.helperText}>
                  Cập nhật tọa độ chính xác để khách hàng có thể tìm đường đến shop của bạn.
                </ThemedText>

                <View style={styles.locationContainer}>
                  <View style={styles.locationInputsRow}>
                    <View style={[styles.coordInputBox]}>
                      <ThemedText style={styles.coordLabel}>Lat:</ThemedText>
                      <TextInput
                        style={styles.coordInput}
                        value={latitude}
                        placeholder="Trống"
                        editable={false}
                      />
                    </View>
                    <View style={[styles.coordInputBox, { marginLeft: 12 }]}>
                      <ThemedText style={styles.coordLabel}>Long:</ThemedText>
                      <TextInput
                        style={styles.coordInput}
                        value={longitude}
                        placeholder="Trống"
                        editable={false}
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity 
                      style={[styles.locationButton, { flex: 1, backgroundColor: '#4A90E2' }]}
                      onPress={() => {
                        router.push({
                          pathname: '/user/map-picker',
                          params: { 
                            initialLat: latitude, 
                            initialLng: longitude,
                            returnTo: '/user/edit-profile'
                          }
                        } as any);
                      }}
                    >
                      <Ionicons name="map" size={18} color="#fff" />
                      <ThemedText style={styles.locationButtonText}>Chọn trên bản đồ</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.locationButton, { flex: 1 }]}
                      onPress={handleGetLocation}
                      disabled={gettingLocation}
                    >
                      {gettingLocation ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="navigate" size={18} color="#fff" />
                          <ThemedText style={styles.locationButtonText}>Vị trí tại chỗ</ThemedText>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.saveButton, updating && styles.buttonDisabled]}
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.saveButtonText}>Lưu thay đổi</ThemedText>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6F61',
    marginTop: 8,
    marginBottom: 16,
  },
  input: {
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputText: {
    fontSize: 16,
    lineHeight: 56,
  },
  placeholderText: {
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#FF6F61',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
  helperText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  locationContainer: {
    backgroundColor: 'rgba(255, 111, 97, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.2)',
    marginBottom: 16,
  },
  locationInputsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  coordInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  coordLabel: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
    fontWeight: 'bold',
  },
  coordInput: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
  locationButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6F61',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

