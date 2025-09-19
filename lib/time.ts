import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TZ = 'Europe/Copenhagen';

export const nowZoned = () => toZonedTime(new Date(), TZ);
export const toYMD = (d: Date) => format(toZonedTime(d, TZ), 'yyyy-MM-dd');
export const toHM = (d: Date) => format(toZonedTime(d, TZ), 'HH:mm');

// Helper to convert HH:mm to minutes
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper to convert minutes to HH:mm
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Round time to nearest step (5, 10, 15 minutes)
export const roundTo = (minutes: number, step: 0 | 5 | 10 | 15): number => {
  if (!step) return minutes;
  return Math.round(minutes / step) * step;
};

// Round time string to nearest step
export const roundTimeString = (time: string, step: 0 | 5 | 10 | 15): string => {
  if (!step) return time;
  const minutes = timeToMinutes(time);
  const rounded = roundTo(minutes, step);
  return minutesToTime(rounded);
};