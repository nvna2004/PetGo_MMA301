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
  KeyboardTypeOptions,
  Alert
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';
import { showError, showSuccess } from '@/utils/alertHelper';

export default function ShopRegistrationScreen() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);

  const [formData, setFormData] = useState({
    shopName: '',
    address: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
  });

  const params = useLocalSearchParams();

  useEffect(() => {
    if (params?.selectedLat && params?.selectedLng) {
      setFormData(prev => ({
        ...prev,
        latitude: params.selectedLat as string,
        longitude: params.selectedLng as string
      }));
    }
  }, [params?.selectedLat, params?.selectedLng]);

  useEffect(() => {
    checkExistingRequest();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('users/me');
      if (response.data.success) {
        const user = response.data.user;
        const addressStr = user.address 
          ? [user.address.street, user.address.ward, user.address.city].filter(Boolean).join(', ')
          : '';
          
        setFormData(prev => ({
          ...prev,
          shopName: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
          address: addressStr,
          latitude: params?.selectedLat ? (params.selectedLat as string) : (prev.latitude || ''),
          longitude: params?.selectedLng ? (params.selectedLng as string) : (prev.longitude || ''),
        }));
      }
    } catch (error) {
      console.error('Fetch user profile error:', error);
    }
  };

  const checkExistingRequest = async () => {
    try {
      setChecking(true);
      const response = await api.get('users/shop-request/me');
      if (response.data.success && response.data.data.length > 0) {

        const pendingRequest = response.data.data.find((r: any) => r.status === 'pending');
        setExistingRequest(pendingRequest || response.data.data[0]);
      }
    } catch (error) {
      console.error('Check existing request error:', error);
    } finally {
      setChecking(false);
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

      try {
        const location = await Location.getCurrentPositionAsync({});
        setFormData(prev => ({
          ...prev,
          latitude: location.coords.latitude.toString(),
          longitude: location.coords.longitude.toString()
        }));
      } catch (locErr) {
        Alert.alert('Không thể lấy vị trí', 'Vui lòng kiểm tra xem Dịch vụ vị trí (GPS) đã được bật chưa.');
        setGettingLocation(false); // Ensure loading state is reset even if only location fails
        return; // Exit if location cannot be fetched
      }
      
      showSuccess('Thành công', 'Đã lấy vị trí hiện tại của bạn.');
    } catch (error) {
      console.error('Error getting location:', error);
      showError('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng bật GPS và thử lại.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.shopName || !formData.address || !formData.phone || !formData.email || !formData.latitude || !formData.longitude) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
      };

      const response = await api.post('users/shop-request', payload);
      if (response.data.success) {
        showSuccess('Thành công', 'Yêu cầu của bạn đã được gửi. Vui lòng chờ duyệt.');
        router.replace('/(tabs)/profile' as any);
      }
    } catch (error: any) {
      console.error('Submit shop request error:', error);
      showError('Lỗi', error.response?.data?.message || 'Không thể gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
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
        <ThemedText type="title" style={styles.title}>Đăng ký mở Shop</ThemedText>
      </View>

      {existingRequest ? (
        <View style={styles.statusContainer}>
          <Ionicons 
            name={
              existingRequest.status === 'approved' ? 'checkmark-circle' : 
              existingRequest.status === 'rejected' ? 'close-circle' : 'time'
            } 
            size={64} 
            color={
              existingRequest.status === 'approved' ? '#4CAF50' : 
              existingRequest.status === 'rejected' ? '#F44336' : '#FF9800'
            } 
          />
          <ThemedText style={styles.statusTitle}>
            Yêu cầu đang ở trạng thái: {
              existingRequest.status === 'approved' ? 'Đã duyệt' : 
              existingRequest.status === 'rejected' ? 'Bị từ chối' : 'Đang chờ duyệt'
            }
          </ThemedText>
          
          <View style={styles.statusCard}>
            <ThemedText style={styles.statusLabel}>Tên Shop: <ThemedText style={{fontWeight: 'bold'}}>{existingRequest.shopName}</ThemedText></ThemedText>
            <ThemedText style={styles.statusLabel}>Ngày gửi: {new Date(existingRequest.createdAt).toLocaleDateString()}</ThemedText>
            {existingRequest.adminMessage ? (
              <View style={styles.messageBox}>
                <ThemedText style={styles.messageLabel}>Lời nhắn từ quản trị viên:</ThemedText>
                <ThemedText style={styles.messageText}>{existingRequest.adminMessage}</ThemedText>
              </View>
            ) : null}
          </View>

          {existingRequest.status === 'rejected' && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setExistingRequest(null)} 
            >
              <ThemedText style={styles.retryButtonText}>Gửi yêu cầu mới</ThemedText>
            </TouchableOpacity>
          )}

          {existingRequest.status === 'approved' && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => router.replace('/(tabs)/profile' as any)} 
            >
              <ThemedText style={styles.retryButtonText}>Trở về trang cá nhân</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.formContainer}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <ThemedText style={styles.introText}>
              Trở thành đối tác của PetGo để cung cấp dịch vụ chăm sóc thú cưng chất lượng. Vui lòng điền thông tin bên dưới để gửi yêu cầu.
            </ThemedText>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Tên Shop <ThemedText style={styles.asterisk}>*</ThemedText></ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons name="storefront-outline" size={20} color="#777" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên shop..."
                  value={formData.shopName}
                  onChangeText={(text) => setFormData({...formData, shopName: text})}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Địa chỉ <ThemedText style={styles.asterisk}>*</ThemedText></ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#777" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Số nhà, tên đường..."
                  value={formData.address}
                  onChangeText={(text) => setFormData({...formData, address: text})}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Số điện thoại <ThemedText style={styles.asterisk}>*</ThemedText></ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#777" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="SĐT liên hệ shop..."
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Email Shop <ThemedText style={styles.asterisk}>*</ThemedText></ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#777" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email liên hệ..."
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Tọa độ cửa hàng <ThemedText style={styles.asterisk}>*</ThemedText></ThemedText>
              <ThemedText style={styles.locationDescText}>
                Tọa độ này sẽ giúp khách hàng tìm thấy cửa hàng của bạn trên bản đồ. Vui lòng đứng tại vị trí cửa hàng và nhấn nút bên dưới.
              </ThemedText>
              
              <View style={styles.locationContainer}>
                <View style={styles.locationInputsRow}>
                  <View style={[styles.inputContainer, styles.coordInputBox]}>
                    <ThemedText style={styles.coordLabel}>Lat:</ThemedText>
                    <TextInput
                      style={styles.coordInput}
                      value={formData.latitude}
                      placeholder="Trống"
                      editable={false}
                    />
                  </View>
                  <View style={[styles.inputContainer, styles.coordInputBox, { marginLeft: 12 }]}>
                    <ThemedText style={styles.coordLabel}>Long:</ThemedText>
                    <TextInput
                      style={styles.coordInput}
                      value={formData.longitude}
                      placeholder="Trống"
                      editable={false}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.locationButton}
                  onPress={handleGetLocation}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="location" size={18} color="#fff" />
                      <ThemedText style={styles.locationButtonText}>Lấy vị trí hiện tại</ThemedText>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.locationButton, { marginTop: 12, backgroundColor: '#4A90E2' }]}
                  onPress={() => {
                    router.push({
                      pathname: '/user/map-picker',
                      params: { 
                        initialLat: formData.latitude, 
                        initialLng: formData.longitude,
                        returnTo: '/user/shop-registration'
                      }
                    } as any);
                  }}
                >
                  <Ionicons name="map" size={18} color="#fff" />
                  <ThemedText style={styles.locationButtonText}>Chọn trên bản đồ</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.disabledButton]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Gửi yêu cầu</ThemedText>
              )}
            </TouchableOpacity>
            
          </ScrollView>
        </KeyboardAvoidingView>
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
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 30,
    marginTop: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 111, 97, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.2)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  statusLabel: {
    fontSize: 15,
    marginBottom: 8,
    color: '#333',
  },
  messageBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  messageLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#444',
  },
  retryButton: {
    backgroundColor: '#FF6F61',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  asterisk: {
    color: '#FF4D4D',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 15,
    color: '#333',
  },
  compactInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaeaea',
    paddingHorizontal: 16,
  },
  locationDescText: {
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
  },
  locationInputsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  coordInputBox: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
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
    backgroundColor: '#4A90E2',
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
  submitButton: {
    backgroundColor: '#FF6F61',
    borderRadius: 15,
    paddingVertical: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
});
