import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

const Logo = ({ size = 'medium' }) => {
  const sizes = {
    small: { width: 60, height: 60, fontSize: 20 },
    medium: { width: 120, height: 120, fontSize: 36 },
    large: { width: 200, height: 200, fontSize: 48 },
  };

  const { width, height, fontSize } = sizes[size];

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={[styles.logoCircle, { width: width * 0.8, height: height * 0.8 }]}>
        <Text style={[styles.logoText, { fontSize }]}>🍳</Text>
        <Text style={[styles.logoSubtext, { fontSize: fontSize * 0.3 }]}>🧮</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontWeight: 'bold',
  },
  logoSubtext: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontWeight: 'bold',
  },
});

export default Logo;
