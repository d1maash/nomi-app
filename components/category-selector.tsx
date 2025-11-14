import { MonoIcon } from '@/components/ui/mono-icon';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/constants/categories';
import { darkTheme } from '@/styles/theme';
import { TransactionCategory } from '@/types';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CategorySelectorValue = TransactionCategory | 'all';

interface CategorySelectorProps {
    selected: CategorySelectorValue;
    onSelect: (category: CategorySelectorValue) => void;
    exclude?: TransactionCategory[];
    showAllOption?: boolean;
    allLabel?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
    selected,
    onSelect,
    exclude = [],
    showAllOption = false,
    allLabel = 'Все',
}) => {
    const baseCategories = (Object.keys(CATEGORY_ICONS) as TransactionCategory[]).filter(
        (cat) => !exclude.includes(cat)
    );
    const categories: CategorySelectorValue[] = showAllOption
        ? (['all', ...baseCategories] as CategorySelectorValue[])
        : baseCategories;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {categories.map((category) => {
                const isAllOption = category === 'all';
                const isSelected = selected === category;
                const label = isAllOption ? allLabel : CATEGORY_LABELS[category];
                const iconName = isAllOption ? 'grid' : CATEGORY_ICONS[category];

                const backgroundColor =
                    category === 'income' && isSelected
                        ? darkTheme.colors.accent
                        : isSelected
                            ? darkTheme.colors.surfaceLight
                            : darkTheme.colors.surface;
                const borderColor = isSelected ? darkTheme.colors.accent : darkTheme.colors.cardBorder;
                const iconColor =
                    category === 'income' && isSelected
                        ? darkTheme.colors.background
                        : darkTheme.colors.accent;

                return (
                    <TouchableOpacity
                        key={category}
                        style={[styles.item, isSelected && styles.itemSelected]}
                        onPress={() => onSelect(category)}
                        activeOpacity={0.7}
                    >
                        <View
                            style={[
                                styles.iconBadge,
                                {
                                    backgroundColor,
                                    borderColor: isSelected ? 'transparent' : borderColor,
                                },
                            ]}
                        >
                            <MonoIcon name={iconName} size={20} color={iconColor} />
                        </View>
                        <Text
                            style={[styles.label, isSelected && styles.labelSelected]}
                            numberOfLines={1}
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
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
        paddingHorizontal: darkTheme.spacing.sm,
        paddingVertical: darkTheme.spacing.xs,
        marginRight: darkTheme.spacing.sm,
        borderRadius: darkTheme.borderRadius.full,
        backgroundColor: darkTheme.colors.surface,
        width: 88,
        height: 62,
        borderWidth: 1,
        borderColor: darkTheme.colors.cardBorder,
        gap: 4,
    },
    itemSelected: {
        borderColor: darkTheme.colors.accent,
    },
    iconBadge: {
        width: 32,
        height: 32,
        borderRadius: darkTheme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    label: {
        ...darkTheme.typography.caption,
        color: darkTheme.colors.textSecondary,
    },
    labelSelected: {
        color: darkTheme.colors.text,
        fontWeight: '600',
    },
});
