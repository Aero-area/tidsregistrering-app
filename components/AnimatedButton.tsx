import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

interface AnimatedButtonProps {
  onPress: () => void;
  size?: number;
}

export default function AnimatedButton({ onPress, size = 80 }: AnimatedButtonProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const gradientAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous gradient animation
    const gradientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );

    // Continuous pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0.9,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    gradientLoop.start();
    pulseLoop.start();

    return () => {
      gradientLoop.stop();
      pulseLoop.stop();
    };
  }, [gradientAnimation, pulseAnimation]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const gradientTranslateX = gradientAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-size * 0.5, size * 0.5],
  });

  const gradientTranslateY = gradientAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-size * 0.3, size * 0.3],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: scaleValue }]
        }
      ]}
    >
      <Pressable
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          }
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.gradientInner,
            {
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: size * 0.75,
              transform: [
                { scale: pulseAnimation },
                { translateX: gradientTranslateX },
                { translateY: gradientTranslateY },
              ],
            }
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientInner: {
    position: 'absolute',
    backgroundColor: '#018d36',
    opacity: 0.8,
  },
});