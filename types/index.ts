export interface TimeEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime?: string; // HH:MM format
  totalHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  rolloverDay: number; // 1-31
  roundingRule: 'none' | '5min' | '10min' | '15min';
  language: 'da' | 'en';
  userId?: string;
}

export interface TimePeriod {
  startDate: string;
  endDate: string;
  label: string;
}

export type RoundingRule = 'none' | '5min' | '10min' | '15min';
export type Language = 'da' | 'en';