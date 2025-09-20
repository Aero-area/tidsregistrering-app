import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Switch, Modal, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Globe, Clock, Calendar, Mail, X, Check } from 'lucide-react-native';
import GradientBackground from '@/components/GradientBackground';
import AnimatedButton from '@/components/AnimatedButton';
import { useAppStore } from '@/hooks/useAppStore';
import { globalStyles } from '@/constants/styles';
import { AppSettings, RoundingRule } from '@/types';
import { SupabaseService } from '@/services/supabaseService';
import { Settings } from '@/types/database';
import { format } from 'date-fns';

export default function SettingsScreen() {
  const { settings, saveSettings, logout, user, createBackup, t } = useAppStore();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [supabaseSettings, setSupabaseSettings] = useState<Settings | null>(null);
  const [showRolloverDayPicker, setShowRolloverDayPicker] = useState(false);
  const [showRolloverHourPicker, setShowRolloverHourPicker] = useState(false);
  const [showRoundingPicker, setShowRoundingPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showBackupFrequencyPicker, setShowBackupFrequencyPicker] = useState(false);
  const [emailReportData, setEmailReportData] = useState({ from: '', to: '', email: '' });
  
  useEffect(() => {
    loadSupabaseSettings();
  }, []);
  
  const loadSupabaseSettings = async () => {
    try {
      const dbSettings = await SupabaseService.getSettings();
      setSupabaseSettings(dbSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSupabaseSetting = async (patch: Partial<Settings>) => {
    try {
      const updated = await SupabaseService.updateSettings(patch);
      setSupabaseSettings(updated);
    } catch (error: any) {
      Alert.alert('Fejl', error.message || 'Kunne ikke opdatere indstilling');
    }
  };
  
  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    saveSettings({ ...settings, [key]: value });
  };

  const getRoundingLabel = (rule: RoundingRule) => {
    switch (rule) {
      case 'none':
        return t('none');
      case '5min':
        return '5 min';
      case '10min':
        return '10 min';
      case '15min':
        return '15 min';
    }
  };

  const getLanguageLabel = (lang: 'da' | 'en') => {
    return lang === 'da' ? t('danish') : t('english');
  };

  const handleLogout = () => {
    logout();
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const fileName = await createBackup();
      Alert.alert('Succes', `Backup oprettet: ${fileName}`);
    } catch (error: any) {
      Alert.alert('Fejl', error.message || 'Kunne ikke oprette backup');
    } finally {
      setIsBackingUp(false);
    }
  };
  
  const handleEmailReport = async () => {
    try {
      if (!emailReportData.from || !emailReportData.to || !emailReportData.email) {
        Alert.alert('Fejl', 'Udfyld alle felter');
        return;
      }
      
      await SupabaseService.requestEmailReport({
        from: emailReportData.from,
        to: emailReportData.to,
        toEmail: emailReportData.email,
      });
      
      Alert.alert('Succes', 'Rapport sendt til din e-mail');
      setShowEmailDialog(false);
      setEmailReportData({ from: '', to: '', email: '' });
    } catch (error: any) {
      Alert.alert('Fejl', error.message || 'Kunne ikke sende rapport');
    }
  };
  
  const renderPicker = (
    visible: boolean,
    onClose: () => void,
    title: string,
    items: { label: string; value: any }[],
    selectedValue: any,
    onSelect: (value: any) => void
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.value)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  selectedValue === item.value && styles.selectedPickerItem
                ]}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={[
                  styles.pickerItemText,
                  selectedValue === item.value && styles.selectedPickerItemText
                ]}>
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <Check size={20} color="#018d36" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={globalStyles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={globalStyles.glassCard}>
            <Text style={globalStyles.title}>{t('settings')}</Text>
          </View>

          <View style={globalStyles.glassCard}>
            <TouchableOpacity style={styles.settingRow} onPress={() => setShowRolloverDayPicker(true)} testID="ts-settings-rollover">
              <View style={styles.settingLeft}>
                <Calendar size={24} color="white" />
                <View style={styles.settingText}>
                  <Text style={globalStyles.bodyText}>{t('rolloverDay')}</Text>
                  <Text style={globalStyles.smallText}>
                    Den {supabaseSettings?.rollover_day || 1}. i måneden
                  </Text>
                </View>
              </View>
              <View style={styles.settingRight}>
                <Text style={[globalStyles.bodyText, styles.settingValue]}>
                  {supabaseSettings?.rollover_day || 1}
                </Text>
                <ChevronRight size={20} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={() => setShowRolloverHourPicker(true)}>
              <View style={styles.settingLeft}>
                <Clock size={24} color="white" />
                <View style={styles.settingText}>
                  <Text style={globalStyles.bodyText}>Rollover time</Text>
                  <Text style={globalStyles.smallText}>
                    Kl. {supabaseSettings?.rollover_hour || 0}:00
                  </Text>
                </View>
              </View>
              <View style={styles.settingRight}>
                <Text style={[globalStyles.bodyText, styles.settingValue]}>
                  {supabaseSettings?.rollover_hour || 0}:00
                </Text>
                <ChevronRight size={20} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={() => setShowRoundingPicker(true)} testID="ts-settings-rounding">
              <View style={styles.settingLeft}>
                <Clock size={24} color="white" />
                <View style={styles.settingText}>
                  <Text style={globalStyles.bodyText}>{t('timeRounding')}</Text>
                  <Text style={globalStyles.smallText}>
                    Afrund arbejdstid automatisk
                  </Text>
                </View>
              </View>
              <View style={styles.settingRight}>
                <Text style={[globalStyles.bodyText, styles.settingValue]}>
                  {supabaseSettings?.rounding === 'none' ? 'Ingen' : `${supabaseSettings?.rounding} min`}
                </Text>
                <ChevronRight size={20} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={() => setShowLanguagePicker(true)} testID="ts-settings-lang">
              <View style={styles.settingLeft}>
                <Globe size={24} color="white" />
                <View style={styles.settingText}>
                  <Text style={globalStyles.bodyText}>{t('language')}</Text>
                  <Text style={globalStyles.smallText}>
                    Vælg app-sprog
                  </Text>
                </View>
              </View>
              <View style={styles.settingRight}>
                <Text style={[globalStyles.bodyText, styles.settingValue]}>
                  {supabaseSettings?.language === 'da' ? 'Dansk' : 'English'}
                </Text>
                <ChevronRight size={20} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={globalStyles.glassCard}>
            <Text style={[globalStyles.bodyText, styles.sectionTitle]}>
              Data og backup
            </Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={globalStyles.bodyText}>Automatisk backup</Text>
                <Text style={globalStyles.smallText}>
                  Backup data automatisk
                </Text>
              </View>
              <Switch
                value={supabaseSettings?.auto_backup || false}
                onValueChange={(value) => updateSupabaseSetting({ auto_backup: value })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#018d36' }}
                thumbColor="white"
                testID="ts-settings-autobackup"
              />
            </View>
            
            {supabaseSettings?.auto_backup && (
              <TouchableOpacity style={styles.settingRow} onPress={() => setShowBackupFrequencyPicker(true)}>
                <View style={styles.settingLeft}>
                  <Text style={globalStyles.bodyText}>Backup frekvens</Text>
                  <Text style={globalStyles.smallText}>
                    Hvor ofte skal der laves backup
                  </Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={[globalStyles.bodyText, styles.settingValue]}>
                    {supabaseSettings?.backup_frequency === 'daily' ? 'Dagligt' :
                     supabaseSettings?.backup_frequency === 'weekly' ? 'Ugentligt' : 'Månedligt'}
                  </Text>
                  <ChevronRight size={20} color="rgba(255, 255, 255, 0.6)" />
                </View>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[globalStyles.primaryButton, isBackingUp && styles.disabledButton]} 
              onPress={handleBackup}
              disabled={isBackingUp}
              testID="ts-settings-backup"
            >
              <Text style={globalStyles.primaryButtonText}>
                {isBackingUp ? 'Opretter backup...' : t('backup')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[globalStyles.primaryButton, { marginTop: 12 }]}
              onPress={() => setShowEmailDialog(true)}
              testID="ts-settings-send-report"
            >
              <Text style={globalStyles.primaryButtonText}>
                Send rapport som e-mail
              </Text>
            </TouchableOpacity>
          </View>

          <View style={globalStyles.glassCard}>
            <Text style={[globalStyles.bodyText, styles.sectionTitle]}>
              Konto
            </Text>
            
            <View style={styles.infoRow}>
              <Text style={globalStyles.smallText}>E-mail</Text>
              <Text style={globalStyles.bodyText}>{user?.email}</Text>
            </View>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Log ud</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Rollover Day Picker */}
        {renderPicker(
          showRolloverDayPicker,
          () => setShowRolloverDayPicker(false),
          'Vælg rollover dag',
          Array.from({ length: 28 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 })),
          supabaseSettings?.rollover_day || 1,
          (value) => updateSupabaseSetting({ rollover_day: value })
        )}
        
        {/* Rollover Hour Picker */}
        {renderPicker(
          showRolloverHourPicker,
          () => setShowRolloverHourPicker(false),
          'Vælg rollover time',
          Array.from({ length: 24 }, (_, i) => ({ label: `${i}:00`, value: i })),
          supabaseSettings?.rollover_hour || 0,
          (value) => updateSupabaseSetting({ rollover_hour: value })
        )}
        
        {/* Rounding Picker */}
        {renderPicker(
          showRoundingPicker,
          () => setShowRoundingPicker(false),
          'Vælg tidsafrunding',
          [
            { label: 'Ingen', value: 'none' },
            { label: '5 min', value: '5' },
            { label: '10 min', value: '10' },
            { label: '15 min', value: '15' },
          ],
          supabaseSettings?.rounding || 'none',
          (value) => updateSupabaseSetting({ rounding: value })
        )}
        
        {/* Language Picker */}
        {renderPicker(
          showLanguagePicker,
          () => setShowLanguagePicker(false),
          'Vælg sprog',
          [
            { label: 'Dansk', value: 'da' },
            { label: 'English', value: 'en' },
          ],
          supabaseSettings?.language || 'da',
          (value) => updateSupabaseSetting({ language: value })
        )}
        
        {/* Backup Frequency Picker */}
        {renderPicker(
          showBackupFrequencyPicker,
          () => setShowBackupFrequencyPicker(false),
          'Vælg backup frekvens',
          [
            { label: 'Dagligt', value: 'daily' },
            { label: 'Ugentligt', value: 'weekly' },
            { label: 'Månedligt', value: 'monthly' },
          ],
          supabaseSettings?.backup_frequency || 'weekly',
          (value) => updateSupabaseSetting({ backup_frequency: value })
        )}
        
        {/* Email Report Dialog */}
        <Modal visible={showEmailDialog} transparent animationType="slide">
          <View style={styles.pickerOverlay}>
            <View style={styles.emailDialogContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Send rapport som e-mail</Text>
                <TouchableOpacity onPress={() => setShowEmailDialog(false)}>
                  <X size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.emailDialogContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fra dato</Text>
                  <TextInput
                    style={styles.textInput}
                    value={emailReportData.from}
                    onChangeText={(text) => setEmailReportData(prev => ({ ...prev, from: text }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Til dato</Text>
                  <TextInput
                    style={styles.textInput}
                    value={emailReportData.to}
                    onChangeText={(text) => setEmailReportData(prev => ({ ...prev, to: text }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>E-mail adresse</Text>
                  <TextInput
                    style={styles.textInput}
                    value={emailReportData.email}
                    onChangeText={(text) => setEmailReportData(prev => ({ ...prev, email: text }))}
                    placeholder="din@email.dk"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                
                <View style={styles.emailDialogButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => setShowEmailDialog(false)}
                  >
                    <Text style={styles.cancelButtonText}>Annuller</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.confirmButton} 
                    onPress={handleEmailReport}
                  >
                    <Text style={styles.confirmButtonText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  logoutButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    color: 'red',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedPickerItem: {
    backgroundColor: 'rgba(1, 141, 54, 0.2)',
  },
  pickerItemText: {
    fontSize: 16,
    color: 'white',
  },
  selectedPickerItemText: {
    color: '#018d36',
    fontWeight: '600',
  },
  emailDialogContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  emailDialogContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emailDialogButtons: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
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