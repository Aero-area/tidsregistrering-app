import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';


const E2E = process.env.EXPO_PUBLIC_E2E === '1';
type EnvRecord = Record<string, string | undefined>;

const SUPABASE_E2E_DEFAULTS: EnvRecord = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://clpalmprapjflfabrrde.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscGFsbXByYXBqZmxmYWJycmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTM2ODcsImV4cCI6MjA3MTM2OTY4N30.f7sf3PWwG2DWEwTHtEFoJsIOTxQbNuZbDDhIRQGNvwM',
  EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET: 'backups',
};

let cachedStaticEnv: EnvRecord | undefined;

function readStaticConfigEnv(): EnvRecord {
  if (cachedStaticEnv !== undefined) {
    return cachedStaticEnv;
  }

  cachedStaticEnv = {};

  if (typeof document !== 'undefined') {
    const script = document.getElementById('__EXPO_STATIC_CONFIG__');
    const raw = script?.textContent?.trim();

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { expoEnv?: EnvRecord; publicEnv?: EnvRecord };
        cachedStaticEnv = {
          ...(parsed?.expoEnv ?? {}),
          ...(parsed?.publicEnv ?? {}),
        };
      } catch (error) {
        console.warn('Unable to parse Expo static config for env values', error);
      }
    }
  }

  return cachedStaticEnv;
}

function readPublicEnvFromSources(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }

  if (typeof globalThis !== 'undefined') {
    const globalCandidate = globalThis as unknown as EnvRecord & {
      expoEnv?: EnvRecord;
      __EXPO_ENV__?: EnvRecord | { expoEnv?: EnvRecord };
      __EXPO_DYNAMIC_CONFIG__?: { expoEnv?: EnvRecord };
      __EXPO_STATIC_CONFIG__?: { expoEnv?: EnvRecord; publicEnv?: EnvRecord };
    };

    const candidates: Array<EnvRecord | undefined> = [
      globalCandidate.expoEnv,
      typeof globalCandidate.__EXPO_ENV__ === 'object'
        ? ('expoEnv' in (globalCandidate.__EXPO_ENV__ as Record<string, any>)
            ? (globalCandidate.__EXPO_ENV__ as { expoEnv?: EnvRecord }).expoEnv
            : (globalCandidate.__EXPO_ENV__ as EnvRecord))
        : undefined,
      globalCandidate.__EXPO_DYNAMIC_CONFIG__?.expoEnv,
      globalCandidate.__EXPO_STATIC_CONFIG__?.expoEnv,
      globalCandidate.__EXPO_STATIC_CONFIG__?.publicEnv,
    ];

    for (const candidate of candidates) {
      if (candidate && candidate[key] !== undefined) {
        return candidate[key];
      }
    }
  }

  const staticEnv = readStaticConfigEnv();
  if (staticEnv && staticEnv[key] !== undefined) {
    return staticEnv[key];
  }

  return undefined;
}

const rawE2E = readPublicEnvFromSources('EXPO_PUBLIC_E2E');

function readPublicEnv(key: keyof typeof SUPABASE_E2E_DEFAULTS): string | undefined;
function readPublicEnv(key: string): string | undefined;
function readPublicEnv(key: string): string | undefined {
  const value = readPublicEnvFromSources(key);
  if (value !== undefined) {
    return value;
  }

  if (key in SUPABASE_E2E_DEFAULTS && rawE2E === '1') {
    return SUPABASE_E2E_DEFAULTS[key as keyof typeof SUPABASE_E2E_DEFAULTS];
  }

  return undefined;
}
let supabase: any;
export let envOk: boolean;

