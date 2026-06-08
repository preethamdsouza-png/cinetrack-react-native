import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PlaceholderScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Coming Soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E2A', // App's dark background color
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
  }
});

export default PlaceholderScreen;