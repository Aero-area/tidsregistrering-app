export const formatTime = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}t ${m}m`;
};

export const formatTimeHHMM = (time: string): string => {
  return time;
};

export const getCurrentTime = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export const formatDate = (dateString: string, locale: string = 'da-DK'): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return locale === 'da-DK' ? 'I dag' : 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return locale === 'da-DK' ? 'I går' : 'Yesterday';
  } else {
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }
};

export const calculateWorkingTime = (startTime: string): string => {
  const now = new Date();
  const [startHour, startMin] = startTime.split(':').map(Number);
  
  const startDate = new Date();
  startDate.setHours(startHour, startMin, 0, 0);
  
  const diffMs = now.getTime() - startDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return formatTime(diffHours);
};