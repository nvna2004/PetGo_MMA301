import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { showError } from '@/utils/alertHelper';

const { width, height } = Dimensions.get('window');

export default function MapPickerScreen() {
  const { initialLat, initialLng, returnTo } = useLocalSearchParams();
  
  const [region, setRegion] = useState({
    latitude: 10.762622,
    longitude: 106.660172,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markerCoordinate, setMarkerCoordinate] = useState<{latitude: number, longitude: number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupInitialLocation();
  }, []);

  const setupInitialLocation = async () => {
    try {
      if (initialLat && initialLng) {
        const lat = parseFloat(initialLat as string);
        const lng = parseFloat(initialLng as string);
        setRegion({
          ...region,
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setMarkerCoordinate({ latitude: lat, longitude: lng });
        setLoading(false);
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
          setMarkerCoordinate({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } catch (locErr) {
          Alert.alert('Không thể lấy vị trí', 'Vui lòng kiểm tra lại thiết lập GPS.');
        }
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);
    }
  };

  const handleMapPress = (e: any) => {
    setMarkerCoordinate(e.nativeEvent.coordinate);
  };

  const handleConfirm = () => {
    if (!markerCoordinate) {
      showError('Thông báo', 'Vui lòng chọn một điểm trên bản đồ');
      return;
    }

    const returnPath = (returnTo as string) || '/user/edit-profile';

    router.navigate({
      pathname: returnPath as any,
      params: {
        selectedLat: markerCoordinate.latitude.toString(),
        selectedLng: markerCoordinate.longitude.toString()
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <ThemedText style={{ marginTop: 10 }}>Đang tải bản đồ...</ThemedText>
      </SafeAreaView>
    );
  }

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
        <MapView
          style={styles.map}
          initialRegion={region}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {markerCoordinate && (
            <Marker
              coordinate={markerCoordinate}
              draggable
              onDragEnd={(e) => setMarkerCoordinate(e.nativeEvent.coordinate)}
              title="Vị trí cửa hàng của bạn"
              description="Kéo thả để điều chỉnh chính xác"
            >
              <Ionicons name="location" size={40} color="#FF6F61" />
            </Marker>
          )}
        </MapView>
        
        <View style={styles.instructionOverlay}>
          <ThemedText style={styles.instructionText}>
            Chạm vào bản đồ hoặc kéo thả biểu tượng để chọn vị trí chính xác
          </ThemedText>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.confirmBtn, !markerCoordinate && styles.disabledBtn]} 
          onPress={handleConfirm}
          disabled={!markerCoordinate}
        >
          <ThemedText style={styles.confirmText}>Xác nhận vị trí này</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backBtn: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: width,
    height: '100%',
  },
  instructionOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9f9f9',
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  confirmBtn: {
    backgroundColor: '#FF6F61',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
