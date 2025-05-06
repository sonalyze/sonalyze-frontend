import { FC } from 'react';
import { View } from 'react-native';
import TestAudioComponent from '../components/TestAudioComponent';

const TestAudio: FC = () => {
    return (
        <View className="flex-1 items-center justify-center bg-gray-100">
            <TestAudioComponent />
        </View>
    );
};

export default TestAudio;
