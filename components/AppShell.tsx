import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserSettings } from '../lib/hooks/userSettings';
import type { ModuleKey } from '../lib/types';
import FarmAccountingApp from './FarmAccountingApp';
import TasksApp from './tasks/TasksApp';

interface ModuleTab {
  key: 'finance' | ModuleKey;
  label: string;
  component: React.ComponentType;
  // Modules outside this list (e.g. finance) are always shown;
  // modules with a moduleKey are hidden unless enabled in user_settings.
  moduleKey?: ModuleKey;
}

// Add new modules here as later phases land (lists, calendar, etc.) —
// the tab bar and gating logic don't need to change.
const TABS: ModuleTab[] = [
  { key: 'finance', label: 'Finance', component: FarmAccountingApp },
  { key: 'tasks', label: 'Tasks', component: TasksApp, moduleKey: 'tasks' },
];

export default function AppShell() {
  const insets = useSafeAreaInsets();
  const { enabledModules } = useUserSettings();
  const [activeTab, setActiveTab] = useState<ModuleTab['key']>('finance');

  const visibleTabs = TABS.filter(tab => !tab.moduleKey || enabledModules.includes(tab.moduleKey));
  const ActiveComponent = visibleTabs.find(tab => tab.key === activeTab)?.component
    ?? visibleTabs[0]?.component
    ?? FarmAccountingApp;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActiveComponent />
      </View>

      {visibleTabs.length > 1 && (
        <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
          {visibleTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