if (rawE2E === '1') {
  type Row = Record<string, any>;
  const db: Record<string, Row[]> = {
    profiles: [{ id: 'e2e-user', email: 'e2e@example.com' }],
    settings: [{ 
      user_id: 'e2e-user', 
      rollover_day: 1, 
      rollover_hour: 0, 
      rounding: 'none', 
      language: 'da',
      auto_backup: false,
      backup_frequency: 'weekly'
    }],
    entries: [],
  };
  
  // Reset function for tests
  const resetDB = () => {
    db.profiles = [{ id: 'e2e-user', email: 'e2e@example.com' }];
    db.settings = [{ 
      user_id: 'e2e-user', 
      rollover_day: 1, 
      rollover_hour: 0, 
      rounding: 'none', 
      language: 'da',
      auto_backup: false,
      backup_frequency: 'weekly'
    }];
    db.entries = [];
  };
  
  const makeResp = (data: any) => Promise.resolve({ data, error: null });

  const createQueryBuilder = (table: keyof typeof db, initialRows?: Row[]) => {
    let filteredRows = initialRows || [...db[table]];
    let orderBy: { column: string; ascending: boolean } | null = null;
    let limitCount: number | null = null;
    
    const builder = {
      select: (columns?: string) => {
        const result = { ...builder };
        result.then = () => makeResp([...filteredRows]);
        return result;
      },
      
      insert: (r: Row | Row[]) => {
        const arr = Array.isArray(r) ? r : [r];
        const newRows = arr.map(row => ({ ...row, id: row.id || `${Date.now()}-${Math.random()}` }));
        db[table].push(...newRows);
        const result = { ...builder };
        result.select = () => {
          const selectResult = { ...builder };
          selectResult.then = () => makeResp(newRows);
          return selectResult;
        };
        result.then = () => makeResp(newRows);
        return result;
      },
      
      update: (patch: Row) => {
        const result = {
          eq: (k: string, v: any) => {
            const updated = db[table].filter(row => row[k] === v).map(row => ({ ...row, ...patch }));
            db[table] = db[table].map((row) => (row[k] === v ? { ...row, ...patch } : row));
            const eqResult = { ...builder };
            eqResult.select = () => {
              const selectResult = { ...builder };
              selectResult.then = () => makeResp(updated);
              return selectResult;
            };
            eqResult.then = () => makeResp(updated);
            return eqResult;
          },
        };
        return result;
      },
      
      delete: () => {
        const result = {
          eq: (k: string, v: any) => {
            const deleted = db[table].filter(row => row[k] === v);
            db[table] = db[table].filter((row) => row[k] !== v);
            const eqResult = { ...builder };
            eqResult.then = () => makeResp(deleted);
            return eqResult;
          },
        };
        return result;
      },
      
      eq: (k: string, v: any) => {
        const filtered = filteredRows.filter(row => row[k] === v);
        return createQueryBuilder(table, filtered);
      },
      
      gte: (k: string, v: any) => {
        const filtered = filteredRows.filter(row => row[k] >= v);
        return createQueryBuilder(table, filtered);
      },
      
      lte: (k: string, v: any) => {
        const filtered = filteredRows.filter(row => row[k] <= v);
        return createQueryBuilder(table, filtered);
      },
      
      order: (column: string, options?: { ascending?: boolean }) => {
        orderBy = { column, ascending: options?.ascending ?? true };
        const sorted = [...filteredRows].sort((a, b) => {
          const aVal = a[column];
          const bVal = b[column];
          if (aVal < bVal) return orderBy!.ascending ? -1 : 1;
          if (aVal > bVal) return orderBy!.ascending ? 1 : -1;
          return 0;
        });
        return createQueryBuilder(table, sorted);
      },
      
      limit: (count: number) => {
        limitCount = count;
        const limited = filteredRows.slice(0, count);
        return createQueryBuilder(table, limited);
      },
      
      single: () => {
        const result = { ...builder };
        result.then = () => {
          const row = filteredRows[0] || null;
          return makeResp(row);
        };
        return result;
      },
      
      maybeSingle: () => {
        const result = { ...builder };
        result.then = () => {
          const row = filteredRows[0] || null;
          return makeResp(row);
        };
        return result;
      },
      
      then: (resolve?: (value: any) => any, reject?: (reason?: any) => any) => {
        return makeResp([...filteredRows]).then(resolve, reject);
      },
    };
    
    return builder;
  };

  const from = (table: keyof typeof db) => {
    return createQueryBuilder(table);
  };
  
  // Auth state change listeners
  const authListeners: Array<(event: string, session: any) => void> = [];

  supabase = {
    auth: {
      getSession: () => Promise.resolve({ 
        data: { 
          session: { 
            user: { id: 'e2e-user', email: 'e2e@example.com' },
            access_token: 'e2e-token',
            refresh_token: 'e2e-refresh'
          } 
        }, 
        error: null 
      }),
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        authListeners.push(callback);
        // Immediately call with current session
        setTimeout(() => {
          callback('SIGNED_IN', {
            user: { id: 'e2e-user', email: 'e2e@example.com' },
            access_token: 'e2e-token',
            refresh_token: 'e2e-refresh'
          });
        }, 0);
        return {
          data: { subscription: { unsubscribe: () => {} } },
          error: null
        };
      },
    },
    from,
    resetDB, // Expose reset function for tests
  };
  
  // Expose resetDB globally for E2E tests
  if (typeof window !== 'undefined') {
    (window as any).resetDB = resetDB;
  }
  envOk = true;

} else {
  const url  = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const bucket = process.env.EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET;

  envOk = Boolean(url && anon && bucket);

  const storage = Platform.OS === 'web' && typeof window === 'undefined'
    ? {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }
    : AsyncStorage;

  if (envOk) {
    supabase = createClient(url!, anon!, {
      auth: {
        storage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  } else {
    supabase = {} as any;
  }
}

export { supabase };

// Export resetDB function for E2E tests
export const resetDB = () => {
  if (rawE2E === '1' && supabase.resetDB) {
    supabase.resetDB();
  }
};
