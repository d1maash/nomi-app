import { format, formatDistance as formatDistanceFns, formatRelative } from 'date-fns';
import { ru } from 'date-fns/locale';

export const formatCurrency = (amount: number, currency: string = 'KZT'): string => {
  const symbol = currency === 'KZT' ? '₸' : currency;
  return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${symbol}`;
};

export const formatDate = (date: Date | string, pattern: string = 'dd MMM yyyy'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, pattern, { locale: ru });
};

export const formatRelativeDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatRelative(dateObj, new Date(), { locale: ru });
};

export const formatDistanceToNow = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceFns(dateObj, new Date(), { locale: ru, addSuffix: true });
};

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(0)}%`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

