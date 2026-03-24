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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api, { setStoredToken } from '@/utils/api';
import { showSuccess, showError } from '@/utils/alertHelper';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showActivationLink, setShowActivationLink] = useState(false);

  const handleLogin = async () => {
    setError('');
    setShowActivationLink(false);

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/users/login', {
        email,
        password,
      });

      if (response.data.success) {
        await setStoredToken(response.data.token);
        router.replace('/(tabs)');
      } else {
        setError(response.data.message || 'Đăng nhập không thành công');
        if (response.data.needsActivation) {
          setShowActivationLink(true);
        }
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau';
      setError(message);
      if (err.response?.data?.needsActivation) {
        setShowActivationLink(true);
      }
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
            source={require('@/assets/images/logo-petgo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="title" style={styles.title}>CHÀO MỪNG ĐẾN PETGO</ThemedText>
          <ThemedText style={styles.subtitle}>Đăng nhập để tiếp tục</ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText style={styles.inputLabel}>Email</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Nhập email của bạn"
            placeholderTextColor="#999"
            value={email}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <ThemedText style={styles.inputLabel}>Mật khẩu</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#999"
            value={password}
            onChangeText={(text) => { setPassword(text); setError(''); }}
            secureTextEntry
          />

          {error ? (
            <View>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
              {showActivationLink && (
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/verify-otp',
                    params: { email }
                  })}
                  style={{ marginBottom: 16, alignItems: 'center' }}
                >
                  <ThemedText style={[styles.link, { textDecorationLine: 'underline' }]}>
                    Xác thực ngay bây giờ
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
            style={styles.forgotPassword}
          >
            <ThemedText style={styles.link}>Quên mật khẩu?</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Đăng nhập</ThemedText>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <ThemedText>Chưa có tài khoản? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <ThemedText style={styles.link}>Đăng ký ngay</ThemedText>
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
  logo: {
    width: 250,
    height: 140,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF6F61',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
