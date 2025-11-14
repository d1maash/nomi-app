import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { darkTheme } from '@/styles/theme';
import { Button } from './button';
import { MonoIcon } from './mono-icon';
import type { MonoIconName } from '@/types/icon';

interface EmptyStateProps {
  iconName?: MonoIconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'inbox',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconBadge}>
        <MonoIcon name={iconName} size={28} color={darkTheme.colors.text} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: darkTheme.spacing.xxl,
    gap: darkTheme.spacing.md,
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: darkTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.colors.surface,
  },
  title: {
    ...darkTheme.typography.h2,
    color: darkTheme.colors.text,
    textAlign: 'center',
  },
  message: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: darkTheme.spacing.lg,
  },
  button: {
    marginTop: darkTheme.spacing.sm,
  },
});
