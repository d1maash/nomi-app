import { MonoIcon } from '@/components/ui/mono-icon';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/constants/categories';
import { darkTheme } from '@/styles/theme';
import { TransactionCategory } from '@/types';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
                    <View
                        style={[
                            styles.iconBadge,
                            {
                                backgroundColor:
                                    category === 'income' && selected
                                        ? darkTheme.colors.accent
                                        : selected
                                            ? darkTheme.colors.surfaceLight
                                            : darkTheme.colors.surface,
                                borderColor: selected
                                    ? darkTheme.colors.accent
                                    : darkTheme.colors.cardBorder,
                            },
                        ]}
                    >
                        <MonoIcon
                            name={CATEGORY_ICONS[category]}
                            size={18}
                            color={darkTheme.colors.accent}
                        />
                    </View>
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
