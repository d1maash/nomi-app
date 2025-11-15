import { MonoIcon } from '@/components/ui/mono-icon';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/constants/categories';
import { darkTheme } from '@/styles/theme';
import { TransactionCategory } from '@/types';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Animated, {
  FadeInUp,
  Layout,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { TactilePressable } from '@/components/ui/tactile-pressable';

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
            {categories.map((category, index) => {
                const isAllOption = category === 'all';
                const isSelected = selected === category;
                const label = isAllOption ? allLabel : CATEGORY_LABELS[category];
                const iconName = isAllOption ? 'grid' : CATEGORY_ICONS[category];

                return (
                    <Animated.View
                        key={category}
                        entering={FadeInUp.delay(index * 40)}
                        layout={Layout.springify()}
                        style={styles.itemWrapper}
                    >
                        <CategoryPill
                            category={category}
                            iconName={iconName}
                            isSelected={isSelected}
                            label={label}
                            onPress={() => onSelect(category)}
                        />
                    </Animated.View>
                );
            })}
        </ScrollView>
    );
};

type CategoryPillProps = {
    category: CategorySelectorValue;
    iconName: string;
    label: string;
    isSelected: boolean;
    onPress: () => void;
};

const CategoryPill: React.FC<CategoryPillProps> = ({
    category,
    iconName,
    label,
    isSelected,
    onPress,
}) => {
    const focus = useSharedValue(isSelected ? 1 : 0);
    const isIncome = category === 'income';

    useEffect(() => {
        focus.value = withTiming(isSelected ? 1 : 0, { duration: 220 });
    }, [focus, isSelected]);

    const selectedBackground = isIncome
        ? darkTheme.colors.accent
        : darkTheme.colors.surfaceLight;
    const defaultBackground = darkTheme.colors.surface;

    const animatedItemStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(focus.value, [0, 1], [defaultBackground, selectedBackground]),
        borderColor: interpolateColor(
            focus.value,
            [0, 1],
            [darkTheme.colors.cardBorder, darkTheme.colors.accent]
        ),
        shadowOpacity: 0.25 * focus.value,
        shadowRadius: 18 * focus.value,
        shadowOffset: { width: 0, height: 8 * focus.value },
        transform: [{ translateY: -3 * focus.value }],
    }));

    const iconDefaultBackground = darkTheme.colors.surfaceLight;
    const iconSelectedBackground = isIncome
        ? darkTheme.colors.accent
        : darkTheme.colors.surfaceElevated;

    const animatedIconStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            focus.value,
            [0, 1],
            [iconDefaultBackground, iconSelectedBackground]
        ),
        borderColor: interpolateColor(
            focus.value,
            [0, 1],
            [darkTheme.colors.cardBorder, 'transparent']
        ),
    }));

    const iconColor = isIncome && isSelected ? darkTheme.colors.background : darkTheme.colors.accent;

    return (
        <TactilePressable
            onPress={onPress}
            activeScale={0.94}
            style={[styles.item, animatedItemStyle]}
        >
            <Animated.View style={[styles.iconBadge, animatedIconStyle]}
            >
                <MonoIcon name={iconName} size={20} color={iconColor} />
            </Animated.View>
            <Text
                style={[
                    styles.label,
                    isSelected && styles.labelSelected,
                    isIncome && isSelected && styles.labelInverted,
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </TactilePressable>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: darkTheme.spacing.lg,
        paddingVertical: darkTheme.spacing.sm,
    },
    itemWrapper: {
        marginRight: darkTheme.spacing.sm,
    },
    item: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: darkTheme.spacing.sm,
        paddingVertical: darkTheme.spacing.xs,
        borderRadius: darkTheme.borderRadius.full,
        backgroundColor: darkTheme.colors.surface,
        width: 88,
        height: 62,
        borderWidth: 1,
        borderColor: darkTheme.colors.cardBorder,
        gap: 4,
        overflow: 'hidden',
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
    labelInverted: {
        color: darkTheme.colors.background,
    },
});
