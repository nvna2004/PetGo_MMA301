import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleUpdatePassword = async () => {
    setSuccessMessage('');
    setErrorMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu mới không khớp');
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await api.put('/users/update-password', {
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message || 'Mật khẩu đã được thay đổi thành công');
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Optional: still show alert but user specifically asked for on-screen message
        // Alert.alert('Thành công', response.data.message || 'Mật khẩu đã được cập nhật');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Không thể đổi mật khẩu';
      setErrorMessage(message);
    } finally {
      setUpdatingPassword(false);
    }
  };

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
            <ThemedText type="title" style={styles.title}>Đổi mật khẩu</ThemedText>
          </View>

          <View style={styles.form}>
            {successMessage ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <ThemedText style={styles.successText}>{successMessage}</ThemedText>
              </View>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF4D4D" />
                <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
              </View>
            ) : null}

            <ThemedText style={styles.label}>Mật khẩu hiện tại</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu hiện tại"
              placeholderTextColor="#999"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <ThemedText style={styles.label}>Mật khẩu mới</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu mới"
              placeholderTextColor="#999"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <ThemedText style={styles.label}>Xác nhận mật khẩu mới</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor="#999"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={[styles.actionButton, updatingPassword && styles.buttonDisabled]}
              onPress={handleUpdatePassword}
              disabled={updatingPassword}
            >
              {updatingPassword ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.actionButtonText}>Cập nhật mật khẩu</ThemedText>
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
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 20,
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: '#FF6F61',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  successText: {
    color: '#4CAF50',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF4D4D',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});
