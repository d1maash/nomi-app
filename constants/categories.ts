import { TransactionCategory } from '@/types';

export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  food: '🍽️',
  transport: '🚗',
  shopping: '🛍️',
  entertainment: '🎬',
  utilities: '💡',
  healthcare: '⚕️',
  education: '📚',
  gifts: '🎁',
  coffee: '☕',
  subscriptions: '📱',
  income: '💰',
  other: '📦',
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
  food: '#FF6B6B',
  transport: '#4ECDC4',
  shopping: '#95E1D3',
  entertainment: '#F38181',
  utilities: '#AA96DA',
  healthcare: '#FCBAD3',
  education: '#FFFFD2',
  gifts: '#A8E6CE',
  coffee: '#C7CEEA',
  subscriptions: '#FFD3B6',
  income: '#90EE90',
  other: '#B8B8B8',
};

