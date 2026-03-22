import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';
import { showSuccess, showError } from '@/utils/alertHelper';
import { CityPicker } from '@/components/city-picker';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [ward, setWard] = useState('');
  const [city, setCity] = useState('');
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password || !phone) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }


    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Mật khẩu phải từ 8 kí tự, có cả chữ hoa và chữ thường');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/users/register', {
        name,
        email,
        password,
        phone,
        street,
        ward,
        city
      });

      if (response.data.success) {
        showSuccess('Thành công', 'Vui lòng kiểm tra email để nhận mã OTP xác thực');

        router.push({
          pathname: '/(auth)/verify-otp',
          params: { email }
        });
      } else {
        setError(response.data.message || 'Đăng ký không thành công');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.inner}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>TẠO TÀI KHOẢN</ThemedText>
            <ThemedText style={styles.subtitle}>Tham gia cộng đồng PetGo ngay!</ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText style={styles.inputLabel}>Họ và tên *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#999"
              value={name}
              onChangeText={(text) => { setName(text); setError(''); }}
            />
            
            <ThemedText style={styles.inputLabel}>Email *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="example@gmail.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <ThemedText style={styles.inputLabel}>Số điện thoại *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="09xxx..."
              placeholderTextColor="#999"
              value={phone}
              onChangeText={(text) => { setPhone(text); setError(''); }}
              keyboardType="phone-pad"
            />
            
            <ThemedText style={styles.inputLabel}>Mật khẩu *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Ít nhất 8 ký tự, có chữ hoa/thường"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => { setPassword(text); setError(''); }}
              secureTextEntry
            />
            
            <ThemedText style={styles.inputLabel}>Nhập lại mật khẩu *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Xác nhận lại mật khẩu"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setError(''); }}
              secureTextEntry
            />

            <ThemedText style={styles.sectionLabel}>Địa chỉ (Không bắt buộc)</ThemedText>
            
            <ThemedText style={styles.inputLabel}>Số nhà / Tên đường</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 123 Đường ABC"
              placeholderTextColor="#999"
              value={street}
              onChangeText={setStreet}
            />
            
            <ThemedText style={styles.inputLabel}>Thôn / Phường / Xã</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Thôn 1 / Phường 1 / Xã ABC"
              placeholderTextColor="#999"
              value={ward}
              onChangeText={setWard}
            />
            
            <ThemedText style={styles.inputLabel}>Tỉnh / Thành phố</ThemedText>
            <TouchableOpacity 
              style={styles.input} 
              onPress={() => setCityPickerVisible(true)}
            >
              <ThemedText style={[styles.inputText, !city && styles.placeholderText]}>
                {city || 'Ví dụ: TP. Hồ Chí Minh'}
              </ThemedText>
            </TouchableOpacity>

            <CityPicker
              visible={cityPickerVisible}
              onClose={() => setCityPickerVisible(false)}
              onSelect={(cityName) => {
                setCity(cityName);
                setError('');
              }}
              currentValue={city}
            />

            {error ? (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Đăng ký</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText>Đã có tài khoản? </ThemedText>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <ThemedText style={styles.link}>Đăng nhập</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    color: '#FF6F61',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  inputText: {
    fontSize: 16,
    lineHeight: 56,
  },
  placeholderText: {
    color: '#999',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.6,
    marginBottom: 8,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.8,
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#FF6F61',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  link: {
    color: '#FF6F61',
    fontWeight: 'bold',
  },
});
