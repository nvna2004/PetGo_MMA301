import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);

  const renderSettingItem = (icon: any, label: string, onPress?: () => void, rightElement?: React.ReactNode) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: tintColor + '15' }]}>
          <Ionicons name={icon} size={22} color={tintColor} />
        </View>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={20} color="#CCC" />}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Cài đặt</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Thông báo</ThemedText>
            {renderSettingItem(
              'notifications-outline', 
              'Thông báo đẩy', 
              undefined, 
              <Switch 
                value={isNotificationsEnabled} 
                onValueChange={setIsNotificationsEnabled}
                trackColor={{ false: '#EEE', true: tintColor + '80' }}
                thumbColor={isNotificationsEnabled ? tintColor : '#FFF'}
              />
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Cửa hàng (Dành cho chủ shop)</ThemedText>
            {renderSettingItem('storefront-outline', 'Thông tin cửa hàng', () => {})}
            {renderSettingItem('list-outline', 'Quản lý dịch vụ', () => {
              router.push('/user/services' as any);
            })}
            {renderSettingItem('time-outline', 'Giờ mở cửa', () => {})}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Hỗ trợ</ThemedText>
            {renderSettingItem('help-circle-outline', 'Trung tâm trợ giúp', () => {})}
            {renderSettingItem('shield-checkmark-outline', 'Chính sách bảo mật', () => {})}
            {renderSettingItem('information-circle-outline', 'Về PetGo', () => {})}
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.versionText}>Phiên bản 1.0.0</ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 28,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 10,
    marginLeft: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});
