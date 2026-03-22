import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { PROVINCES } from '@/constants/provinces';

interface CityPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (cityName: string) => void;
  currentValue?: string;
}

export function CityPicker({ visible, onClose, onSelect, currentValue }: CityPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProvinces = PROVINCES.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FF6F61" />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.headerTitle}>Chọn Tỉnh / Thành phố</ThemedText>
          <View style={{ width: 40 }} /> 
        </ThemedView>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm tỉnh thành..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={false}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredProvinces}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.item,
                currentValue === item.name && styles.selectedItem
              ]}
              onPress={() => {
                onSelect(item.name);
                onClose();
              }}
            >
              <ThemedText style={[
                styles.itemText,
                currentValue === item.name && styles.selectedItemText
              ]}>
                {item.name}
              </ThemedText>
              {currentValue === item.name && (
                <Ionicons name="checkmark-sharp" size={20} color="#FF6F61" />
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          initialNumToRender={20}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  selectedItem: {
    backgroundColor: 'rgba(255, 111, 97, 0.05)',
  },
  itemText: {
    fontSize: 16,
  },
  selectedItemText: {
    color: '#FF6F61',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginLeft: 20,
  },
});
