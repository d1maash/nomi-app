import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import { StyleProp, TextStyle } from 'react-native';

import { darkTheme } from '@/styles/theme';
import type { MonoIconName } from '@/types/icon';

interface MonoIconProps {
  name: MonoIconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const MonoIcon: React.FC<MonoIconProps> = ({
  name,
  size = 20,
  color = darkTheme.colors.text,
  style,
}) => {
  return <Feather name={name} size={size} color={color} style={style} />;
};

