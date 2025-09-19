import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Alert, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Edit3, Trash2, Check, X } from 'lucide-react-native';
import GradientBackground from '@/components/GradientBackground';
import { useAppStore } from '@/hooks/useAppStore';
import { globalStyles } from '@/constants/styles';
import { formatDate, formatTime } from '@/utils/timeUtils';
import { TimeEntry } from '@/types';
import DatePicker from '@/components/DatePicker';
import TimePicker from '@/components/TimePicker';
import { addEntry, updateEntry, deleteEntry, listEntriesForMonth } from '@/services/supabaseService';
import { startOfMonth, format } from 'date-fns';

type EditMode = 'none' | 'edit' | 'delete';

export default function EntriesScreen() {
  const { t, settings, user } = useAppStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'none'|'edit'|'delete'>('none');
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [draftDate, setDraftDate] = useState<string>('');
  const [draftStart, setDraftStart] = useState<string>('09:00');
  const [draftEnd, setDraftEnd] = useState<string>('17:00');
  const insets = useSafeAreaInsets();

  // Loader for måneden (kald den i useEffect og efter hver mutation)
  async function reloadMonth(baseDate: Date = new Date()) {
    setLoading(true);
    try {
      const data = await listEntriesForMonth(baseDate);
      setItems(data);
    } catch (e: any) {
      Alert.alert('Fejl', e.message ?? String(e));
    } finally { setLoading(false); }
  }
  
  useEffect(() => { reloadMonth(); }, []);

  // Kobl top-ikonknapper
  const handleAddEntry = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setSelectedId(null);
    setDraftDate(today);
    setShowDatePicker(true);
  };

  const handleEditMode = () => {
    setMode(mode === 'edit' ? 'none' : 'edit');
    setSelectedId(null);
  };

  const handleDeleteMode = () => {
    if (mode === 'delete' && selectedId) {
      // klik igen = bekræft slet
      handleDelete(selectedId);
    } else {
      setMode(mode === 'delete' ? 'none' : 'delete');
      setSelectedId(null);
    }
  };
  
  // Når en liste-række trykkes
  const handleRowPress = (item: any) => {
    if (mode === 'edit') {
      // åbn modal for redigering
      setSelectedId(item.id);
      setDraftDate(item.work_date);
      setDraftStart(item.start_time);
      setDraftEnd(item.end_time);
      setShowTimePicker(true);
    } else if (mode === 'delete') {
      setSelectedId(item.id); // markeret – tryk skraldespand igen for at slette
    }
  };

  // Når dato vælges i kalenderen
  const handleDateSelected = (date: string) => {
    setDraftDate(date);
    setShowDatePicker(false);
    setShowTimePicker(true);
  };

  // Håndtag for GEM i modal (til både ny og redigering)
  async function handleSave(startTime: string, endTime: string) {
    try {
      if (!draftDate || !startTime || !endTime) {
        Alert.alert('Udfyld tid', 'Vælg dato, start og slut.');
        return;
      }
      if (selectedId) {
        await updateEntry(selectedId, { work_date: draftDate, start_time: startTime, end_time: endTime || null });
      } else {
        await addEntry({ work_date: draftDate, start_time: startTime, end_time: endTime || null });
      }
      setShowTimePicker(false);
      setSelectedId(null);
      await reloadMonth();
    } catch (e: any) {
      Alert.alert('Fejl', e.message ?? String(e));
    }
  }
  
  async function handleDelete(id: string) {
    try {
      await deleteEntry(id);
      setSelectedId(null);
      setMode('none');
      await reloadMonth();
    } catch (e: any) {
      Alert.alert('Fejl', e.message ?? String(e));
    }
  }

  const cancelEditMode = () => {
    setMode('none');
    setSelectedId(null);
  };

  const renderEntry = ({ item }: { item: any }) => {
    const isSelected = selectedId === item.id;
    const showCheckbox = mode !== 'none';
    
    return (
      <TouchableOpacity 
        style={[globalStyles.glassCardSmall, isSelected && styles.selectedEntry]}
        onPress={() => showCheckbox ? handleRowPress(item) : undefined}
        disabled={!showCheckbox}
        testID={`ts-entries-row-${item.id}`}
      >
        <View style={styles.entryHeader}>
          {showCheckbox && (
            <View style={styles.checkbox}>
              {isSelected ? (
                <Check size={20} color="#018d36" />
              ) : (
                <View style={styles.emptyCheckbox} />
              )}
            </View>
          )}
          <Text style={[globalStyles.bodyText, styles.dateText]}>
            {formatDate(item.work_date, settings?.language === 'da' ? 'da-DK' : 'en-US')}
          </Text>
        </View>
        
        <View style={styles.timeRow}>
          <View style={styles.timeColumn}>
            <Text style={globalStyles.smallText}>{t('startTime')}</Text>
            <Text style={globalStyles.bodyText}>{item.start_time}</Text>
          </View>
          
          <View style={styles.timeColumn}>
            <Text style={globalStyles.smallText}>{t('endTime')}</Text>
            <Text style={globalStyles.bodyText}>
              {item.end_time || '--:--'}
            </Text>
          </View>
          
          <View style={styles.timeColumn}>
            <Text style={globalStyles.smallText}>{t('totalTime')}</Text>
            <Text style={[globalStyles.bodyText, styles.totalText]}>
              {item.end_time ? formatTime((new Date(`2000-01-01T${item.end_time}`).getTime() - new Date(`2000-01-01T${item.start_time}`).getTime()) / (1000 * 60 * 60)) : '--:--'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const totalHours = items.reduce((sum, item) => {
    if (!item.start_time || !item.end_time) return sum;
    const hours = (new Date(`2000-01-01T${item.end_time}`).getTime() - new Date(`2000-01-01T${item.start_time}`).getTime()) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  return (
    <GradientBackground>
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.header}>
          <View style={globalStyles.glassCard}>
            <View style={styles.headerContent}>
              <View style={{ flex: 1 }}>
                <Text style={globalStyles.title}>{t('timeEntries')}</Text>
                <Text style={globalStyles.subtitle}>
                  {t('totalHours')}: {formatTime(totalHours)}
                </Text>
              </View>
              
              {mode === 'none' ? (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={handleAddEntry}
                    testID="ts-entries-add"
                  >
                    <Plus size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={handleEditMode}
                    testID="ts-entries-edit"
                  >
                    <Edit3 size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={handleDeleteMode}
                    testID="ts-entries-delete"
                  >
                    <Trash2 size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionButtons}>
                  {mode === 'delete' && (
                    <TouchableOpacity 
                      style={[styles.headerButton, styles.deleteButton]}
                      onPress={handleDeleteMode}
                      disabled={loading}
                    >
                      <Trash2 size={20} color="white" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={cancelEditMode}
                  >
                    <X size={20} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        <FlatList
          data={items}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          testID="ts-entries-list"
        />
        
        <DatePicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelect={handleDateSelected}
          selectedDate={draftDate}
          testID="ts-entries-date-confirm"
        />
        
        <TimePicker
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          onConfirm={handleSave}
          initialStartTime={draftStart}
          initialEndTime={draftEnd}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  confirmButton: {
    backgroundColor: '#018d36',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  selectedEntry: {
    borderColor: '#018d36',
    borderWidth: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emptyCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  listContent: {
    paddingBottom: 20,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  totalText: {
    fontWeight: '700',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
});