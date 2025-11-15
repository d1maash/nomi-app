import { MonoIcon } from '@/components/ui/mono-icon';
import { useAuth } from '@/hooks/use-auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { darkTheme } from '@/styles/theme';
import type { MonoIconName } from '@/types/icon';
import { triggerHaptic } from '@/utils/haptics';
import { PlatformPressable } from '@react-navigation/elements';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

export default function TabsLayout() {
    const { user, loading: authLoading } = useAuth();
    const supabaseConfigured = isSupabaseConfigured();

    // Состояние загрузки
    const isLoaded = !authLoading;

    // Пользователь залогинен, если есть user
    const isSignedIn = Boolean(user);

    console.log('[TabsLayout] State:', {
        isLoaded,
        isSignedIn,
        userId: user?.id,
        supabaseConfigured,
    });

    // Анимация индикатора будет управляться через CustomTabBar на основе state.index

    // Перенаправляем на авторизацию, если не залогинен (только если Supabase настроен)
    if (isLoaded && !isSignedIn && supabaseConfigured) {
        console.log('[TabsLayout] User not signed in, redirecting to /auth');
        return <Redirect href="/auth" />;
    }

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: darkTheme.colors.accent,
                tabBarInactiveTintColor: darkTheme.colors.textSecondary,
                tabBarHideOnKeyboard: true,
                tabBarShowLabel: false,
                headerStyle: {
                    backgroundColor: darkTheme.colors.background,
                },
                headerTintColor: darkTheme.colors.text,
                headerShadowVisible: false,
                tabBarItemStyle: {
                    marginVertical: 8,
                    paddingVertical: 8,
                },
                tabBarStyle: styles.tabBar,
                tabBarButton: (props) => (
                    <PlatformPressable
                        {...props}
                        onPressIn={(ev) => {
                            triggerHaptic.selection();
                            props.onPressIn?.(ev);
                        }}
                    />
                ),
            }}
            tabBar={(props) => (
                <CustomTabBar
                    {...props}
                />
            )}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Главная',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon
                            name="home"
                            color={color}
                            focused={focused}
                        />
                    ),
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: 'Транзакции',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon
                            name="list"
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="budgets"
                options={{
                    title: 'Бюджеты',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon
                            name="chart"
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="insights"
                options={{
                    title: 'Инсайты',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon
                            name="bulb"
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Настройки',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon
                            name="settings"
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

// Кастомный TabBar с анимированным индикатором
function CustomTabBar({ state, descriptors, navigation }: any) {
    const tabPositions = useRef<number[]>([]);
    const tabWidths = useRef<number[]>([]);
    const currentActiveIndex = useSharedValue(state.index);
    const allPositionsReady = useRef(false);

    // Анимируем индикатор при изменении активного таба
    useEffect(() => {
        if (allPositionsReady.current) {
            currentActiveIndex.value = withTiming(state.index, {
                duration: 300,
                easing: Easing.out(Easing.cubic),
            });
        } else {
            currentActiveIndex.value = state.index;
        }
    }, [state.index, currentActiveIndex]);

    // Проверяем, готовы ли все позиции
    useEffect(() => {
        const allReady = tabPositions.current.length === state.routes.length &&
            tabPositions.current.every((pos, idx) =>
                idx < state.routes.length && pos !== undefined && pos !== null
            );
        if (allReady && !allPositionsReady.current) {
            allPositionsReady.current = true;
            // Устанавливаем начальную позицию без анимации
            currentActiveIndex.value = state.index;
        }
    }, [state.routes.length, currentActiveIndex, state.index]);

    const indicatorStyle = useAnimatedStyle(() => {
        if (!allPositionsReady.current) {
            return {
                opacity: 0,
            };
        }

        const currentIndex = currentActiveIndex.value;
        const prevIndex = Math.floor(currentIndex);
        const nextIndex = Math.ceil(currentIndex);
        const progress = currentIndex - prevIndex;

        // Интерполируем позицию между текущим и следующим табом
        const prevPosition = tabPositions.current[prevIndex] ?? 0;
        const nextPosition = tabPositions.current[nextIndex] ?? prevPosition;
        const position = prevPosition + (nextPosition - prevPosition) * progress;

        // Интерполируем ширину между текущим и следующим табом
        const prevWidth = tabWidths.current[prevIndex] ?? 20;
        const nextWidth = tabWidths.current[nextIndex] ?? prevWidth;
        const width = prevWidth + (nextWidth - prevWidth) * progress;

        return {
            opacity: 1,
            transform: [{ translateX: position }],
            width: width,
        };
    });

    return (
        <View style={styles.tabBarContainer}>
            <View style={styles.tabBar}>
                {state.routes.map((route: any, index: number) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <PlatformPressable
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={(e) => {
                                triggerHaptic.selection();
                                onPress();
                            }}
                            onLongPress={onLongPress}
                            onLayout={(event) => {
                                const { width, x } = event.nativeEvent.layout;
                                tabWidths.current[index] = width;
                                tabPositions.current[index] = x;
                                // Принудительно обновляем индикатор после получения позиций
                                if (allPositionsReady.current && index === state.index) {
                                    currentActiveIndex.value = state.index;
                                }
                            }}
                            style={styles.tabButton}
                        >
                            {options.tabBarIcon &&
                                options.tabBarIcon({
                                    focused: isFocused,
                                    color: isFocused
                                        ? darkTheme.colors.accent
                                        : darkTheme.colors.textSecondary,
                                    size: 22,
                                })}
                        </PlatformPressable>
                    );
                })}
                <Animated.View style={[styles.focusDotIndicator, indicatorStyle]} />
            </View>
        </View>
    );
}

type TabIconProps = {
    name: string;
    color: string;
    focused: boolean;
    badgeCount?: number;
};

function TabIcon({ name, color, focused, badgeCount }: TabIconProps) {
    const icons: Record<string, MonoIconName> = {
        home: 'home',
        list: 'list',
        chart: 'bar-chart-2',
        bulb: 'sun',
        settings: 'sliders',
    };

    const focusProgress = useSharedValue(focused ? 1 : 0);

    useEffect(() => {
        focusProgress.value = withSpring(focused ? 1 : 0, {
            damping: 15,
            stiffness: 200,
            mass: 0.8,
        });
    }, [focusProgress, focused]);


    const animatedContainer = useAnimatedStyle(() => {
        const translateY = interpolate(
            focusProgress.value,
            [0, 1],
            [2, -2]
        );

        const opacity = interpolate(
            focusProgress.value,
            [0, 1],
            [0.5, 1]
        );

        return {
            transform: [
                { translateY },
            ],
            opacity,
        };
    });

    const iconBackgroundStyle = useAnimatedStyle(() => {
        const bgOpacity = interpolate(
            focusProgress.value,
            [0, 1],
            [0.04, 0.12]
        );

        const borderOpacity = interpolate(
            focusProgress.value,
            [0, 1],
            [0.08, 0.20]
        );

        return {
            backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
            borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
            width: 46,
            height: 46,
        };
    });

    const badgeStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            focusProgress.value,
            [0, 1],
            [0, 1]
        );

        return {
            opacity: scale,
            transform: [
                { scale: 0.8 + scale * 0.2 },
                { translateY: (1 - scale) * 4 },
            ],
        };
    });

    const iconStyle = useAnimatedStyle(() => {
        // Убрана анимация активации (scale-up и свечение)
        return {};
    });

    const badgeOpacity = useSharedValue(badgeCount && badgeCount > 0 ? 1 : 0);

    useEffect(() => {
        if (badgeCount && badgeCount > 0) {
            badgeOpacity.value = withSpring(1, {
                damping: 12,
                stiffness: 300,
            });
        } else {
            badgeOpacity.value = withSpring(0, {
                damping: 12,
                stiffness: 300,
            });
        }
    }, [badgeCount, badgeOpacity]);

    const badgeAnimatedStyle = useAnimatedStyle(() => ({
        opacity: badgeOpacity.value,
        transform: [
            { scale: badgeOpacity.value },
            { translateY: (1 - badgeOpacity.value) * 8 },
        ],
    }));

    return (
        <Animated.View style={[styles.iconWrapper, animatedContainer]}>
            <Animated.View style={[styles.iconBackground, iconBackgroundStyle]}>
                <Animated.View style={[iconStyle, styles.iconContainer]}>
                    <MonoIcon
                        name={icons[name] ?? 'circle'}
                        color={color}
                        size={22}
                    />
                </Animated.View>
                {badgeCount !== undefined && badgeCount > 0 && (
                    <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
                        <Text style={styles.badgeText}>
                            {badgeCount > 99 ? '99+' : badgeCount}
                        </Text>
                    </Animated.View>
                )}
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: Platform.select({
            ios: 'rgba(5, 5, 5, 0.75)',
            default: 'rgba(5, 5, 5, 0.95)',
        }),
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 24,
        height: 72,
        paddingBottom: Platform.select({
            ios: 20,
            default: 18,
        }),
        paddingTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 28,
        elevation: 12,
        overflow: 'visible',
        position: 'relative',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    focusDotIndicator: {
        position: 'absolute',
        bottom: Platform.select({
            ios: 20,
            default: 18,
        }),
        left: 0,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: darkTheme.colors.accent,
        shadowColor: darkTheme.colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 2,
        minWidth: 20,
    },
    iconWrapper: {
        padding: 8,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 50,
        minHeight: 50,
    },
    iconBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        width: 46,
        height: 46,
        marginTop: 0,
        position: 'relative',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        marginTop: -2,
    },
    focusDot: {
        position: 'absolute',
        bottom: 2,
        width: 20,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: darkTheme.colors.accent,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#FF3B30',
        borderWidth: 2,
        borderColor: darkTheme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        lineHeight: 12,
    },
});
