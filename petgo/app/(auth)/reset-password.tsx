import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';
import { showSuccess, showError } from '@/utils/alertHelper';

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    setError('');
    if (!otp || !newPassword || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }


    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Mật khẩu phải từ 8 kí tự, có cả chữ hoa và chữ thường');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/users/reset-password', {
        email,
        otp,
        newPassword
      });

      if (response.data.success) {
        showSuccess('Thành công', 'Mật khẩu đã được đổi thành công. Hãy đăng nhập lại.');
        router.replace('/(auth)/login');
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.inner}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>ĐẶT LẠI MẬT KHẨU</ThemedText>
            <ThemedText style={styles.subtitle}>
              Nhập mã OTP đã gửi tới {'\n'}
              <ThemedText style={styles.boldText}>{email}</ThemedText>
            </ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText style={styles.inputLabel}>Mã OTP</ThemedText>
            <TextInput
              style={[styles.input, { letterSpacing: 8, fontSize: 24, textAlign: 'center' }]}
              placeholder="------"
              placeholderTextColor="#999"
              value={otp}
              onChangeText={(text) => { setOtp(text); setError(''); }}
              keyboardType="number-pad"
              maxLength={6}
            />

            <ThemedText style={styles.inputLabel}>Mật khẩu mới</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu mới"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={(text) => { setNewPassword(text); setError(''); }}
              secureTextEntry
            />

            <ThemedText style={styles.inputLabel}>Xác nhận mật khẩu mới</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setError(''); }}
              secureTextEntry
            />

            {error ? (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Đổi mật khẩu</ThemedText>
              )}
            </TouchableOpacity>
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
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
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
});
