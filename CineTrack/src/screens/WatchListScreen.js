import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const WatchListScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>WatchList</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E2A',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
});

export default WatchListScreen;
