import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '@/components/GradientBackground';
import StampButton from '@/components/StampButton';
import { useAppStore } from '@/hooks/useAppStore';
import { globalStyles } from '@/constants/styles';
import { calculateWorkingTime, getCurrentTime } from '@/utils/timeUtils';
import { SupabaseService, listEntriesForMonth } from '@/services/supabaseService';
import { toYMD, nowZoned } from '@/lib/time';

export default function HomeScreen() {
  const { t } = useAppStore();
  
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [workingTime, setWorkingTime] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [todayEntry, setTodayEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const isWorking = todayEntry && todayEntry.start_time && !todayEntry.end_time;

  // Load today's entry
  const loadTodayEntry = async () => {
    try {
      setLoading(true);
      const entries = await listEntriesForMonth(new Date());
      const today = toYMD(nowZoned());
      const todaysEntries = entries.filter((entry: any) => entry.work_date === today);
      
      // Get the latest entry for today (if any)
      if (todaysEntries.length > 0) {
        const latest = todaysEntries.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))[todaysEntries.length - 1];
        setTodayEntry(latest);
      } else {
        setTodayEntry(null);
      }
    } catch (error) {
      console.error('Error loading today entry:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayEntry();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
      
      if (isWorking && todayEntry) {
        setWorkingTime(calculateWorkingTime(todayEntry.start_time));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorking, todayEntry]);

  const handleStampPress = async () => {
    setBusy(true);
    try {
      const result = await SupabaseService.stampToggle();
      console.log('Stamp toggle result:', result);
      
      // Show feedback message
      Alert.alert('Tidsregistrering', result.message);
      
      // Refresh the current entry display
      await loadTodayEntry();
    } catch (error: any) {
      console.error('Error handling stamp press:', error);
      Alert.alert('Fejl', error.message || 'Kunne ikke registrere tid');
    } finally {
      setBusy(false);
    }
  };

  const getStatusText = () => {
    if (!todayEntry) {
      return t('tapToStart');
    } else if (!todayEntry.end_time) {
      return t('tapToEnd');
    } else {
      return t('tapToUpdate');
    }
  };

  const calculateTotalHours = () => {
    if (!todayEntry || !todayEntry.start_time) return 0;
    
    const endTime = todayEntry.end_time || getCurrentTime();
    const startDate = new Date(`2000-01-01T${todayEntry.start_time}`);
    const endDate = new Date(`2000-01-01T${endTime}`);
    
    return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  };

  return (
    <GradientBackground>
      <SafeAreaView style={globalStyles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={globalStyles.glassCard}>
            <Text style={globalStyles.title}>Timestamp</Text>
            <Text style={globalStyles.subtitle}>{new Date().toLocaleDateString('da-DK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          </View>

          <StampButton
            onPress={handleStampPress}
            isActive={!!isWorking}
            workingTime={isWorking ? workingTime : undefined}
          />

          <View style={globalStyles.glassCard}>
            <Text style={[globalStyles.subtitle, styles.statusText]}>
              {getStatusText()}
            </Text>
            
            {todayEntry && (
              <View style={styles.todayStats}>
                <View style={styles.statRow}>
                  <Text style={globalStyles.bodyText}>{t('startTime')}:</Text>
                  <Text style={[globalStyles.bodyText, styles.statValue]}>
                    {todayEntry.start_time}
                  </Text>
                </View>
                
                {todayEntry.end_time && (
                  <View style={styles.statRow}>
                    <Text style={globalStyles.bodyText}>{t('endTime')}:</Text>
                    <Text style={[globalStyles.bodyText, styles.statValue]}>
                      {todayEntry.end_time}
                    </Text>
                  </View>
                )}
                
                <View style={styles.statRow}>
                  <Text style={globalStyles.bodyText}>{t('totalToday')}:</Text>
                  <Text style={[globalStyles.bodyText, styles.statValue]}>
                    {isWorking ? workingTime : `${calculateTotalHours().toFixed(1)}t`}
                  </Text>
                </View>
              </View>
            )}
            
            {loading && (
              <Text style={globalStyles.bodyText}>Indlæser...</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  statusText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  todayStats: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '600',
  },
});