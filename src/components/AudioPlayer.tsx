// src/components/AudioPlayer.tsx

import { FC, useEffect, useState } from 'react';
import { View, Button, Text } from 'react-native';
import { Audio } from 'expo-av';

const AudioPlayer: FC = () => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const loadAndPlay = async () => {
        const { sound: newSound } = await Audio.Sound.createAsync(
            require('../assets/audio/sweep_log_20Hz_20kHz.wav')
        );
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);
    };

    const handlePlayPause = async () => {
        if (!sound) {
            await loadAndPlay();
        } else if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
        } else {
            await sound.playAsync();
            setIsPlaying(true);
        }
    };

    const handleStop = async () => {
        if (sound) {
            await sound.stopAsync();
            setIsPlaying(false);
        }
    };

    useEffect(() => {
        return () => {
            sound?.unloadAsync();
        };
    }, [sound]);

    return (
        <View className="items-center justify-center">
            <Text className="text-xl font-semibold mb-4">Test Ton</Text>
            <Button title={isPlaying ? 'Pause' : 'Abspielen'} onPress={handlePlayPause} />
            <View style={{ height: 10 }} />
            <Button title="Stopp" onPress={handleStop} />
        </View>
    );
};

export default AudioPlayer;
