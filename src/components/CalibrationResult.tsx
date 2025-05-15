import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  latencySeconds: number;
  lagSamples: number;
};

export default function CalibrationResult({ latencySeconds, lagSamples }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>📏 Kalibrierergebnis</Text>
      <Text>🔁 Latenz: {latencySeconds.toFixed(6)} s</Text>
      <Text>🎯 Verzögerung: {lagSamples} Samples</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
  },
});
