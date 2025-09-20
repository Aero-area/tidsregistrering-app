import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

interface TimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (startTime: string, endTime: string) => void;
  initialStartTime?: string;
  initialEndTime?: string;
}

export default function TimePicker({ 
  visible, 
  onClose, 
  onConfirm, 
  initialStartTime = '09:00',
  initialEndTime = '17:00'
}: TimePickerProps) {
  const insets = useSafeAreaInsets();
  const [startHour, setStartHour] = useState(() => {
    return parseInt(initialStartTime.split(':')[0]);
  });
  const [startMinute, setStartMinute] = useState(() => {
    return parseInt(initialStartTime.split(':')[1]);
  });
  const [endHour, setEndHour] = useState(() => {
    return parseInt(initialEndTime.split(':')[0]);
  });
  const [endMinute, setEndMinute] = useState(() => {
    return parseInt(initialEndTime.split(':')[1]);
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    const startTimeStr = formatTime(startHour, startMinute);
    const endTimeStr = formatTime(endHour, endMinute);
    onConfirm(startTimeStr, endTimeStr);
    onClose();
  };

  const renderScrollPicker = (
    items: number[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    formatValue?: (value: number) => string
  ) => {
    return (
      <ScrollView 
        style={styles.picker}
        showsVerticalScrollIndicator={false}
        snapToInterval={50}
        decelerationRate="fast"
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.pickerItem,
              selectedValue === item && styles.selectedPickerItem
            ]}
            onPress={() => onValueChange(item)}
          >
            <Text style={[
              styles.pickerText,
              selectedValue === item && styles.selectedPickerText
            ]}>
              {formatValue ? formatValue(item) : String(item).padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Vælg tid</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.timeSection}>
              <Text style={styles.sectionTitle}>Starttid</Text>
              <View style={styles.timeRow}>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Timer</Text>
                  {renderScrollPicker(hours, startHour, setStartHour)}
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Minutter</Text>
                  {renderScrollPicker(minutes, startMinute, setStartMinute)}
                </View>
              </View>
            </View>

            <View style={styles.timeSection}>
              <Text style={styles.sectionTitle}>Sluttid</Text>
              <View style={styles.timeRow}>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Timer</Text>
                  {renderScrollPicker(hours, endHour, setEndHour)}
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Minutter</Text>
                  {renderScrollPicker(minutes, endMinute, setEndMinute)}
                </View>
              </View>
            </View>
            
            {/* Extra padding to ensure content is not hidden behind sticky footer */}
            <View style={{ height: 100 }} />
          </ScrollView>
          
          {/* Sticky footer */}
          <View style={[
            styles.stickyFooter,
            { paddingBottom: insets.bottom + 12 }
          ]}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} testID="ts-entries-time-cancel">
              <Text style={styles.cancelButtonText}>Annuller</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} testID="ts-entries-time-save">
              <Text style={styles.confirmButtonText}>Gem</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 15,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  timeSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
  },
  picker: {
    height: 150,
    width: 80,
  },
  pickerItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedPickerItem: {
    backgroundColor: 'rgba(1, 141, 54, 0.3)',
  },
  pickerText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  selectedPickerText: {
    color: '#018d36',
    fontWeight: '700',
  },
  timeSeparator: {
    fontSize: 24,
    color: 'white',
    fontWeight: '600',
    marginHorizontal: 20,
    marginTop: 25,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 30,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#018d36',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});