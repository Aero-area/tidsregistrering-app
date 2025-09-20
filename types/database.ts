export type Entry = {
  id: string;
  user_id: string;
  work_date: string;
  start_time: string;
  end_time?: string | null;
  total_minutes?: number | null;
  created_at: string;
  updated_at: string;
};

export type Settings = {
  user_id: string;
  rollover_day: number;
  rollover_hour: number;
  rounding: 'none' | '5' | '10' | '15';
  language: 'da' | 'en';
  auto_backup: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  updated_at: string;
};

export type Profile = {
  id: string;
  email?: string | null;
  created_at: string;
};