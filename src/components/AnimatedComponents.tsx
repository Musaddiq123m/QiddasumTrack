import React, { useRef, useEffect } from 'react';
import {
  Animated,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedPressableProps extends TouchableOpacityProps {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: React.ReactNode;
}

/**
 * High-performance spring-animated pressable component.
 * Directly animates TouchableOpacity without extra View wrappers,
 * preserving flexbox layouts (flex: 1, width %, margins, etc.).
 */
export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  style,
  scaleTo = 0.96,
  children,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: Platform.OS !== 'web',
      speed: 40,
      bounciness: 4,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 30,
      bounciness: 6,
    }).start();
    onPressOut?.(e);
  };

  return (
    <AnimatedTouchable
      {...rest}
      style={[style, { transform: [{ scale }] }]}
      activeOpacity={0.85}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {children}
    </AnimatedTouchable>
  );
};

interface FadeInViewProps {
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Smooth entrance animation: fades in and slides up subtly
 */
export const FadeInView: React.FC<FadeInViewProps> = ({
  duration = 300,
  delay = 0,
  style,
  children,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [duration, delay, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};
