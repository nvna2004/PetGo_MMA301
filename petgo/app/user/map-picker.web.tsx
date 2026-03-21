import React from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';

const { width, height } = Dimensions.get('window');

// Explicitly for the Web platform to avoid loading `react-native-maps` entirely
export default function MapPickerScreenWeb() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Chọn vị trí cửa hàng</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.webFallback}>
          <Ionicons name="map-outline" size={64} color="#ccc" />
          <ThemedText style={{ textAlign: 'center', marginTop: 16 }}>
            Tính năng chọn bản đồ hiện chưa hỗ trợ trên trình duyệt Web. Để chọn toạ độ chính xác, vui lòng mở ứng dụng bằng điện thoại.
          </ThemedText>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.disabledBtn} disabled>
          <ThemedText style={styles.confirmText}>Không thể chọn trên Web</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 4 },
  mapContainer: { flex: 1, position: 'relative' },
  webFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f9f9f9' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  disabledBtn: { backgroundColor: '#ccc', paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
