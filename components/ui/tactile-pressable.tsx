import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  AnimateProps,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type AnimatedPressableProps = AnimateProps<PressableProps>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TactilePressableProps extends AnimatedPressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  activeScale?: number;
}

export const TactilePressable: React.FC<TactilePressableProps> = ({
  children,
  style,
  activeScale = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn: PressableProps['onPressIn'] = (event) => {
    if (disabled) return;
    scale.value = withTiming(activeScale, {
      duration: 120,
      easing: Easing.out(Easing.cubic),
    });
    onPressIn?.(event);
  };

  const handlePressOut: PressableProps['onPressOut'] = (event) => {
    scale.value = withSpring(1, {
      damping: 16,
      stiffness: 220,
    });
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      style={[style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {children}
    </AnimatedPressable>
  );
};
