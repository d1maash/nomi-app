import { TransactionCategory } from '@/types';
import type { MonoIconName } from '@/types/icon';

export const CATEGORY_ICONS: Record<TransactionCategory, MonoIconName> = {
  food: 'pie-chart',
  transport: 'navigation',
  shopping: 'shopping-bag',
  entertainment: 'film',
  utilities: 'tool',
  healthcare: 'heart',
  education: 'book',
  gifts: 'gift',
  coffee: 'coffee',
  subscriptions: 'refresh-ccw',
  income: 'trending-up',
  other: 'layers',
};

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  food: 'Еда',
  transport: 'Транспорт',
  shopping: 'Покупки',
  entertainment: 'Развлечения',
  utilities: 'Коммуналка',
  healthcare: 'Здоровье',
  education: 'Образование',
  gifts: 'Подарки',
  coffee: 'Кофе',
  subscriptions: 'Подписки',
  income: 'Доход',
  other: 'Другое',
};

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  food: '#F7F7F7',
  transport: '#E4E4E4',
  shopping: '#D2D2D2',
  entertainment: '#C0C0C0',
  utilities: '#AEAEAE',
  healthcare: '#9C9C9C',
  education: '#8A8A8A',
  gifts: '#787878',
  coffee: '#666666',
  subscriptions: '#545454',
  income: '#424242',
  other: '#303030',
};

