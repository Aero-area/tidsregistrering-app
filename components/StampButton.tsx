import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';

interface StampButtonProps {
  onPress: () => void;
  isActive: boolean;
  workingTime?: string;
}

export default function StampButton({ onPress, isActive, workingTime }: StampButtonProps) {
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );

    // Continuous rotation animation
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    );

    // Continuous pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    glowLoop.start();
    rotateLoop.start();
    pulseLoop.start();

    return () => {
      glowLoop.stop();
      rotateLoop.stop();
      pulseLoop.stop();
    };
  }, [glowAnimation, rotateAnimation, pulseAnimation]);

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} testID="ts-home-stamp">
        <Animated.View
          style={[
            styles.button,
            {
              transform: [
                { scale: pulseAnimation },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          {/* Outer glow layers */}
          <Animated.View
            style={[
              styles.glowLayer,
              styles.glowOuter,
              { opacity: glowOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.glowLayer,
              styles.glowMid,
              { opacity: glowOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.glowLayer,
              styles.glowInner,
              { opacity: glowOpacity },
            ]}
          />
          
          {/* Main button surface */}
          <View style={styles.buttonSurface} />
        </Animated.View>
      </TouchableOpacity>
      
      {isActive && workingTime && (
        <Text style={styles.workingTime}>{workingTime}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  button: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLayer: {
    position: 'absolute',
    borderRadius: 100,
  },
  glowOuter: {
    width: 240,
    height: 240,
    backgroundColor: 'transparent',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 30,
  },
  glowMid: {
    width: 220,
    height: 220,
    backgroundColor: 'transparent',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  glowInner: {
    width: 210,
    height: 210,
    backgroundColor: 'transparent',
    shadowColor: '#ff0088',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
  },
  buttonSurface: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1a2332',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 25,
    // Gradient-like effect using multiple shadows
    ...({
      shadowColor: '#00ffff',
    } as any),
  },
  workingTime: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
  },
});