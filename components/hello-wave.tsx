import Animated from 'react-native-reanimated';

import { MonoIcon } from '@/components/ui/mono-icon';
import { darkTheme } from '@/styles/theme';

export function HelloWave() {
  return (
    <Animated.View
      style={{
        width: 36,
        height: 36,
        borderRadius: darkTheme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        animationName: {
          '50%': { transform: [{ rotate: '20deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}
    >
      <MonoIcon name="wind" size={22} color={darkTheme.colors.text} />
    </Animated.View>
  );
}
