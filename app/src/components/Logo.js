import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const Logo = ({ size = 'medium' }) => {
  const sizes = {
    small: 60,
    medium: 120,
    large: 200,
  };

  const dimension = sizes[size];

  return (
    <View style={[styles.container, { width: dimension, height: dimension }]}>
      <Image
        source={require('../../assets/main_icon.png')}
        style={[styles.logo, { width: dimension, height: dimension }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    borderRadius: 999,
  },
});

export default Logo;
