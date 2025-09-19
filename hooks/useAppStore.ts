import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppSettings, TimeEntry } from '@/types';
import { translations } from '@/constants/translations';
import { SupabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { OfflineQueue } from '@/lib/offlineQueue';
import { AppState } from 'react-native';

const defaultSettings: AppSettings = {
  rolloverDay: 1,
  roundingRule: 'none',
  language: 'da',
};

export const [AppStoreProvider, useAppStore] = createContextHook(() => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const [entriesData, settingsData] = await Promise.all([
        SupabaseService.getEntries(userId),
        SupabaseService.getSettings_legacy(userId),
      ]);

      setEntries(entriesData);
      setSettings(settingsData || defaultSettings);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    const timeoutId = setTimeout(() => {
      console.warn('App initialization timeout - setting ready=true');
      setIsLoading(false);
    }, 5000); // 5 second timeout
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        setIsAuthenticated(true);
        
        // Ensure profile exists
        await SupabaseService.ensureProfile();
        
        // Load user data with cache hydration
        await loadUserData(session.user.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [loadUserData]);

  // Load data on mount and listen to auth changes
  useEffect(() => {
    loadData();
    
    // Start offline queue network listener
    const unsubscribeNetworkListener = OfflineQueue.startNetworkListener();
    
    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        setIsAuthenticated(true);
        await loadUserData(session.user.id);
        
        // Check for auto-backup when user logs in
        SupabaseService.checkAndPerformAutoBackup();
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setEntries([]);
        setSettings(defaultSettings);
      }
      setIsLoading(false);
    });

    // Listen to app state changes for auto-backup
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // App came to foreground, check for auto-backup
        SupabaseService.checkAndPerformAutoBackup();
        // Process any queued operations
        OfflineQueue.processQueue();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.unsubscribe();
      unsubscribeNetworkListener();
      appStateSubscription?.remove();
    };
  }, [loadData, loadUserData, isAuthenticated]);





  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      const savedSettings = await SupabaseService.saveSettings_legacy(user.id, newSettings);
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }, [user?.id]);

  const addEntry = useCallback(async (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      const newEntry = await SupabaseService.addEntry_legacy(user.id, entry);
      setEntries(prev => [...prev, newEntry]);
      return newEntry;
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  }, [user?.id]);

  const updateEntry = useCallback(async (id: string, updates: Partial<TimeEntry>) => {
    try {
      const updatedEntry = await SupabaseService.updateEntry_legacy(id, updates);
      setEntries(prev => prev.map(entry => 
        entry.id === id ? updatedEntry : entry
      ));
      return updatedEntry;
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await SupabaseService.deleteEntry(id);
      setEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }, []);

  const getCurrentPeriod = useCallback(() => {
    const now = new Date();
    const rolloverDay = settings.rolloverDay;
    
    let startDate: Date;
    let endDate: Date;

    if (now.getDate() >= rolloverDay) {
      // Current month rollover hasn't passed
      startDate = new Date(now.getFullYear(), now.getMonth(), rolloverDay);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, rolloverDay - 1);
    } else {
      // Current month rollover has passed
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, rolloverDay);
      endDate = new Date(now.getFullYear(), now.getMonth(), rolloverDay - 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      label: `${startDate.toLocaleDateString('da-DK')} – ${endDate.toLocaleDateString('da-DK')}`,
    };
  }, [settings.rolloverDay]);

  const getTodayEntry = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return entries.find(entry => entry.date === today);
  }, [entries]);

  const roundTime = useCallback((minutes: number): number => {
    const { roundingRule } = settings;
    
    switch (roundingRule) {
      case '5min':
        return Math.round(minutes / 5) * 5;
      case '10min':
        return Math.round(minutes / 10) * 10;
      case '15min':
        return Math.round(minutes / 15) * 15;
      default:
        return minutes;
    }
  }, [settings]);

  const calculateTotalHours = useCallback((startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let totalMinutes = endMinutes - startMinutes;
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight work
    
    const roundedMinutes = roundTime(totalMinutes);
    return roundedMinutes / 60;
  }, [roundTime]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await SupabaseService.signInWithEmail(email, password);
      // User will be automatically signed in via auth state change listener
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await SupabaseService.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setEntries([]);
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await SupabaseService.signUpWithEmail(email, password);
      
      // Ensure profile is created after signup
      if (result.user) {
        await SupabaseService.ensureProfile();
      }
      
      // User will be automatically signed in via auth state change listener
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBackup = useCallback(async () => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      const fileName = await SupabaseService.createBackup(user.id);
      return fileName;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }, [user?.id]);

  const reloadMonth = useCallback(async () => {
    try {
      if (!user?.id) return;
      const entriesData = await SupabaseService.getEntries(user.id);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error reloading month:', error);
    }
  }, [user?.id]);

  const stampToggle = useCallback(async () => {
    try {
      const result = await SupabaseService.stampToggle();
      const mappedEntry = {
        id: result.entry.id,
        date: result.entry.work_date,
        startTime: result.entry.start_time,
        endTime: result.entry.end_time || undefined,
        totalHours: result.entry.total_minutes ? result.entry.total_minutes / 60 : 0,
        createdAt: result.entry.created_at,
        updatedAt: result.entry.updated_at,
      };
      
      // Update local state
      setEntries(prev => {
        const existingIndex = prev.findIndex(entry => entry.id === mappedEntry.id);
        if (existingIndex >= 0) {
          const newEntries = [...prev];
          newEntries[existingIndex] = mappedEntry;
          return newEntries;
        } else {
          return [mappedEntry, ...prev];
        }
      });
      
      return { entry: mappedEntry, message: result.message };
    } catch (error) {
      console.error('Error toggling stamp:', error);
      throw error;
    }
  }, []);

  const t = useCallback((key: keyof typeof translations.da): string => {
    return translations[settings.language][key] || translations.da[key];
  }, [settings.language]);

  return useMemo(() => ({
    entries,
    settings,
    isLoading,
    isAuthenticated,
    user,
    addEntry,
    updateEntry,
    deleteEntry,
    saveSettings,
    getCurrentPeriod,
    getTodayEntry,
    calculateTotalHours,
    login,
    logout,
    signUp,
    createBackup,
    stampToggle,
    reloadMonth,
    t,
  }), [
    entries,
    settings,
    isLoading,
    isAuthenticated,
    user,
    addEntry,
    updateEntry,
    deleteEntry,
    saveSettings,
    getCurrentPeriod,
    getTodayEntry,
    calculateTotalHours,
    login,
    logout,
    signUp,
    createBackup,
    stampToggle,
    reloadMonth,
    t,
  ]);
});