import { PostgrestSingleResponse, Session } from '@supabase/supabase-js';

const e2eUser = { id: 'e2e-user', email: 'e2e@example.com' };
const e2eSession = { user: e2eUser, access_token: 'e2e-token', refresh_token: 'e2e-refresh', expires_in: 3600, expires_at: 9999999999, token_type: 'bearer' };

let entries: any[] = [];

const from = (tableName: string) => {
  const self = {
    select: () => self,
    insert: (newEntries: any) => {
      entries = [...entries, ...newEntries];
      return self;
    },
    update: (newValues: any) => {
      // Not implemented for now as it is not needed by the tests
      return self;
    },
    delete: () => {
      // Not implemented for now as it is not needed by the tests
      return self;
    },
    eq: (column: string, value: any) => {
      if (tableName === 'entries') {
        // Not implemented for now as it is not needed by the tests
      }
      return self;
    },
    maybeSingle: async () => {
      if (tableName === 'profiles') {
        return { data: { id: e2eUser.id, email: e2eUser.email }, error: null };
      }
      if (tableName === 'settings') {
        return { data: { rollover_day: 1, rollover_hour: 0, rounding: '0', lang: 'da' }, error: null };
      }
      return { data: null, error: null };
    },
  };
  return self;
};

export const supabaseMock = {
  auth: {
    getSession: async () => ({
      data: { session: e2eSession as Session },
      error: null,
    }),
  },
  from,
};
