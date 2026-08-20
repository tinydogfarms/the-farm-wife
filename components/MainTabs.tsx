import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserSettings } from '../lib/hooks/userSettings';
import FinanceApp from './FinanceApp';
import EquipmentApp from './EquipmentApp';

type Tab = 'finance' | 'equipment';

export default function MainTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('finance');
  const { isModuleEnabled } = useUserSettings();
  const insets = useSafeAreaInsets();

  // Equipment isn't rolled out to every account yet — until enabled, this is
  // exactly today's single-screen Finance app, no tab bar shown at all.
  if (!isModuleEnabled('equipment')) {
    return <FinanceApp />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.screen}>
        {activeTab === 'finance' ? <FinanceApp /> : <EquipmentApp />}
      </View>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'finance' && styles.activeTab]}
          onPress={() => setActiveTab('finance')}
        >
          <Text style={[styles.tabText, activeTab === 'finance' && styles.activeTabText]}>Finance</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'equipment' && styles.activeTab]}
          onPress={() => setActiveTab('equipment')}
        >
          <Text style={[styles.tabText, activeTab === 'equipment' && styles.activeTabText]}>Equipment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
