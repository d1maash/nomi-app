import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { darkTheme } from '@/styles/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'tinted';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'tinted' && styles.tinted,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkTheme.colors.surface,
    borderRadius: darkTheme.borderRadius.xl,
    padding: darkTheme.spacing.xl,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: darkTheme.colors.surfaceElevated,
    borderColor: 'transparent',
    ...darkTheme.shadows.md,
  },
  tinted: {
    backgroundColor: darkTheme.colors.surfaceLight,
    borderColor: darkTheme.colors.border,
  },
});
