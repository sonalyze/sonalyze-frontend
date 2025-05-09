import { FC, useState, useEffect } from 'react';
import { View, Button, Text } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const AudioRecorder: FC = () => {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        Audio.requestPermissionsAsync(); // nur beim ersten Start nötig
    }, []);

    const startRecording = async () => {
        try {
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                alert('Mikrofon-Zugriff wurde verweigert.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const newRecording = new Audio.Recording();
            await newRecording.prepareToRecordAsync({
                android: {
                    extension: '.m4a',
                    outputFormat: 2, // MPEG_4
                    audioEncoder: 3,  // AAC
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.caf',
                    audioQuality: 0, // HIGH
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
                web: {
                    mimeType: 'audio/webm',
                    bitsPerSecond: 128000,
                },
                isMeteringEnabled: false,
            });

            await newRecording.startAsync();
            setRecording(newRecording);
            setIsRecording(true);
        } catch (err) {
            console.error('Fehler beim Starten der Aufnahme:', err);
        }
    };

    const stopRecording = async () => {
        try {
            if (!recording) return;

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            // Zielpfad in dokumentDirectory
            const targetUri = FileSystem.documentDirectory + 'kalibrierung.m4a';

            // Datei dauerhaft verschieben
            await FileSystem.moveAsync({
                from: uri!,
                to: targetUri,
            });

            setRecordingUri(targetUri);
            setRecording(null);
            setIsRecording(false);
        } catch (err) {
            console.error('Fehler beim Stoppen der Aufnahme:', err);
        }
    };

    const playRecording = async () => {
        if (!recordingUri) return;
        try {
            const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
            await sound.playAsync();
        } catch (err) {
            console.error('Fehler beim Abspielen:', err);
        }
    };

    return (
        <View className="items-center mt-4">
            <Text className="text-lg font-semibold mb-2">
                {isRecording ? '🎙️ Aufnahme läuft...' : '🎧 Aufnahme bereit'}
            </Text>

            <Button
                title={isRecording ? '🛑 Aufnahme beenden' : '🎙️ Aufnahme starten'}
                onPress={isRecording ? stopRecording : startRecording}
            />

            {recordingUri && (
                <>
                    <View style={{ height: 12 }} />
                    <Button title="▶️ Abspielen" onPress={playRecording} />
                    <Text className="mt-2 text-sm text-gray-600">
                        Gespeichert unter: {recordingUri}
                    </Text>
                </>
            )}
        </View>
    );
};

export default AudioRecorder;
