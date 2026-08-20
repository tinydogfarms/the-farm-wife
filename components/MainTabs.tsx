import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserSettings } from '../lib/hooks/userSettings';
import FinanceApp from './FinanceApp';
import EquipmentApp from './EquipmentApp';
import LivestockApp from './LivestockApp';

type Tab = 'finance' | 'equipment' | 'livestock';

const TAB_LABELS: Record<Tab, string> = {
  finance: 'Finance',
  equipment: 'Equipment',
  livestock: 'Livestock',
};

export default function MainTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('finance');
  const { isModuleEnabled } = useUserSettings();
  const insets = useSafeAreaInsets();

  const tabs: Tab[] = [
    'finance',
    ...(isModuleEnabled('equipment') ? (['equipment'] as const) : []),
    ...(isModuleEnabled('livestock') ? (['livestock'] as const) : []),
  ];

  // No optional modules rolled out to this account yet — today's exact
  // single-screen Finance app, no tab bar shown at all.
  if (tabs.length === 1) {
    return <FinanceApp />;
  }

  const currentTab = tabs.includes(activeTab) ? activeTab : 'finance';

  return (
    <View style={styles.container}>
      <View style={styles.screen}>
        {currentTab === 'finance' && <FinanceApp />}
        {currentTab === 'equipment' && <EquipmentApp />}
        {currentTab === 'livestock' && <LivestockApp />}
      </View>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, currentTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, currentTab === tab && styles.activeTabText]}>{TAB_LABELS[tab]}</Text>
          </TouchableOpacity>
        ))}
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
