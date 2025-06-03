import React, { FC, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import NativeAudio from '../index';

// Define prop types for each component
type BasicRecordingExampleProps = {
    // No props needed currently
};

type AudioStreamingExampleProps = {
    // No props needed currently
};

type NativeAudioExamplesProps = {
    // No props needed currently
};

/**
 * Basic File Recording Example
 * Demonstrates the simplest way to record and play back audio files
 */
export const BasicRecordingExample: FC<BasicRecordingExampleProps> = (props: BasicRecordingExampleProps) => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordedFile, setRecordedFile] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Permission request needs to be in useEffect due to async nature
    useEffect(() => {
        function requestPermission(): void {
            NativeAudio.requestMicrophonePermission()
                .then((granted: boolean) => {
                    setHasPermission(granted);
                })
                .catch((err: any) => {
                    setError(`Permission error: ${err}`);
                });
        }

        requestPermission();
    }, []);

    function startRecording(): void {
        setError(null);
        const fileName = `example-recording-${Date.now()}.wav`;

        NativeAudio.fileStartRecording(fileName)
            .then((result: any) => {
                if (result.success) {
                    setIsRecording(true);
                } else {
                    setError(`Failed to start recording: ${result.error}`);
                }
            })
            .catch((err: any) => {
                setError(`Recording error: ${err}`);
            });
    }

    function stopRecording(): void {
        NativeAudio.fileStopRecording()
            .then((result: any) => {
                setIsRecording(false);
                if (result.success && result.path) {
                    setRecordedFile(result.path);
                } else {
                    setError(`Failed to stop recording: ${result.error}`);
                }
            })
            .catch((err: any) => {
                setError(`Recording error: ${err}`);
            });
    }

    function playRecording(): void {
        if (!recordedFile) return;

        NativeAudio.playAudioFile(recordedFile)
            .then((result: any) => {
                if (result.success) {
                    setIsPlaying(true);
                } else {
                    setError(`Playback error: ${result.error}`);
                }
            })
            .catch((err: any) => {
                setError(`Playback error: ${err}`);
            });
    }

    function stopPlayback(): void {
        const result = NativeAudio.stopAudioPlayback();
        if (result.success) {
            setIsPlaying(false);
        }
    }

    if (hasPermission === null) {
        return <Text className="text-base my-2">Requesting microphone permission...</Text>;
    }

    if (hasPermission === false) {
        return <Text className="text-base my-2">Microphone permission denied</Text>;
    }

    return (
        <View className="p-4 mb-5 bg-white rounded-lg shadow-md m-2">
            <Text className="text-lg font-bold mb-4">Basic Audio Recording</Text>

            <View className="flex-row justify-around my-3">
                <TouchableOpacity
                    className={`py-2.5 px-5 rounded-md items-center justify-center min-w-[120px] ${isRecording ? "bg-gray-400" : "bg-green-500"
                        }`}
                    onPress={startRecording}
                    disabled={isRecording}>
                    <Text className="text-white font-semibold">Start Recording</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`py-2.5 px-5 rounded-md items-center justify-center min-w-[120px] ${!isRecording ? "bg-gray-400" : "bg-red-500"
                        }`}
                    onPress={stopRecording}
                    disabled={!isRecording}>
                    <Text className="text-white font-semibold">Stop Recording</Text>
                </TouchableOpacity>
            </View>

            {recordedFile && (
                <>
                    <Text className="text-sm text-gray-600 mt-2">File: {recordedFile}</Text>

                    <View className="flex-row justify-around my-3">
                        <TouchableOpacity
                            className={`py-2.5 px-5 rounded-md items-center justify-center min-w-[120px] ${isPlaying ? "bg-gray-400" : "bg-blue-500"
                                }`}
                            onPress={playRecording}
                            disabled={isPlaying}>
                            <Text className="text-white font-semibold">Play</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`py-2.5 px-5 rounded-md items-center justify-center min-w-[120px] ${!isPlaying ? "bg-gray-400" : "bg-red-500"
                                }`}
                            onPress={stopPlayback}
                            disabled={!isPlaying}>
                            <Text className="text-white font-semibold">Stop</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {error && <Text className="text-red-500 mt-4">{error}</Text>}
        </View>
    );
};

/**
 * Advanced Streaming Example
 * Demonstrates real-time audio streaming with visualized buffer data
 */
