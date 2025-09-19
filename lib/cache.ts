import AsyncStorage from '@react-native-async-storage/async-storage';

export const cacheKeys = {
  settings: (uid: string) => `ts:settings:${uid}`,
  monthEntries: (uid: string, ym: string) => `ts:entries:${uid}:${ym}`,
};

export const cache = {
  jget: async <T>(k: string): Promise<T | null> => {
    try {
      const v = await AsyncStorage.getItem(k);
      return v ? JSON.parse(v) as T : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },
  jset: async (k: string, v: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(k, JSON.stringify(v));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },
  jdel: async (k: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(k);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },
};