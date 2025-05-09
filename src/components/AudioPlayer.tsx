// src/components/AudioPlayer.tsx

import { FC, useEffect, useState } from 'react';
import { View, Button, Text } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

const AudioPlayer: FC = () => {
    const audioSource = require('../assets/audio/sweep_log_20Hz_20kHz.wav');

    const player = useAudioPlayer(audioSource);

    return (
        <View className="flex-1 items-center justify-center bg-gray-100">
            <Button title="Play Sound" onPress={() => player.play()} />
        </View>
    );
};

export default AudioPlayer;
