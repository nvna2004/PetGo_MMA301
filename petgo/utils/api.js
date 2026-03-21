import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

// Tự động chọn URL: 127.0.0.1 cho Web, 10.0.2.2 cho Android Emulator
export const BASE_URL = Platform.OS === 'web' 
  ? 'http://127.0.0.1:9999' 
  : 'http://10.0.2.2:9999';

const API_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper lấy token đa nền tảng
export const getStoredToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('userToken');
    }
    return await SecureStore.getItemAsync('userToken');
  } catch (error) {
    return null;
  }
};

// Helper lưu token đa nền tảng
export const setStoredToken = async (token) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('userToken', token);
    } else {
      await SecureStore.setItemAsync('userToken', token);
    }
    return true;
  } catch (error) {
    return false;
  }
};

// Helper xóa token đa nền tảng
export const removeStoredToken = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem('userToken');
    } else {
      await SecureStore.deleteItemAsync('userToken');
    }
    return true;
  } catch (error) {
    return false;
  }
};

// Thêm token vào header mỗi khi gửi request
api.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
