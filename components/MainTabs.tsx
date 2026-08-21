import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { useUserSettings } from '../lib/hooks/userSettings';
import type { useWeather } from '../lib/hooks/weather';
import HomeApp from './HomeApp';
import FinanceApp from './FinanceApp';
import EquipmentApp from './EquipmentApp';
import LivestockApp from './LivestockApp';

type Tab = 'home' | 'finance' | 'equipment' | 'livestock';

const TAB_LABELS: Record<Tab, string> = {
  home: 'Home',
  finance: 'Finance',
  equipment: 'Equipment',
  livestock: 'Livestock',
};

interface MainTabsProps {
  userSettings: ReturnType<typeof useUserSettings>;
  weather: ReturnType<typeof useWeather>;
}

export default function MainTabs({ userSettings, weather }: MainTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const { isModuleEnabled, loading } = userSettings;
  const insets = useSafeAreaInsets();

  // Wait for module gating to load before deciding the tab set — otherwise
  // Equipment/Livestock briefly read as disabled (settings still null) and
  // the tab bar visibly grows once they load in.
  if (loading) {
    return <View style={styles.container} />;
  }

  const tabs: Tab[] = [
    'home',
    'finance',
    ...(isModuleEnabled('equipment') ? (['equipment'] as const) : []),
    ...(isModuleEnabled('livestock') ? (['livestock'] as const) : []),
  ];

  const currentTab = tabs.includes(activeTab) ? activeTab : 'home';

  return (
    <View style={styles.container}>
      <View style={styles.screen}>
        {currentTab === 'home' && <HomeApp userSettings={userSettings} weather={weather} />}
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
    backgroundColor: '#f9fafb',
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
