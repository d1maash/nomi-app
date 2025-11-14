import React from 'react';
import { TextInput, StyleSheet, View, Text, TextInputProps, ViewStyle } from 'react-native';
import { darkTheme } from '@/styles/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={darkTheme.colors.textTertiary}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: darkTheme.spacing.lg,
  },
  label: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.textSecondary,
    marginBottom: darkTheme.spacing.xs,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: darkTheme.colors.surface,
    borderRadius: darkTheme.borderRadius.lg,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingVertical: darkTheme.spacing.md,
    ...darkTheme.typography.body,
    color: darkTheme.colors.text,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
    minHeight: 52,
  },
  inputError: {
    borderColor: darkTheme.colors.error,
  },
  error: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.error,
    marginTop: darkTheme.spacing.xs,
  },
});
