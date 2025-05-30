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
    // Track if we're receiving audio data
    const dataReceivedRef = useRef<boolean>(false);
    // Track last data reception time
    const lastDataTimeRef = useRef<number>(0);
    // Monitoring interval reference
    const monitorRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Request microphone permission on component mount
    useEffect(() => {
        console.log('[AudioStream] Component mounted');

        function requestPermission(): void {
            console.log('[AudioStream] Requesting microphone permission...');
            NativeAudio.requestMicrophonePermission()
                .then(granted => {
                    console.log(`[AudioStream] Permission request result: ${granted ? 'GRANTED' : 'DENIED'}`);
                    setHasPermission(granted);
                })
                .catch(err => {
                    const errorMessage = 'Failed to request permission: ' + err;
                    console.error(`[AudioStream] ${errorMessage}`);
                    setError(errorMessage);
                });
        }


        requestPermission();

        // Component cleanup - only run once on unmount
        return () => {
            console.log('[AudioStream] Component unmounting');

            // Clean up everything when component unmounts
            if (isStreaming) {
                console.log('[AudioStream] Component unmounting while streaming active, stopping stream');
                stopAudioStream();
            }

            stopMonitoring();
        };
    }, []); // Keep empty to run only on mount/unmount


    // Start monitoring for audio data events
    function startMonitoring(): void {
        console.log('[AudioStream] Starting audio stream monitor');
        dataReceivedRef.current = false;
        lastDataTimeRef.current = Date.now();

        // Check every second if we're receiving data
        monitorRef.current = setInterval(() => {
            const now = Date.now();
            const timeSinceLastData = now - lastDataTimeRef.current;

            console.log(`[AudioStream] Monitor check - Data received: ${dataReceivedRef.current}, Time since last: ${timeSinceLastData}ms`);

            // If no data for 3 seconds and we're supposed to be streaming, something's wrong
            if (isStreaming && !dataReceivedRef.current && timeSinceLastData > 3000) {
                console.warn('[AudioStream] No audio data received in 3 seconds while streaming');
            }

            // Check if native module says we're streaming
            try {
                const nativeIsStreaming = NativeAudio.isStreaming();
                console.log(`[AudioStream] Native streaming state: ${nativeIsStreaming}, JS state: ${isStreaming}`);

                if (isStreaming !== nativeIsStreaming) {
                    console.warn(`[AudioStream] Streaming state mismatch - JS: ${isStreaming}, Native: ${nativeIsStreaming}`);
                }
            } catch (err) {
                console.error('[AudioStream] Error checking native streaming state:', err);
            }

        }, 1000);
    }

    // Stop monitoring
    function stopMonitoring(): void {
        if (monitorRef.current) {
            console.log('[AudioStream] Stopping audio stream monitor');
            clearInterval(monitorRef.current);
            monitorRef.current = null;
        }
    }

    function startAudioStream(): void {
        console.log('[AudioStream] Starting audio stream with buffer size:', bufferSize);
        try {
            setError(null);

            // Clean up any existing listener first
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }

            // Set up event listener for audio data
            console.log('[AudioStream] Setting up audio data event listener');
            const subscription = NativeAudio.addListener('onAudioData', handleAudioData);
            cleanupRef.current = () => {
                console.log('[AudioStream] Removing audio data listener');
                subscription.remove();
            };

            // Reset audio statistics
            setAudioStats({
                samplesReceived: 0,
                maxAmplitude: 0,
                sampleRate: 0
            });
            dataReceivedRef.current = false;

            // Start monitoring
            startMonitoring();

            setIsStreaming(true); // Set this BEFORE starting streaming

            // Start streaming
            console.log('[AudioStream] Calling native startStreaming()');
            NativeAudio.startStreaming({ bufferSize })
                .then(result => {
                    console.log('[AudioStream] startStreaming result:', result);
                    if (!result.success) { // Changed condition to handle failure case
                        const errorMessage = `Failed to start streaming: ${result.error}`;
                        console.error(`[AudioStream] ${errorMessage}`);
                        setError(errorMessage);
                        stopMonitoring();
                        setIsStreaming(false); // Reset state on failure
                    } else {
                        console.log('[AudioStream] Audio streaming started successfully');
                    }
                })
                .catch(err => {
                    const errorMessage = 'Error starting audio stream: ' + err;
                    console.error(`[AudioStream] ${errorMessage}`);
                    setError(errorMessage);
                    stopMonitoring();
                });
        } catch (err) {
            const errorMessage = 'Error setting up audio stream: ' + err;
            console.error(`[AudioStream] ${errorMessage}`);
            setError(errorMessage);
            stopMonitoring();
        }
    }

    function stopAudioStream(): void {
        console.log('[AudioStream] Stopping audio stream');
        try {
            // Check if native module thinks we're streaming
            try {
                const nativeIsStreaming = NativeAudio.isStreaming();
                console.log(`[AudioStream] Native streaming state before stop: ${nativeIsStreaming}`);
            } catch (err) {
                console.error('[AudioStream] Error checking native streaming state:', err);
            }

            // Stop monitoring
            stopMonitoring();

            console.log('[AudioStream] Calling native stopStreaming()');
            const result = NativeAudio.stopStreaming();
            console.log('[AudioStream] stopStreaming result:', result);

            // Clean up event listener
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }

            setIsStreaming(false);

            if (!result.success) {
                const errorMessage = `Failed to stop streaming: ${result.error}`;
                console.error(`[AudioStream] ${errorMessage}`);
                setError(errorMessage);
            } else {
                console.log('[AudioStream] Stream stopped successfully');
            }
        } catch (err) {
            const errorMessage = 'Error stopping audio stream: ' + err;
            console.error(`[AudioStream] ${errorMessage}`);
            setError(errorMessage);
        }
    }

    function handleAudioData(event: AudioDataEvent): void {
        // Update data received flag and time
        dataReceivedRef.current = true;
        lastDataTimeRef.current = Date.now();

        // Throttle logging to every 20 events to avoid console spam
        if (audioStats.samplesReceived % 20 === 0) {
            console.log(`[AudioStream] Received audio data: ${event.data?.length} samples, sampleRate: ${event.sampleRate}`);
        }

        // Calculate audio level from incoming samples
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

            // Log first few samples occasionally
            if (audioStats.samplesReceived % 50 === 0) {
                const samplePreview = event.data.slice(0, 5).map(s => s.toFixed(3)).join(', ');
                console.log(`[AudioStream] Sample preview: [${samplePreview}...]`);
            }
        } else {
            console.warn('[AudioStream] Received empty audio data packet');
        }
    }

    function updateBufferSize(newSize: number): void {
        console.log(`[AudioStream] Updating buffer size from ${bufferSize} to ${newSize}`);
        if (newSize >= 256 && newSize <= 16384) {
            const result = NativeAudio.setStreamingOptions({ bufferSize: newSize });
            console.log('[AudioStream] setStreamingOptions result:', result);
            if (result) {
                setBufferSize(newSize);
                console.log(`[AudioStream] Buffer size updated successfully to ${newSize}`);
            } else {
                const errorMessage = 'Failed to update buffer size';
                console.error(`[AudioStream] ${errorMessage}`);
                setError(errorMessage);
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
                            onPress={() => {
                                console.log('[AudioStream] Requesting permission again');
                                NativeAudio.requestMicrophonePermission()
                                    .then(granted => {
                                        console.log(`[AudioStream] Permission re-request result: ${granted ? 'GRANTED' : 'DENIED'}`);
                                        setHasPermission(granted);
                                    });
                            }}>
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
                        <Text className="mb-2 text-xs text-gray-500">
                            Samples received: {audioStats.samplesReceived > 0 ? 'Yes' : 'No'}
                            {audioStats.samplesReceived > 0 ? ` (${audioStats.samplesReceived} total)` : ''}
                        </Text>

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
                            <Text>Data received: {dataReceivedRef.current ? 'Yes' : 'No'}</Text>
                        </View>
                    </View>
                )}

                {/* Error display */}
                {error && (
                    <View className="p-2.5 bg-red-50 rounded border border-red-300">
                        <Text className="text-red-600">{error}</Text>
                        <TouchableOpacity
                            className="mt-1"
                            onPress={() => setError(null)}>
                            <Text className="text-blue-500 text-xs">Clear</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Debug actions */}
                <View className="mt-4 p-4 bg-white rounded-lg shadow">
                    <Text className="text-lg font-bold mb-2.5">Debug Actions</Text>
                    <View className="flex-row justify-around">
                        <TouchableOpacity
                            className="py-1 px-3 bg-purple-500 rounded"
                            onPress={() => {
                                console.log('[AudioStream] Checking native streaming state');
                                try {
                                    const nativeIsStreaming = NativeAudio.isStreaming();
                                    console.log(`[AudioStream] Native streaming state: ${nativeIsStreaming}, JS state: ${isStreaming}`);
                                    alert(`Native streaming state: ${nativeIsStreaming}\nJS streaming state: ${isStreaming}`);
                                } catch (err) {
                                    console.error('[AudioStream] Error checking streaming state:', err);
                                    alert(`Error checking state: ${err}`);
                                }
                            }}>
                            <Text className="text-white">Check State</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="py-1 px-3 bg-yellow-500 rounded"
                            onPress={() => {
                                console.log('[AudioStream] Forcing stream stop');
                                try {
                                    NativeAudio.stopStreaming();
                                    setIsStreaming(false);
                                    if (cleanupRef.current) {
                                        cleanupRef.current();
                                        cleanupRef.current = null;
                                    }
                                    stopMonitoring();
                                    alert('Force stopped streaming');
                                } catch (err) {
                                    console.error('[AudioStream] Error force stopping stream:', err);
                                    alert(`Error: ${err}`);
                                }
                            }}>
                            <Text className="text-white">Force Stop</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

export default AudioStreamingScreen;