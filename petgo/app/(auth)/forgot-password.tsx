import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';
import { showSuccess, showError } from '@/utils/alertHelper';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOTP = async () => {
    setError('');
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/users/forgot-password', { email });

      if (response.data.success) {
        showSuccess('Thành công', response.data.message);
        router.push({
          pathname: '/reset-password',
          params: { email }
        });
      } else {
        setError(response.data.message || 'Có lỗi xảy ra');
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
      <ThemedView style={styles.inner}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="title" style={styles.title}>QUÊN MẬT KHẨU</ThemedText>
          <ThemedText style={styles.subtitle}>Nhập email để nhận mã OTP khôi phục</ThemedText>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRequestOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Gửi mã OTP</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.footer}>
            <ThemedText style={styles.link}>Quay lại đăng nhập</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
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
    marginTop: 24,
    alignItems: 'center',
  },
  link: {
    color: '#FF6F61',
    fontWeight: 'bold',
  },
});
