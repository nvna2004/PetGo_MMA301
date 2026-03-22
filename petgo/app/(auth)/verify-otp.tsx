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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';
import { showSuccess, showError } from '@/utils/alertHelper';

export default function VerifyOTPScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setError('');
    if (!otp || otp.length < 6) {
      setError('Vui lòng nhập mã OTP gồm 6 chữ số');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/users/verify-otp', {
        email,
        otp,
      });

      if (response.data.success) {
        showSuccess('Thành công', 'Tài khoản của bạn đã được kích hoạt. Hãy đăng nhập ngay!');
        router.replace('/(auth)/login');
      } else {
        setError(response.data.message || 'Xác thực không thành công');
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
          <ThemedText type="title" style={styles.title}>XÁC THỰC OTP</ThemedText>
          <ThemedText style={styles.subtitle}>
            Nhập mã 6 số đã được gửi tới {'\n'}
            <ThemedText style={styles.boldText}>{email}</ThemedText>
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText style={styles.inputLabel}>Mã OTP</ThemedText>
          <TextInput
            style={[styles.input, { letterSpacing: 8 }]}
            placeholder=" Nhập mã 6 số"
            placeholderTextColor="#999"
            value={otp}
            onChangeText={(text) => { setOtp(text); setError(''); }}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />

          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Xác nhận</ThemedText>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.back()}>
              <ThemedText style={styles.link}>Quay lại</ThemedText>
            </TouchableOpacity>
          </View>
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
  title: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#FF6F61',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  boldText: {
    fontWeight: 'bold',
    opacity: 1,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    height: 64,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    fontSize: 24,
    fontWeight: 'bold',
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
  },
  link: {
    color: '#FF6F61',
    fontWeight: 'bold',
  },
});
