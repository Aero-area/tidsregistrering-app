import { startOfMonth, endOfMonth, format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Entry, Settings } from '@/types/database';
import { TimeEntry, AppSettings } from '@/types';
import { cache, cacheKeys } from '@/lib/cache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineQueue } from '@/lib/offlineQueue';
import { toYMD, toHM, nowZoned, roundTimeString } from '@/lib/time';
import * as Haptics from 'expo-haptics';

// Helper function to handle Supabase errors and ensure data return
async function exec<T>(q: Promise<{ data: any; error: any }>): Promise<T> {
  const { data, error } = await q;
  if (error) throw new Error(error.message || String(error));
  return data as T;
}

export class SupabaseService {
  // Auth methods
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw new Error(error.message);
      return session;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      return data;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async signUpWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      return data;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async signOut() {
    try {
      const session = await this.getSession();
      if (session?.user) {
        // Clear cache for user
        const uid = session.user.id;
        await cache.jdel(cacheKeys.settings(uid));
        // Clear all month entries for this user
        const keys = await AsyncStorage.getAllKeys();
        const userEntryKeys = keys.filter(key => key.startsWith(`ts:entries:${uid}:`));
        await Promise.all(userEntryKeys.map(key => AsyncStorage.removeItem(key)));
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async ensureProfile() {
    try {
      const session = await this.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
          })
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);
        return newProfile;
      }

      if (fetchError) throw new Error(fetchError.message);
      return profile;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async getSettings() {
    try {
      const session = await this.getSession();
      if (!session?.user) throw new Error('No authenticated user');
      
      const uid = session.user.id;
      const cacheKey = cacheKeys.settings(uid);
      
      // Try cache first
      const cached = await cache.jget<Settings>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      
      // Create default settings if none exist
      if (!data) {
        const defaultSettings: Partial<Settings> = {
          rollover_day: 1,
          rollover_hour: 0,
          rounding: 'none',
          language: 'da',
          auto_backup: false,
          backup_frequency: 'weekly',
        };
        const newSettings = await this.upsertSettings(defaultSettings);
        await cache.jset(cacheKey, newSettings);
        return newSettings;
      }
      
      // Cache the result
      await cache.jset(cacheKey, data);
      return data;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async upsertSettings(input: Partial<Settings>) {
    try {
      const session = await this.getSession();
      if (!session?.user) throw new Error('No authenticated user');
      
      const uid = session.user.id;
      const cacheKey = cacheKeys.settings(uid);

      const { data, error } = await supabase
        .from('settings')
        .upsert({
          user_id: session.user.id,
          ...input,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      
      // Update cache
      await cache.jset(cacheKey, data);
      return data;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async listEntries(from: Date, to: Date) {
    try {
      const session = await this.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('work_date', from.toISOString().split('T')[0])
        .lte('work_date', to.toISOString().split('T')[0])
        .order('work_date', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // New improved listEntriesForMonth function
  static async listEntriesForMonth(d: Date) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Ikke logget ind');
    const uid = session.user.id;
    const from = format(startOfMonth(d), 'yyyy-MM-dd');
    const to   = format(endOfMonth(d), 'yyyy-MM-dd');

    const { data, error } = await supabase.from('entries')
      .select('id, work_date, start_time, end_time')
      .eq('user_id', uid)
      .gte('work_date', from)
      .lte('work_date', to)
      .order('work_date', { ascending: false })
      .order('start_time', { ascending: true });
    
    if (error) throw new Error(error.message || String(error));
    return data || [];
  }

  // New improved addEntry function
  static async addEntry(payload: { work_date: string; start_time: string; end_time: string | null }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Ikke logget ind');
    const uid = session.user.id;
    
    // Convert empty string to null for end_time
    const cleanPayload = {
      ...payload,
      end_time: payload.end_time === '' ? null : payload.end_time
    };
    
    const { data, error } = await supabase.from('entries')
      .insert({ user_id: uid, ...cleanPayload })
      .select('id, work_date, start_time, end_time')
      .single();
    
    if (error) throw new Error(error.message || String(error));
    return data;
  }

  // New improved updateEntry function
  static async updateEntry(id: string, patch: Partial<{ work_date: string; start_time: string; end_time: string | null }>) {
    // Convert empty string to null for end_time
    const cleanPatch = { ...patch };
    if ('end_time' in cleanPatch && cleanPatch.end_time === '') {
      cleanPatch.end_time = null;
    }
    
    const { data, error } = await supabase.from('entries')
      .update(cleanPatch)
      .eq('id', id)
      .select('id, work_date, start_time, end_time')
      .single();
    
    if (error) throw new Error(error.message || String(error));
    return data;
  }

  // New improved deleteEntry function
  static async deleteEntry(id: string) {
    const { error } = await supabase.from('entries')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message || String(error));
    return id;
  }

  static async stampToggle(): Promise<{ entry: any; message: string }> {
    try {
      const session = await this.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const uid = session.user.id;
      const today = toYMD(nowZoned());
      const currentTime = toHM(nowZoned());
      
      // Get user settings for rounding
      const settings = await this.getSettings();
      let roundedTime = currentTime;
      if (settings?.rounding && settings.rounding !== 'none') {
        const roundingValue = parseInt(settings.rounding) as 5 | 10 | 15;
        roundedTime = roundTimeString(currentTime, roundingValue);
      }

      // Find today's entry (latest one)
      const { data: todayEntry } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', uid)
        .eq('work_date', today)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      let entry: any;
      let message: string;

      if (!todayEntry) {
        // No entry for today, create new one with start time
        const { data, error } = await supabase.from('entries')
          .insert({ 
            user_id: uid, 
            work_date: today, 
            start_time: roundedTime, 
            end_time: null 
          })
          .select('id, work_date, start_time, end_time')
          .single();
        
        if (error) throw new Error(error.message || String(error));
        entry = data;
        message = `Tidsregistrering startet kl. ${roundedTime}`;
      } else if (todayEntry.end_time === null || todayEntry.end_time === '') {
        // Open entry exists, set end time
        entry = await this.updateEntry(todayEntry.id, {
          end_time: roundedTime,
        });
        message = `Tidsregistrering sluttet kl. ${roundedTime}`;
      } else {
        // Entry already has end time, update it
        entry = await this.updateEntry(todayEntry.id, {
          end_time: roundedTime,
        });
        message = `Sluttid opdateret til kl. ${roundedTime}`;
      }

      // Haptic feedback
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (hapticError) {
        console.log('Haptic feedback not available:', hapticError);
      }

      return { entry, message };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  
  static async updateSettings(patch: Partial<Settings>) {
    try {
      const session = await this.getSession();
      if (!session?.user) throw new Error('No authenticated user');
      
      const uid = session.user.id;
      const cacheKey = cacheKeys.settings(uid);
      
      // Get current settings first
      const current = await this.getSettings();
      if (!current) {
        // Create new settings if none exist
        return await this.upsertSettings(patch);
      }
      
      // Update with patch
      const updated = await this.upsertSettings({ ...current, ...patch });
      
      // Update cache
      await cache.jset(cacheKey, updated);
      return updated;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async backupToStorage(jsonBlob: any) {
    try {
      const session = await this.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const bucketName = process.env.EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET || 'backups';
      const fileName = `${session.user.id}/${toYMD(new Date())}.json`;
      const fileContent = JSON.stringify(jsonBlob, null, 2);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, new Blob([fileContent], { type: 'application/json' }));

      if (error) throw new Error(error.message);
      return data;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Auto-backup functionality
  static async checkAndPerformAutoBackup() {
    try {
      const session = await this.getSession();
      if (!session?.user) return;

      const settings = await this.getSettings();
      if (!settings?.auto_backup) return;

      const uid = session.user.id;
      const lastBackupKey = `ts:lastBackupTs:${uid}`;
      const lastBackupTs = await AsyncStorage.getItem(lastBackupKey);
      const lastBackupTime = lastBackupTs ? parseInt(lastBackupTs) : 0;
      const now = Date.now();

      let intervalMs = 0;
      switch (settings.backup_frequency) {
        case 'daily':
          intervalMs = 24 * 60 * 60 * 1000;
          break;
        case 'weekly':
          intervalMs = 7 * 24 * 60 * 60 * 1000;
          break;
        case 'monthly':
          intervalMs = 30 * 24 * 60 * 60 * 1000;
          break;
      }

      if (now - lastBackupTime >= intervalMs) {
        console.log('Performing auto-backup...');
        
        // Get last 90 days of entries
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        const entries = await this.listEntries(startDate, endDate);
        
        const backupData = {
          entries,
          settings,
          exportedAt: new Date().toISOString(),
          version: '1.0',
          type: 'auto-backup',
        };

        await this.backupToStorage(backupData);
        await AsyncStorage.setItem(lastBackupKey, now.toString());
        console.log('Auto-backup completed');
      }
    } catch (error) {
      console.error('Auto-backup failed:', error);
    }
  }

  // Email report functionality
  static async requestEmailReport({ from, to, toEmail }: { from: string; to: string; toEmail: string }) {
    try {
      const session = await this.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/email-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, toEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email report');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Offline-aware methods with queue support
  static async addEntryWithOfflineSupport(entryData: { work_date: string; start_time: string; end_time?: string }) {
    try {
      const result = await this.addEntry({
        work_date: entryData.work_date,
        start_time: entryData.start_time,
        end_time: entryData.end_time || null,
      });
      // Clear cache for the month to force refresh
      const session = await this.getSession();
      if (session?.user) {
        const date = new Date(entryData.work_date);
        const ym = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        await cache.jdel(cacheKeys.monthEntries(session.user.id, ym));
      }
      return result;
    } catch (error: any) {
      // Check if it's a network error
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        console.log('Network error detected, queuing add operation');
        const queueId = `add_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await OfflineQueue.enqueue({
          id: queueId,
          op: 'add',
          payload: entryData,
        });
        
        // Return a temporary entry for optimistic UI
        return {
          id: queueId,
          user_id: 'temp',
          work_date: entryData.work_date,
          start_time: entryData.start_time,
          end_time: entryData.end_time || null,
          total_minutes: entryData.end_time ? this.calculateTotalMinutes(entryData.start_time, entryData.end_time) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      throw error;
    }
  }

  static async updateEntryWithOfflineSupport(id: string, updates: { work_date?: string; start_time?: string; end_time?: string }) {
    try {
      const result = await this.updateEntry(id, updates);
      // Clear cache for the month to force refresh
      const session = await this.getSession();
      if (session?.user && updates.work_date) {
        const date = new Date(updates.work_date);
        const ym = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        await cache.jdel(cacheKeys.monthEntries(session.user.id, ym));
      }
      return result;
    } catch (error: any) {
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        console.log('Network error detected, queuing update operation');
        await OfflineQueue.enqueue({
          id: `update_${id}_${Date.now()}`,
          op: 'update',
          payload: { id, updates },
        });
        throw new Error('Update queued for when online');
      }
      throw error;
    }
  }

  static async deleteEntryWithOfflineSupport(id: string) {
    try {
      const result = await this.deleteEntry(id);
      // Clear all month caches to force refresh
      const session = await this.getSession();
      if (session?.user) {
        const keys = await AsyncStorage.getAllKeys();
        const userEntryKeys = keys.filter(key => key.startsWith(`ts:entries:${session.user.id}:`));
        await Promise.all(userEntryKeys.map(key => AsyncStorage.removeItem(key)));
      }
      return result;
    } catch (error: any) {
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        console.log('Network error detected, queuing delete operation');
        await OfflineQueue.enqueue({
          id: `delete_${id}_${Date.now()}`,
          op: 'delete',
          payload: { id },
        });
        throw new Error('Delete queued for when online');
      }
      throw error;
    }
  }

  private static calculateTotalMinutes(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    let totalMinutes = endMinutes - startMinutes;
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    return totalMinutes;
  }

  // Legacy compatibility methods
  static async getEntries(userId: string): Promise<TimeEntry[]> {
    try {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      
      const entries = await this.listEntries(startOfYear, endOfYear);
      return entries.map(this.mapDbEntryToTimeEntry);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async addEntry_legacy(userId: string, entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeEntry> {
    try {
      const dbEntry = await this.addEntry({
        work_date: entry.date,
        start_time: entry.startTime,
        end_time: entry.endTime || '',
      });
      return this.mapDbEntryToTimeEntry(dbEntry as any);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async updateEntry_legacy(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
    try {
      const dbUpdates: any = {};
      if (updates.date) dbUpdates.work_date = updates.date;
      if (updates.startTime) dbUpdates.start_time = updates.startTime;
      if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;

      const dbEntry = await this.updateEntry(id, dbUpdates);
      return this.mapDbEntryToTimeEntry(dbEntry as any);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async getSettings_legacy(userId: string): Promise<AppSettings | null> {
    try {
      const settings = await this.getSettings();
      if (!settings) return null;
      return this.mapDbSettingsToAppSettings(settings);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async saveSettings_legacy(userId: string, settings: AppSettings): Promise<AppSettings> {
    try {
      const dbSettings = await this.upsertSettings({
        rollover_day: settings.rolloverDay,
        rollover_hour: 0,
        rounding: settings.roundingRule === 'none' ? 'none' : settings.roundingRule.replace('min', '') as '5' | '10' | '15',
        language: settings.language,
      });
      return this.mapDbSettingsToAppSettings(dbSettings);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async createBackup(userId: string): Promise<string> {
    try {
      const [entries, settings] = await Promise.all([
        this.getEntries(userId),
        this.getSettings_legacy(userId),
      ]);

      const backupData = {
        entries,
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      await this.backupToStorage(backupData);
      return `backup_${userId}_${Date.now()}.json`;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Helper methods
  private static mapDbEntryToTimeEntry(dbEntry: Entry): TimeEntry {
    return {
      id: dbEntry.id,
      date: dbEntry.work_date,
      startTime: dbEntry.start_time,
      endTime: dbEntry.end_time || undefined,
      totalHours: dbEntry.total_minutes ? dbEntry.total_minutes / 60 : 0,
      createdAt: dbEntry.created_at,
      updatedAt: dbEntry.updated_at,
    };
  }

  private static mapDbSettingsToAppSettings(dbSettings: Settings): AppSettings {
    const roundingMap: Record<string, 'none' | '5min' | '10min' | '15min'> = {
      'none': 'none',
      '5': '5min',
      '10': '10min',
      '15': '15min',
    };

    return {
      rolloverDay: dbSettings.rollover_day,
      roundingRule: roundingMap[dbSettings.rounding] || 'none',
      language: dbSettings.language,
      userId: dbSettings.user_id,
    };
  }
}

// Export individual functions for easier use
export const {
  listEntriesForMonth,
  addEntry,
  updateEntry,
  deleteEntry,
} = SupabaseService;