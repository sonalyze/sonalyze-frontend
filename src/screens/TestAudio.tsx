import { FC, useState } from 'react';
import { View } from 'react-native';
import AudioPlayer from '../components/AudioPlayer';
import AudioRecorder from '../components/AudioRecorder';
import CalibrationResult from '../components/CalibrationResult';

const TestAudio: FC = () => {

    const [latencyResult, setLatencyResult] = useState<null | {
        latency_seconds: number;
        lag_samples: number;
    }>(null);

    return (
        <View className="flex-row flex-1 items-center justify-center bg-gray-100 space-x-4">
            <View className="items-center">
                <AudioPlayer />
                <AudioRecorder onLatencyResult={setLatencyResult} />
            </View>
            {latencyResult && (
                <View className="w-full max-w-md">
                <CalibrationResult
                    latencySeconds={latencyResult.latency_seconds}
                    lagSamples={latencyResult.lag_samples}
                />
                </View>
            )}
        </View>
    );
};

export default TestAudio;
