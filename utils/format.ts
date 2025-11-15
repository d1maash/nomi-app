import { format, formatDistance as formatDistanceFns, formatRelative, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export const formatCurrency = (amount: number, currency: string = 'KZT'): string => {
  const symbol = currency === 'KZT' ? '₸' : currency;
  return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${symbol}`;
};

/**
 * Парсит дату, корректно обрабатывая ISO строки без сдвига часового пояса
 */
export const parseDate = (date: Date | string): Date => {
  if (date instanceof Date) {
    return date;
  }
  
  // Если это ISO строка (например, из Supabase)
  if (typeof date === 'string') {
    // Если строка содержит время с 'T' или 'Z', извлекаем только дату
    if (date.includes('T') || date.includes('Z')) {
      // Берем только часть даты до 'T' (например, "2024-11-14" из "2024-11-14T18:00:00Z")
      const datePart = date.split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    // Иначе это просто дата в формате YYYY-MM-DD, создаем локальную дату
    const parts = date.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }
  
  return new Date(date);
};

/**
 * Конвертирует дату в строку формата YYYY-MM-DD для сохранения в базу данных
 * Это гарантирует, что дата сохраняется без учета часового пояса
 */
export const formatDateForDB = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDate = (date: Date | string, pattern: string = 'dd MMM yyyy'): string => {
  const dateObj = parseDate(date);
  return format(dateObj, pattern, { locale: ru });
};

export const formatRelativeDate = (date: Date | string): string => {
  const dateObj = parseDate(date);
  return formatRelative(dateObj, new Date(), { locale: ru });
};

export const formatDistanceToNow = (date: Date | string): string => {
  const dateObj = parseDate(date);
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

