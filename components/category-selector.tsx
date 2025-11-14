import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TransactionCategory } from '@/types';
import { darkTheme } from '@/styles/theme';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/constants/categories';

interface CategorySelectorProps {
  selected: TransactionCategory;
  onSelect: (category: TransactionCategory) => void;
  exclude?: TransactionCategory[];
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selected,
  onSelect,
  exclude = [],
}) => {
  const categories = (Object.keys(CATEGORY_ICONS) as TransactionCategory[]).filter(
    (cat) => !exclude.includes(cat)
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.item,
            selected === category && styles.itemSelected,
          ]}
          onPress={() => onSelect(category)}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{CATEGORY_ICONS[category]}</Text>
          <Text
            style={[
              styles.label,
              selected === category && styles.labelSelected,
            ]}
            numberOfLines={1}
          >
            {CATEGORY_LABELS[category]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: darkTheme.spacing.lg,
    paddingVertical: darkTheme.spacing.sm,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.sm,
    marginRight: darkTheme.spacing.sm,
    borderRadius: darkTheme.borderRadius.full,
    backgroundColor: darkTheme.colors.surface,
    minWidth: 80,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
  },
  itemSelected: {
    backgroundColor: darkTheme.colors.primary,
    borderColor: 'transparent',
  },
  icon: {
    fontSize: 24,
    marginBottom: darkTheme.spacing.xs,
  },
  label: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textSecondary,
  },
  labelSelected: {
    color: darkTheme.colors.background,
    fontWeight: '600',
  },
});
