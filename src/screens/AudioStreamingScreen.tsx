import React, { useState, useEffect, useRef, FC } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import NativeAudio, { AudioDataEvent } from '../../modules/native-audio';

type AudioStreamingScreenProps = {
};

const AudioStreamingScreen: FC<AudioStreamingScreenProps> = (props: AudioStreamingScreenProps) => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [bufferSize, setBufferSize] = useState<number>(4096);
    const [audioLevel, setAudioLevel] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [audioStats, setAudioStats] = useState({
        samplesReceived: 0,
        maxAmplitude: 0,
        sampleRate: 0
    });

    // Used to store the event subscription removal function
    const cleanupRef = useRef<(() => void) | null>(null);

    // Request microphone permission on component mount
    useEffect(() => {
        function requestPermission(): void {
            NativeAudio.requestMicrophonePermission()
                .then(granted => {
                    setHasPermission(granted);
                })
                .catch(err => {
                    setError('Failed to request permission: ' + err);
                    console.error(err);
                });
        }

        requestPermission();
    }, []);

    // Clean up event listeners when component unmounts
    useEffect(() => {
        return () => {
            if (isStreaming) {
                stopAudioStream();
            }
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, [isStreaming]);

    function startAudioStream(): void {
        try {
            setError(null);

            // Set up event listener for audio data
            const subscription = NativeAudio.addListener('onAudioData', handleAudioData);
            cleanupRef.current = () => subscription.remove();

            // Reset audio statistics
            setAudioStats({
                samplesReceived: 0,
                maxAmplitude: 0,
                sampleRate: 0
            });

            // Start streaming
            NativeAudio.startStreaming({ bufferSize })
                .then(result => {
                    if (result.success) {
                        setIsStreaming(true);
                        console.log('Audio streaming started');
                    } else {
                        setError(`Failed to start streaming: ${result.error}`);
                    }
                })
                .catch(err => {
                    setError('Error starting audio stream: ' + err);
                    console.error(err);
                });
        } catch (err) {
            setError('Error setting up audio stream: ' + err);
            console.error(err);
        }
    }

    function stopAudioStream(): void {
        try {
            const result = NativeAudio.stopStreaming();

            // Clean up event listener
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }

            setIsStreaming(false);

            if (!result.success) {
                setError(`Failed to stop streaming: ${result.error}`);
            }
        } catch (err) {
            setError('Error stopping audio stream: ' + err);
            console.error(err);
        }
    }

    function handleAudioData(event: AudioDataEvent): void {
        // Calculate audio level from incoming samples
        // (RMS - Root Mean Square is a common way to calculate audio level)
        if (event.data && event.data.length > 0) {
            // Calculate RMS of the audio samples
            let sum = 0;
            let maxSample = 0;

            for (let i = 0; i < event.data.length; i++) {
                const sample = Math.abs(event.data[i]);
                sum += sample * sample;
                maxSample = Math.max(maxSample, sample);
            }

            const rms = Math.sqrt(sum / event.data.length);

            // Update audio level (scale to 0-100 for visualization)
            // Audio samples are typically in range -1.0 to 1.0
            setAudioLevel(Math.min(100, Math.floor(rms * 100)));

            // Update audio stats
            setAudioStats(prev => ({
                samplesReceived: prev.samplesReceived + event.data.length,
                maxAmplitude: Math.max(prev.maxAmplitude, maxSample),
                sampleRate: event.sampleRate
            }));
        }
    }

    function updateBufferSize(newSize: number): void {
        if (newSize >= 256 && newSize <= 16384) {
            const result = NativeAudio.setStreamingOptions({ bufferSize: newSize });
            if (result) {
                setBufferSize(newSize);
                console.log(`Buffer size updated to ${newSize}`);
            } else {
                setError('Failed to update buffer size');
            }
        }
    }

    // Visualization of the audio level as a bar
    function renderAudioMeter(): React.ReactElement {
        return (
            <View className="w-full h-16 bg-gray-200 rounded-lg overflow-hidden mb-2">
                <View
                    className="h-full bg-blue-500"
                    style={{ width: `${audioLevel}%` }}
                />
                <Text className="absolute text-xs right-2 top-1">
                    Level: {audioLevel}%
                </Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-100">
            <View className="p-5">
                <Text className="text-2xl font-bold mb-5 text-center">Audio Streaming Test</Text>

                {/* Permission status */}
                <View className="mb-5 p-4 bg-white rounded-lg shadow">
                    <Text className="text-lg font-bold mb-2.5">Microphone Permission</Text>
                    <Text>{hasPermission === null ? 'Checking...' :
                        hasPermission ? 'Granted' : 'Denied'}</Text>
                    {hasPermission === false && (
                        <TouchableOpacity
                            className="mt-2 bg-blue-500 py-2 px-4 rounded-md"
                            onPress={() => NativeAudio.requestMicrophonePermission()}>
                            <Text className="text-white text-center">Request Permission</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Streaming controls */}
                {hasPermission && (
                    <View className="mb-5 p-4 bg-white rounded-lg shadow">
                        <Text className="text-lg font-bold mb-2.5">Audio Streaming</Text>
                        <View className="flex-row justify-around mb-4">
                            <TouchableOpacity
                                className={`py-2 px-4 rounded-md ${isStreaming ? 'bg-gray-300' : 'bg-green-500'}`}
                                onPress={startAudioStream}
                                disabled={isStreaming}>
                                <Text className="text-white">Start Streaming</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`py-2 px-4 rounded-md ${!isStreaming ? 'bg-gray-300' : 'bg-red-500'}`}
                                onPress={stopAudioStream}
                                disabled={!isStreaming}>
                                <Text className="text-white">Stop Streaming</Text>
                            </TouchableOpacity>
                        </View>
                        <Text className="mb-2">Status: {isStreaming ? 'Streaming active' : 'Not streaming'}</Text>

                        {/* Buffer size adjustment */}
                        <View className="mt-3 mb-2">
                            <Text className="font-medium mb-1">Buffer Size: {bufferSize}</Text>
                            <View className="flex-row justify-around">
                                <TouchableOpacity
                                    className="py-1 px-3 bg-blue-500 rounded"
                                    onPress={() => updateBufferSize(bufferSize / 2)}
                                    disabled={bufferSize <= 256}>
                                    <Text className="text-white">Smaller</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="py-1 px-3 bg-blue-500 rounded"
                                    onPress={() => updateBufferSize(bufferSize * 2)}
                                    disabled={bufferSize >= 16384}>
                                    <Text className="text-white">Larger</Text>
                                </TouchableOpacity>
                            </View>
                            <Text className="text-xs text-gray-500 mt-1">
                                Smaller buffers = lower latency but higher CPU usage
                            </Text>
                        </View>
                    </View>
                )}

                {/* Audio Visualization */}
                {isStreaming && (
                    <View className="mb-5 p-4 bg-white rounded-lg shadow">
                        <Text className="text-lg font-bold mb-2.5">Audio Visualization</Text>
                        {renderAudioMeter()}

                        {/* Audio statistics */}
                        <View className="mt-3">
                            <Text className="font-medium">Statistics:</Text>
                            <Text>Samples received: {audioStats.samplesReceived}</Text>
                            <Text>Max amplitude: {audioStats.maxAmplitude.toFixed(4)}</Text>
                            <Text>Sample rate: {audioStats.sampleRate} Hz</Text>
                            <Text>Buffer size: {bufferSize} samples</Text>
                        </View>
                    </View>
                )}

                {/* Error display */}
                {error && (
                    <View className="p-2.5 bg-red-50 rounded border border-red-300">
                        <Text className="text-red-600">{error}</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

export default AudioStreamingScreen;