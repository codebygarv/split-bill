import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 80 }) => {
  const borderRadius = size * 0.26; // 16 for size 60, 21 for size 80
  const crossSize = size * 0.4;     // length of cross lines
  const crossWidth = size * 0.08;    // stroke-width
  const dotSize = size * 0.08;

  return (
    <LinearGradient
      colors={['#2BA8A2', '#1E8C86']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: borderRadius,
        },
      ]}
    >
      {/* Decorative Dot in Top Left */}
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            top: size * 0.25,
            left: size * 0.25,
          },
        ]}
      />

      {/* Rotated Cross */}
      <View style={[styles.crossContainer, { transform: [{ rotate: '45deg' }] }]}>
        {/* Horizontal Line */}
        <View
          style={[
            styles.line,
            {
              width: crossSize,
              height: crossWidth,
              borderRadius: crossWidth / 2,
            },
          ]}
        />
        {/* Vertical Line */}
        <View
          style={[
            styles.line,
            {
              width: crossWidth,
              height: crossSize,
              borderRadius: crossWidth / 2,
              position: 'absolute',
            },
          ]}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    backgroundColor: '#FFFFFF',
    opacity: 0.4,
    position: 'absolute',
  },
  crossContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    backgroundColor: '#FFFFFF',
  },
});
