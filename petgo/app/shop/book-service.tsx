import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import * as WebBrowser from 'expo-web-browser';
import api from '@/utils/api';

const TIME_SLOTS = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00'];
const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tiền mặt tại cửa hàng' },
  { id: 'vnpay', label: 'Thanh toán VNPay (thẻ/QR)' },
];

export default function BookServiceScreen() {
  const { serviceId, shopId, serviceName, price } = useLocalSearchParams<{
    serviceId: string;
    shopId: string;
    serviceName: string;
    price: string;
  }>();

  const [pets, setPets] = useState<any[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);

  const [selectedPet, setSelectedPet] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [notes, setNotes] = useState('');
  
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetchMyPets();
  }, []);

  const fetchMyPets = async () => {
    try {
      setLoadingPets(true);
      const res = await api.get('/pets');
      if (res.data.success) {
        setPets(res.data.pets);
      }
    } catch (e) {
      console.error('Lỗi lấy danh sách thú cưng:', e);
    } finally {
      setLoadingPets(false);
    }
  };

  const handleBook = async () => {
    if (!selectedPet) {
      return Alert.alert('Lỗi', 'Vui lòng chọn thú cưng để phục vụ');
    }
    if (!selectedTimeSlot) {
      return Alert.alert('Lỗi', 'Vui lòng chọn khung giờ');
    }

    if (selectedDate.toDateString() === new Date().toDateString()) {
      const slotHour = parseInt(selectedTimeSlot.split(':')[0]);
      if (slotHour <= new Date().getHours()) {
        return Alert.alert('Lỗi', 'Không thể chọn khung giờ đã trôi qua trong ngày hôm nay.');
      }
    }

    try {
      setIsBooking(true);
      const res = await api.post('/bookings', {
        service: serviceId,
        shopOwner: shopId,
        pet: selectedPet,
        bookingDate: selectedDate,
        timeSlot: selectedTimeSlot,
        paymentMethod,
        notes,
      });

      if (res.data.success) {
        const bookingId = res.data.data._id;
        
        if (paymentMethod === 'vnpay') {
          const payRes = await api.post('/v1/payments/create-payment-url', { bookingId });
          if (payRes.data.success) {
            await WebBrowser.openBrowserAsync(payRes.data.paymentUrl);
            router.replace('/(tabs)/booking');
          } else {
             Alert.alert('Lỗi', 'Không thể tạo mã thanh toán VNPay');
          }
        } else {
          Alert.alert('Thành công', 'Đặt lịch thành công!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
      }
    } catch (error: any) {
      console.error('Lỗi đặt lịch:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch');
    } finally {
      setIsBooking(false);
    }
  };


  const upcomingDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Đặt Lịch Dịch Vụ</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        

        <ThemedView style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="paw" size={24} color="#FF6F61" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.summaryName}>{decodeURIComponent(serviceName || '')}</ThemedText>
            <ThemedText style={styles.summaryPrice}>
              {Number(price || 0).toLocaleString('vi-VN')} đ
            </ThemedText>
          </View>
        </ThemedView>


        <ThemedText style={styles.sectionTitle}>1. Chọn thú cưng</ThemedText>
        {loadingPets ? (
          <ActivityIndicator size="small" color="#FF6F61" />
        ) : pets.length === 0 ? (
          <View style={styles.emptyPets}>
            <ThemedText style={{ color: '#888', marginBottom: 8 }}>Bạn chưa có thú cưng nào.</ThemedText>
            <TouchableOpacity onPress={() => router.push('/pets')} style={styles.addPetBtn}>
              <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Thêm thú cưng ngay</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet._id}
                style={[
                  styles.petCard,
                  selectedPet === pet._id && styles.petCardActive
                ]}
                onPress={() => setSelectedPet(pet._id)}
              >
                <View style={[styles.petIcon, selectedPet === pet._id && { backgroundColor: '#FF6F61' }]}>
                  <Ionicons 
                    name={pet.type === 'cat' ? 'logo-octocat' : 'logo-gitlab'} 
                    size={24} 
                    color={selectedPet === pet._id ? '#fff' : '#666'} 
                  />
                </View>
                <ThemedText style={[styles.petName, selectedPet === pet._id && { color: '#FF6F61' }]}>
                  {pet.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}


        <ThemedText style={styles.sectionTitle}>2. Chọn ngày</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
          {upcomingDays.map((date, idx) => {
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const dayName = idx === 0 ? 'Hôm nay' : idx === 1 ? 'Ngày mai' : `Th ${date.getDay() === 0 ? 'CN' : date.getDay() + 1}`;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardActive
                ]}
                onPress={() => {
                  setSelectedDate(date);
                  setSelectedTimeSlot('');
                }}
              >
                <ThemedText style={[styles.dateDayName, isSelected && { color: '#fff' }]}>{dayName}</ThemedText>
                <ThemedText style={[styles.dateDayNum, isSelected && { color: '#fff' }]}>{date.getDate()}/{date.getMonth() + 1}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>


        <ThemedText style={styles.sectionTitle}>3. Chọn giờ</ThemedText>
        <View style={styles.timeGrid}>
          {TIME_SLOTS.filter(slot => {
            const isToday = selectedDate.toDateString() === new Date().toDateString();
            if (!isToday) return true;
            
            const now = new Date();
            const slotHour = parseInt(slot.split(':')[0]);
            return slotHour > now.getHours();
          }).map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[
                styles.timeCard,
                selectedTimeSlot === slot && styles.timeCardActive
              ]}
              onPress={() => setSelectedTimeSlot(slot)}
            >
              <ThemedText style={[styles.timeText, selectedTimeSlot === slot && { color: '#FF6F61', fontWeight: 'bold' }]}>
                {slot}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        {(selectedDate.toDateString() === new Date().toDateString() && 
          TIME_SLOTS.filter(s => parseInt(s.split(':')[0]) > new Date().getHours()).length === 0) && (
          <ThemedText style={{ color: '#FF3B30', fontSize: 13, marginTop: 8 }}>
            Hôm nay đã hết khung giờ đặt lịch. Vui lòng chọn ngày mai.
          </ThemedText>
        )}


        <ThemedText style={styles.sectionTitle}>4. Phương thức thanh toán</ThemedText>
        <View style={styles.paymentContainer}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentRow, 
                paymentMethod === method.id && styles.paymentRowActive
              ]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <Ionicons 
                name={method.id === 'vnpay' ? 'card-outline' : 'cash-outline'} 
                size={24} 
                color={paymentMethod === method.id ? '#FF6F61' : '#666'} 
              />
              <ThemedText style={styles.paymentText}>{method.label}</ThemedText>
              {paymentMethod === method.id && (
                <Ionicons name="checkmark-circle" size={20} color="#FF6F61" style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}
        </View>


        <ThemedText style={styles.sectionTitle}>5. Ghi chú (không bắt buộc)</ThemedText>
        <TextInput
          style={styles.notesInput}
          placeholder="Ví dụ: Bé nhà mình tính hơi nhát, nhờ shop nhẹ tay"
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
          textAlignVertical="top"
        />

        <View style={{ height: 100 }} />
      </ScrollView>


      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontSize: 13, color: '#888' }}>Tổng thanh toán</ThemedText>
          <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: '#FF6F61' }}>
            {Number(price || 0).toLocaleString('vi-VN')} đ
          </ThemedText>
        </View>
        <TouchableOpacity 
          style={styles.confirmBtn} 
          onPress={handleBook}
          disabled={isBooking}
        >
          {isBooking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.confirmBtnText}>Xác nhận đặt lịch</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    color: '#333',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE8E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryName: { fontSize: 18, fontWeight: 'bold' },
  summaryPrice: { fontSize: 16, color: '#FF6F61', fontWeight: 'bold', marginTop: 4 },
  hScroll: { paddingVertical: 4 },
  emptyPets: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addPetBtn: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  petCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  petCardActive: {
    borderColor: '#FF6F61',
    backgroundColor: '#FFF5F4',
  },
  petIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  petName: { fontSize: 13, fontWeight: '500' },
  dateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    minWidth: 70,
  },
  dateCardActive: {
    backgroundColor: '#FF6F61',
  },
  dateDayName: { fontSize: 13, color: '#666', marginBottom: 4 },
  dateDayNum: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeCard: {
    width: '30%',
    backgroundColor: '#F9F9F9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  timeCardActive: {
    backgroundColor: '#FFF5F4',
    borderColor: '#FF6F61',
  },
  timeText: { fontSize: 13, color: '#444' },
  paymentContainer: { gap: 12 },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  paymentRowActive: {
    borderColor: '#FF6F61',
    backgroundColor: '#FFF5F4',
  },
  paymentText: { fontSize: 15, marginLeft: 12, fontWeight: '500' },
  notesInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 16,
    fontSize: 15,
    minHeight: 80,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  confirmBtn: {
    backgroundColor: '#FF6F61',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
