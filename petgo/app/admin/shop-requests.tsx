import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/utils/api';
import { showError, showSuccess, showConfirm } from '@/utils/alertHelper';

export default function AdminShopRequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected'>('approved');

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [])
  );

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('admin/shop-requests');
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching shop requests:', error);
      showError('Lỗi', 'Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (request: any, action: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminMessage('');
    setModalVisible(true);
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest) return;
    
    if (actionType === 'rejected' && !adminMessage.trim()) {
      showError('Lỗi', 'Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setProcessing(true);
      const response = await api.put(`admin/shop-requests/${selectedRequest._id}`, {
        status: actionType,
        adminMessage: adminMessage.trim(),
      });

      if (response.data.success) {
        showSuccess('Thành công', `Đã ${actionType === 'approved' ? 'duyệt' : 'từ chối'} yêu cầu`);
        setModalVisible(false);
        fetchRequests(); // Reload data
      }
    } catch (error: any) {
      console.error('Process request error:', error);
      showError('Lỗi', error.response?.data?.message || 'Không thể xử lý yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <ThemedText style={styles.shopName}>{item.shopName}</ThemedText>
          <ThemedText style={styles.userName}>Người yêu cầu: {item.user?.name || 'N/A'}</ThemedText>
          <ThemedText style={styles.dateText}>
            Ngày gửi: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </ThemedText>
        </View>
        <View style={[
          styles.statusBadge, 
          item.status === 'approved' ? styles.statusApproved : 
          item.status === 'rejected' ? styles.statusRejected : styles.statusPending
        ]}>
          <ThemedText style={[
            styles.statusText,
            item.status === 'approved' ? styles.statusTextApproved : 
            item.status === 'rejected' ? styles.statusTextRejected : styles.statusTextPending
          ]}>
            {item.status === 'approved' ? 'Đã duyệt' : 
             item.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <Ionicons name="call-outline" size={16} color="#666" style={styles.detailIcon} />
        <ThemedText style={styles.detailText}>{item.phone}</ThemedText>
      </View>
      
      <View style={styles.detailRow}>
        <Ionicons name="mail-outline" size={16} color="#666" style={styles.detailIcon} />
        <ThemedText style={styles.detailText}>{item.email}</ThemedText>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={16} color="#666" style={styles.detailIcon} />
        <ThemedText style={styles.detailText}>{item.address}</ThemedText>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]} 
            onPress={() => openActionModal(item, 'rejected')}
          >
            <Ionicons name="close" size={18} color="#F44336" />
            <ThemedText style={styles.rejectBtnText}>Từ chối</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.approveBtn]} 
            onPress={() => openActionModal(item, 'approved')}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <ThemedText style={styles.approveBtnText}>Duyệt & Tạo Shop</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {item.adminMessage ? (
        <View style={styles.adminMessageContainer}>
          <ThemedText style={styles.adminMessageLabel}>Ghi chú Admin:</ThemedText>
          <ThemedText style={styles.adminMessageText}>{item.adminMessage}</ThemedText>
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Duyệt yêu cầu Shop' }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF6F61" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Yêu cầu mở Shop</ThemedText>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderRequestItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyText}>Chưa có yêu cầu nào</ThemedText>
          </View>
        }
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {actionType === 'approved' ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <ThemedText style={styles.modalSubText}>
                {actionType === 'approved' 
                  ? `Bạn chắc chắn muốn duyệt cho "${selectedRequest?.shopName}"? Hệ thống sẽ tạo thông tin Shop và cấp quyền Chủ cửa hàng cho User.` 
                  : `Vui lòng nhập lý do từ chối yêu cầu của "${selectedRequest?.shopName}":`}
              </ThemedText>

              <TextInput
                style={styles.textArea}
                placeholder="Nhập lời nhắn cho người dùng (tùy chọn khi duyệt, bắt buộc khi từ chối)..."
                multiline
                numberOfLines={4}
                value={adminMessage}
                onChangeText={setAdminMessage}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setModalVisible(false)}
                disabled={processing}
              >
                <ThemedText style={styles.modalCancelBtnText}>Hủy</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalConfirmBtn, 
                  actionType === 'rejected' ? styles.modalRejectBtnConf : styles.modalApproveBtnConf,
                  processing && styles.disabledButton
                ]} 
                onPress={handleProcessRequest}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.modalConfirmBtnText}>Xác nhận</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    color: '#FF6F61',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
    paddingRight: 12,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusApproved: {
    backgroundColor: '#E8F5E9',
  },
  statusRejected: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextPending: {
    color: '#EF6C00',
  },
  statusTextApproved: {
    color: '#2E7D32',
  },
  statusTextRejected: {
    color: '#C62828',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
  },
  rejectBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F44336',
    marginRight: 8,
  },
  approveBtn: {
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  rejectBtnText: {
    color: '#F44336',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  adminMessageContainer: {
    marginTop: 12,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  adminMessageLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  adminMessageText: {
    fontSize: 13,
    color: '#444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalSubText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    fontSize: 14,
    height: 100,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 8,
  },
  modalCancelBtnText: {
    fontWeight: 'bold',
    color: '#666',
  },
  modalConfirmBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 8,
  },
  modalRejectBtnConf: {
    backgroundColor: '#F44336',
  },
  modalApproveBtnConf: {
    backgroundColor: '#4CAF50',
  },
  modalConfirmBtnText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
