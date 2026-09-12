/**
 * Date Filtering Utilities for Admin Panel
 * Supports Today, Yesterday, This Week, This Month, All Time, and Calendar Date Picker.
 */

export type AdminTimeframe = 'all' | 'today' | 'yesterday' | 'weekly' | 'monthly' | 'custom' | '7d' | '30d';

export const getLocalDateStr = (dateInput?: string | Date): string => {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    const match = String(dateInput).match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    return '';
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDateStr = (): string => getLocalDateStr(new Date());

export const getYesterdayDateStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateStr(d);
};

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const isDateMatch = (
  dateInput: string | Date | undefined,
  timeframe: AdminTimeframe,
  customDate?: string
): boolean => {
  if (timeframe === 'all') return true;
  if (!dateInput) return false;

  const itemDateStr = getLocalDateStr(dateInput);
  const todayStr = getTodayDateStr();
  const yesterdayStr = getYesterdayDateStr();

  if (timeframe === 'custom') {
    if (!customDate) return true;
    return itemDateStr === customDate;
  }

  if (timeframe === 'today') {
    return itemDateStr === todayStr;
  }

  if (timeframe === 'yesterday') {
    return itemDateStr === yesterdayStr;
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return true;
  const now = new Date();
  const diffDays = Math.ceil((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (timeframe === 'weekly' || timeframe === '7d') {
    return diffDays >= 0 && diffDays <= 7;
  }

  if (timeframe === 'monthly' || timeframe === '30d') {
    return diffDays >= 0 && diffDays <= 30;
  }

  return true;
};
