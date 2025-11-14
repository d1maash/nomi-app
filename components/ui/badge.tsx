import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { darkTheme } from '@/styles/theme';

interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  style,
}) => {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: darkTheme.spacing.sm,
    paddingVertical: darkTheme.spacing.xs,
    borderRadius: darkTheme.borderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
  },
  default: {
    backgroundColor: darkTheme.colors.surfaceLight,
  },
  success: {
    backgroundColor: `${darkTheme.colors.success}20`,
    borderColor: `${darkTheme.colors.success}40`,
  },
  warning: {
    backgroundColor: `${darkTheme.colors.warning}20`,
    borderColor: `${darkTheme.colors.warning}40`,
  },
  error: {
    backgroundColor: `${darkTheme.colors.error}20`,
    borderColor: `${darkTheme.colors.error}40`,
  },
  text: {
    ...darkTheme.typography.caption,
    fontWeight: '600',
  },
  text_default: {
    color: darkTheme.colors.textSecondary,
  },
  text_success: {
    color: darkTheme.colors.success,
  },
  text_warning: {
    color: darkTheme.colors.warning,
  },
  text_error: {
    color: darkTheme.colors.error,
  },
});