export const AudioStreamingExample: FC<AudioStreamingExampleProps> = (props: AudioStreamingExampleProps) => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [bufferSize] = useState<number>(4096);
    const [audioData, setAudioData] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Combined useEffect for permission and event listener setup
    useEffect(() => {
        function setupAudioStreaming(): () => void {
            // Request permission
            NativeAudio.requestMicrophonePermission()
                .then((granted: boolean) => {
                    setHasPermission(granted);
                })
                .catch((err: any) => {
                    setError(`Permission error: ${err}`);
                });

            // Set up event listener for audio data
            const subscription = NativeAudio.addListener('onAudioData', (event: any) => {
                // We'll just keep the first 50 samples for visualization
                setAudioData(event.data.slice(0, 50));
            });

            return () => {
                // Clean up listener
                subscription.remove();

                // Stop streaming if active when component unmounts
                if (isStreaming) {
                    NativeAudio.stopStreaming();
                }
            };
        }

        return setupAudioStreaming();
    }, [isStreaming]);

    function startStreaming(): void {
        setError(null);

        NativeAudio.startStreaming({ bufferSize })
            .then((result: any) => {
                if (result.success) {
                    setIsStreaming(true);
                } else {
                    setError(`Failed to start streaming: ${result.error}`);
                }
            })
            .catch((err: any) => {
                setError(`Streaming error: ${err}`);
            });
    }

    function stopStreaming(): void {
        const result = NativeAudio.stopStreaming();
        if (result.success) {
            setIsStreaming(false);
            setAudioData([]);
        } else {
            setError(`Failed to stop streaming: ${result.error}`);
        }
    }

    function renderWaveform(): React.ReactElement {
        return (
            <View className="h-[100px] flex-row items-center justify-center bg-gray-200 rounded p-2 mt-2">
                {audioData.map((value, index) => (
                    <View
                        key={index}
                        style={{
                            width: 4,
                            marginHorizontal: 1,
                            height: Math.abs(value * 100) + 2,
                            backgroundColor: value > 0 ? '#4CAF50' : '#2196F3',
                            alignSelf: 'center'
                        }}
                    />
                ))}
            </View>
        );
    }

    if (hasPermission === null) {
        return <Text className="text-base my-2">Requesting microphone permission...</Text>;
    }

    if (hasPermission === false) {
        return <Text className="text-base my-2">Microphone permission denied</Text>;
    }

    return (
        <View className="p-4 mb-5 bg-white rounded-lg shadow-md m-2">
            <Text className="text-lg font-bold mb-4">Audio Streaming</Text>

            <View className="flex-row justify-around my-3">
                <TouchableOpacity
                    className={`py-2.5 px-5 rounded-md items-center justify-center min-w-[120px] ${isStreaming ? "bg-gray-400" : "bg-purple-600"
                        }`}
                    onPress={startStreaming}
                    disabled={isStreaming}>
                    <Text className="text-white font-semibold">Start Streaming</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`py-2.5 px-5 rounded-md items-center justify-center min-w-[120px] ${!isStreaming ? "bg-gray-400" : "bg-red-500"
                        }`}
                    onPress={stopStreaming}
                    disabled={!isStreaming}>
                    <Text className="text-white font-semibold">Stop Streaming</Text>
                </TouchableOpacity>
            </View>

            {isStreaming && renderWaveform()}

            {error && <Text className="text-red-500 mt-4">{error}</Text>}
        </View>
    );
};

/**
 * Full Examples Page
 * Combines all examples in a scrollable page
 */
const NativeAudioExamples: FC<NativeAudioExamplesProps> = (props: NativeAudioExamplesProps) => {
    const [availableModes, setAvailableModes] = useState<string[]>([]);

    // This useEffect is necessary for initialization
    useEffect(() => {
        function getAudioModes(): void {
            // Get available audio modes for debugging
            const modes = NativeAudio.getAvailableAudioSessionModes();
            setAvailableModes(modes);
        }

        getAudioModes();
    }, []);

    return (
        <ScrollView className="flex-1 bg-gray-100">
            <Text className="text-2xl font-bold m-4 text-center">NativeAudio Module Examples</Text>

            <View className="bg-blue-50 p-4 m-2 rounded-lg">
                <Text className="font-bold mb-2">Available Audio Session Modes:</Text>
                {availableModes.map((mode, index) => (
                    <Text key={index} className="text-sm my-0.5">• {mode}</Text>
                ))}
            </View>

            <BasicRecordingExample />

            <AudioStreamingExample />
        </ScrollView>
    );
};

export default NativeAudioExamples;