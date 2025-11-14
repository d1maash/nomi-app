import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { darkTheme } from '@/styles/theme';
import { Button } from './button';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
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
  icon: {
    fontSize: 64,
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
