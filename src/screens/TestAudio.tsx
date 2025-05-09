import { FC } from 'react';
import { View } from 'react-native';
import TestAudioComponent from '../components/TestAudioComponent';
import AudioPlayer from '../components/AudioPlayer';
import AudioRecorder from '../components/AudioRecorder';

const TestAudio: FC = () => {
    return (
        <>
        
            <View className="flex-1 items-center justify-center bg-gray-100">
                <TestAudioComponent />
            </View>

            <View className="flex-row flex-1 items-center justify-center bg-gray-100 space-x-4">
                <View className="items-center">
                    <AudioPlayer />
                </View>

                <View className="items-center">
                    <AudioRecorder />
                </View>
            </View>

        </>

    );
};

export default TestAudio;
