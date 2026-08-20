import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/hooks/auth';
import { useLivestock } from '../lib/hooks/livestock';
import { useLivestockCareRecords } from '../lib/hooks/livestockCareRecords';
import { requestNotificationPermission } from '../lib/services/notifications';
import type { Livestock, LivestockCareRecord } from '../lib/types';

import LivestockForm from './livestock/LivestockForm';
import LivestockList from './livestock/LivestockList';
import CareRecordForm from './livestock/CareRecordForm';
import CareRecordList from './livestock/CareRecordList';

export default function LivestockApp() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { livestock, addLivestock, updateLivestock, deleteLivestock } = useLivestock();
  const { records, addCareRecord, updateCareRecord, deleteCareRecord, completeCareRecord } = useLivestockCareRecords();

  const [editingLivestock, setEditingLivestock] = useState<Livestock | undefined>(undefined);
  const [editingRecord, setEditingRecord] = useState<LivestockCareRecord | undefined>(undefined);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const livestockById = useMemo(
    () => Object.fromEntries(livestock.map(l => [l.id, l])),
    [livestock]
  );

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) Alert.alert('Error', error.message);
  };

  const handleDeleteLivestock = async (id: string) => {
    const { error } = await deleteLivestock(id);
    if (error) Alert.alert('Error', error);
  };

  const handleDeleteRecord = async (id: string) => {
    const { error } = await deleteCareRecord(id);
    if (error) Alert.alert('Error', error);
  };

  const handleComplete = async (id: string, livestockName: string) => {
    const { error } = await completeCareRecord(id, livestockName);
    if (error) Alert.alert('Error', error);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Livestock</Text>
        <View style={styles.headerRight}>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <LivestockForm
        onSubmit={async (data) => {
          const { error } = await addLivestock(data);
          if (error) throw new Error(error);
        }}
        editLivestock={editingLivestock}
        onUpdate={async (id, data) => {
          const { error } = await updateLivestock(id, data);
          if (error) throw new Error(error);
        }}
        onCancel={() => setEditingLivestock(undefined)}
      />

      <LivestockList
        livestock={livestock}
        onEdit={setEditingLivestock}
        onDelete={handleDeleteLivestock}
      />

      <CareRecordForm
        livestock={livestock}
        onSubmit={async (data, livestockName) => {
          const { error } = await addCareRecord(data, livestockName);
          if (error) throw new Error(error);
        }}
        editRecord={editingRecord}
        onUpdate={async (id, data, livestockName) => {
          const { error } = await updateCareRecord(id, data, livestockName);
          if (error) throw new Error(error);
        }}
        onCancel={() => setEditingRecord(undefined)}
      />

      <CareRecordList
        records={records}
        livestockById={livestockById}
        onEdit={setEditingRecord}
        onDelete={handleDeleteRecord}
        onComplete={handleComplete}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  signOutText: {
    color: '#2563eb',
    fontSize: 12,
  },
});
