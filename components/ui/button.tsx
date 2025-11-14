import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { darkTheme } from '@/styles/theme';
import { triggerHaptic } from '@/utils/haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
}) => {
  const handlePress = () => {
    triggerHaptic.light();
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? darkTheme.colors.background : darkTheme.colors.text}
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`]]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: darkTheme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: darkTheme.spacing.xl,
    paddingVertical: darkTheme.spacing.md,
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
    borderWidth: 1,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  small: {
    minHeight: 40,
    paddingHorizontal: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.sm,
  },
  medium: {
    minHeight: 48,
  },
  large: {
    minHeight: 56,
    paddingHorizontal: darkTheme.spacing.xxl,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    ...darkTheme.typography.button,
    letterSpacing: 0.3,
  },
  text_primary: {
    color: darkTheme.colors.background,
  },
  text_secondary: {
    color: darkTheme.colors.text,
  },
  text_ghost: {
    color: darkTheme.colors.textTertiary,
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
});
