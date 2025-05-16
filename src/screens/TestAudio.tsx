import { FC, useState } from 'react';
import { View } from 'react-native';
import AudioPlayer from '../components/AudioPlayer';
import AudioRecorder from '../components/AudioRecorder';
import CalibrationResult from '../components/CalibrationResult';
import CorrelationPlot from '../components/CorrelationPlot';
import WaveformPlot from '../components/WaveformPlot';
import WaveformEnvelopePlot from '../components/WaveformEnvelopePlot';

// Hilfsfunktion zur Reduktion der Datenpunkte
function downsampleMinMax(data: number[], factor: number): number[] {
    const result = [];
    for (let i = 0; i < data.length; i += factor) {
      const slice = data.slice(i, i + factor);
      result.push(Math.min(...slice));
      result.push(Math.max(...slice));
    }
    return result;
  }


const TestAudio: FC = () => {

    const [latencyResult, setLatencyResult] = useState<null | {
        latency_seconds: number;
        lag_samples: number;
    }>(null);

    const [correlationData, setCorrelationData] = useState<number[] | null>(null);
    const [originalData, setOriginalData] = useState<number[] | null>(null);
    const [recordedData, setRecordedData] = useState<number[] | null>(null);

    return (
        <View className="flex-row flex-1 items-center justify-center bg-gray-100 space-x-4">
            <View className="items-center">
                <AudioPlayer />
                <AudioRecorder 
                    onLatencyResult={setLatencyResult}
                    onCorrelationData={setCorrelationData}
                    onOriginalData={setOriginalData}
                    onRecordedData={setRecordedData}
                />
            </View>

            {latencyResult && (
                <View className="w-full max-w-md">
                <CalibrationResult
                    latencySeconds={latencyResult.latency_seconds}
                    lagSamples={latencyResult.lag_samples}
                />
                </View>
            )}
            {/*
            {correlationData && (
            <View className="mt-8">
                <CorrelationPlot correlation={correlationData} />
            </View>
            )}
                       
            {originalData && (
            <View className="mt-8 w-full max-w-2xl">
                <WaveformPlot data={downsampleMinMax(originalData, 40)} title="Originalsignal" />
            </View>
            )}
            
            {recordedData && (
            <View className="mt-8 w-full max-w-2xl">
                <WaveformPlot data={recordedData} title="Aufnahme" />
            </View>
            )}
            */}
            {originalData && (
            <View className="mt-8 w-full max-w-2xl">
                <WaveformEnvelopePlot data={originalData} title="Originalsignal (Hüllkurve)" factor={80} />
            </View>
            )}
        </View>
    );
};

export default TestAudio;
