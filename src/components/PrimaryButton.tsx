import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { FC } from 'react'

// @TODO: Cleanup.

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
}

const PrimaryButton : FC<PrimaryButtonProps> = (props: PrimaryButtonProps) => {
  return (
    <TouchableOpacity onPress={props.onPress}>
      <View className="px-3 py-2 rounded-lg bg-primary">
        <Text className="color-primaryForeground">{props.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default PrimaryButton

const styles = StyleSheet.create({})