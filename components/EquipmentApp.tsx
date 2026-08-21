import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/hooks/auth';
import { useEquipment } from '../lib/hooks/equipment';
import { useServiceRecords } from '../lib/hooks/serviceRecords';
import { requestNotificationPermission } from '../lib/services/notifications';
import type { Equipment, ServiceRecord } from '../lib/types';

import EquipmentForm from './equipment/EquipmentForm';
import EquipmentList from './equipment/EquipmentList';
import ServiceRecordForm from './equipment/ServiceRecordForm';
import ServiceRecordList from './equipment/ServiceRecordList';
import ServiceHistoryList from './equipment/ServiceHistoryList';

export default function EquipmentApp() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { equipment, addEquipment, updateEquipment, deleteEquipment } = useEquipment();
  const { records, addServiceRecord, updateServiceRecord, deleteServiceRecord, completeServiceRecord } = useServiceRecords();

  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>(undefined);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | undefined>(undefined);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const equipmentById = useMemo(
    () => Object.fromEntries(equipment.map(e => [e.id, e])),
    [equipment]
  );

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) Alert.alert('Error', error.message);
  };

  const handleDeleteEquipment = async (id: string) => {
    const { error } = await deleteEquipment(id);
    if (error) Alert.alert('Error', error);
  };

  const handleDeleteRecord = async (id: string) => {
    const { error } = await deleteServiceRecord(id);
    if (error) Alert.alert('Error', error);
  };

  const handleComplete = async (id: string, equipmentName: string) => {
    const { error } = await completeServiceRecord(id, equipmentName);
    if (error) Alert.alert('Error', error);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Equipment</Text>
        <View style={styles.headerRight}>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <EquipmentForm
        onSubmit={async (data) => {
          const { error } = await addEquipment(data);
          if (error) throw new Error(error);
        }}
        editEquipment={editingEquipment}
        onUpdate={async (id, data) => {
          const { error } = await updateEquipment(id, data);
          if (error) throw new Error(error);
        }}
        onCancel={() => setEditingEquipment(undefined)}
      />

      <EquipmentList
        equipment={equipment}
        onEdit={setEditingEquipment}
        onDelete={handleDeleteEquipment}
      />

      <ServiceRecordForm
        equipment={equipment}
        onSubmit={async (data, equipmentName) => {
          const { error } = await addServiceRecord(data, equipmentName);
          if (error) throw new Error(error);
        }}
        editRecord={editingRecord}
        onUpdate={async (id, data, equipmentName) => {
          const { error } = await updateServiceRecord(id, data, equipmentName);
          if (error) throw new Error(error);
        }}
        onCancel={() => setEditingRecord(undefined)}
      />

      <ServiceRecordList
        records={records}
        equipmentById={equipmentById}
        onEdit={setEditingRecord}
        onDelete={handleDeleteRecord}
        onComplete={handleComplete}
      />

      <ServiceHistoryList
        records={records}
        equipmentById={equipmentById}
        onDelete={handleDeleteRecord}
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
