import { FC, useCallback, useState, useEffect } from 'react';
import { Button, Text, View, StyleSheet } from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type TestAudioComponentProps = {
};

const TestAudioComponent: FC<TestAudioComponentProps> = (
    props: TestAudioComponentProps
) => {
    // Socket setup
    const handleIncoming = useCallback((msg: any) => {
        console.log(msg);
    }, []);

    const socket = useSocket('', handleIncoming, {
        onConnect: () => console.log('connected'),
        onDisconnect: (reason: string) => console.log('discsonnect: ' + reason),
        onError: (error) => console.error(error),
    });

    // Audio recording state
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordedURI, setRecordedURI] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Start recording audio
    const startRecording = async () => {
        try {
            // Request microphone permissions
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                console.error('Permission to access microphone not granted');
                return;
            }

            // Configure audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Create a new recording instance
            const newRecording = new Audio.Recording();
            await newRecording.prepareToRecordAsync(
                {
                    android: {
                        extension: '.wav',
                        outputFormat: 0,
                        audioEncoder: 0,
                        sampleRate: 48000,
                        numberOfChannels: 2,
                        bitRate: 128000,
                    },
                    ios: {
                        extension: '.wav',
                        audioQuality: 127,
                        outputFormat: "lpcm",
                        bitDepthHint: 32,
                        sampleRate: 48000,
                        numberOfChannels: 2,
                        bitRate: 128000,
                        bitRateStrategy: 0,
                        linearPCMBitDepth: 32,
                        linearPCMIsBigEndian: false,
                        linearPCMIsFloat: false,
                    },
                    web: {
                        mimeType: 'audio/wav',
                        bitsPerSecond: 128000,
                    },
                }
            );
            await newRecording.startAsync();

            setRecording(newRecording);
            setIsRecording(true);
            console.log('Recording started');
        } catch (error) {
            console.error('Failed to start recording', error);
            setError("Failed to start recording");
        }
    };

    // Stop recording audio
    const stopRecording = async () => {
        try {
            if (!recording) return;
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            console.log('Recording stopped and stored at:', uri);
            setRecordedURI(uri);
            setRecording(null);
            setIsRecording(false);
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: false,
            });
        } catch (error) {
            console.error('Failed to stop recording', error);
            setError("Failed to stop recording");
        }
    };

    // Play the recorded audio
    const playRecording = async () => {
        try {
            if (!recordedURI) {
                setError("No recording to play");
                return;
            }

            if (sound) {
                await sound.unloadAsync();
            }
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedURI });
            setSound(newSound);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });

            await newSound.setVolumeAsync(1.0);
            setIsPlaying(true);
            await newSound.playAsync();
            console.log('Playback started');
        } catch (error) {
            console.error('Failed to play recorded audio', error);
            setError("Failed to play recording");
        }
    };

    const stopPlayback = async () => {
        if (sound) {
            await sound.stopAsync();
            setIsPlaying(false);
        }
    };

    const shareRecording = async () => {
        if (!recordedURI) {
            setError("No recording to share");
            return;
        }

        try {
            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (!isSharingAvailable) {
                setError("Sharing is not available on this device");
                return;
            }

            const fileInfo = await FileSystem.getInfoAsync(recordedURI);
            console.log("Original recording file info:", fileInfo);

            await Sharing.shareAsync(recordedURI, {
                mimeType: 'audio/m4a',
                dialogTitle: 'Share your audio recording',
                UTI: 'public.audio'
            });
        } catch (error) {
            console.error("Error sharing recording:", error);
            setError("Failed to share recording");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Audio Test</Text>

            <Button
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
                onPress={isRecording ? stopRecording : startRecording}
            />

            <View style={{ marginVertical: 10 }} />

            {recordedURI && (
                <>
                    <Button
                        title={isPlaying ? "Stop Playing" : "Play Recording"}
                        onPress={isPlaying ? stopPlayback : playRecording}
                        disabled={!recordedURI}
                    />

                    <View style={{ marginVertical: 10 }} />

                    <Button
                        title="Share Recording"
                        onPress={shareRecording}
                    />

                    <Text style={styles.info}>Recording available</Text>
                </>
            )}

            {error && (
                <Text style={styles.errorText}>{error}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    info: {
        marginTop: 20,
        textAlign: 'center',
    },
    errorText: {
        color: 'red',
        marginTop: 10,
    },
});

export default TestAudioComponent;