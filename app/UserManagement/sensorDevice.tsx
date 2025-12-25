import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

const colors = {
  brandGreen: '#22C55E',
  brandBlue: '#3B82F6',
  brandGrayText: '#6B7280',
  brandGrayBorder: '#E5E7EB',
  cardBg: '#F9FAFB',
  orange: '#F97316',
  purple: '#A855F7',
  red: '#EF4444',
};

const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

interface SensorDevice {
  id: number;
  sensor_type: string;
  serial_number: string;
  installation_date: string;
  last_calibration_date: string;
  status: boolean;
}

export default function SensorDeviceScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const router = useRouter();

  const [devices, setDevices] = useState<SensorDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDevice, setNewDevice] = useState({
    sensor_type: '',
    serial_number: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, [email]);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('sensor_device')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching devices:', error);
        Alert.alert('Error', 'Failed to fetch sensor devices');
        return;
      }

      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      Alert.alert('Error', 'Failed to fetch sensor devices');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async () => {
    if (!newDevice.sensor_type.trim()) {
      Alert.alert('Error', 'Please enter sensor type');
      return;
    }

    if (!newDevice.serial_number.trim()) {
      Alert.alert('Error', 'Please enter serial number');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('sensor_device')
        .insert({
          sensor_type: newDevice.sensor_type.trim(),
          serial_number: newDevice.serial_number.trim(),
          installation_date: new Date().toISOString().split('T')[0],
          last_calibration_date: new Date().toISOString().split('T')[0],
          status: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding device:', error);
        Alert.alert('Error', 'Failed to add device');
        return;
      }

      setDevices([data, ...devices]);
      setNewDevice({ sensor_type: '', serial_number: '' });
      setShowAddForm(false);
      Alert.alert('Success', 'Device added successfully');
    } catch (error) {
      console.error('Error adding device:', error);
      Alert.alert('Error', 'Failed to add device');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? colors.brandGreen : colors.brandGrayText;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandBlue} />
          <Text style={styles.loadingText}>Loading sensor devices...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sensor Devices</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Add Device Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <FontAwesome name="plus" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add New Device</Text>
          </TouchableOpacity>

          {/* Add Device Form */}
          {showAddForm && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Register New Device</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sensor Type</Text>
                <TextInput
                  style={styles.input}
                  value={newDevice.sensor_type}
                  onChangeText={(text) => setNewDevice({ ...newDevice, sensor_type: text })}
                  placeholder="e.g., Soil Moisture, Temperature, Humidity"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Serial Number</Text>
                <TextInput
                  style={styles.input}
                  value={newDevice.serial_number}
                  onChangeText={(text) => setNewDevice({ ...newDevice, serial_number: text })}
                  placeholder="Enter serial number"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowAddForm(false);
                    setNewDevice({ sensor_type: '', serial_number: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleAddDevice}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Add Device</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Devices List */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Registered Devices</Text>
            
            {devices.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome name="microchip" size={48} color={colors.brandGrayText} />
                <Text style={styles.emptyStateText}>No devices registered yet</Text>
                <Text style={styles.emptyStateSubText}>Add your first sensor device to get started</Text>
              </View>
            ) : (
              devices.map((device) => (
                <View key={device.id} style={styles.deviceItem}>
                  <View style={styles.deviceHeader}>
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>{device.sensor_type}</Text>
                      <Text style={styles.deviceId}>SN: {device.serial_number}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(device.status) }]}>
                      <Text style={styles.statusText}>{device.status ? 'ACTIVE' : 'INACTIVE'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.deviceDetails}>
                    <View style={styles.detailRow}>
                      <FontAwesome name="tag" size={14} color={colors.brandGrayText} />
                      <Text style={styles.detailLabel}>Type:</Text>
                      <Text style={styles.detailValue}>{device.sensor_type}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <FontAwesome name="calendar" size={14} color={colors.brandGrayText} />
                      <Text style={styles.detailLabel}>Installed:</Text>
                      <Text style={styles.detailValue}>{device.installation_date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <FontAwesome name="clock-o" size={14} color={colors.brandGrayText} />
                      <Text style={styles.detailLabel}>Last Calibration:</Text>
                      <Text style={styles.detailValue}>{device.last_calibration_date}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.brandGrayText,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.brandGrayBorder,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: '#000',
  },
  headerRight: {
    width: 28,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  addButton: {
    backgroundColor: colors.brandGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.brandGrayBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.brandGrayBorder,
  },
  cancelButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: colors.brandBlue,
  },
  saveButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: '#1F2937',
    marginTop: 12,
  },
  emptyStateSubText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.brandGrayText,
    marginTop: 4,
    textAlign: 'center',
  },
  deviceItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandGrayBorder,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: '#1F2937',
  },
  deviceId: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.brandGrayText,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: '#fff',
  },
  deviceDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.brandGrayText,
    minWidth: 60,
  },
  detailValue: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
  },
});