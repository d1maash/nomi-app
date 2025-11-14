import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { darkTheme } from '@/styles/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = darkTheme.colors.primary,
  height = 10,
  style,
}) => {
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(Math.min(Math.max(progress, 0), 100), {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, progressValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  return (
    <View style={[styles.container, { height }, style]}>
      <Animated.View
        style={[
          styles.progress,
          { backgroundColor: color, height },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkTheme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
    borderRadius: darkTheme.borderRadius.full,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: darkTheme.borderRadius.full,
  },
});
