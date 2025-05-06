import { FC, useCallback } from 'react';
import { Button, Text, View } from 'react-native';
import { useSocket } from '../hooks/useSocket';

type TestAudioComponentProps = {
    name: string;
    age: number;
};

const TestAudioComponent: FC<TestAudioComponentProps> = (
    props: TestAudioComponentProps
) => {
    const handleIncoming = useCallback((msg: any) => {
        console.log(msg);
    }, []);

    const socket = useSocket('', handleIncoming, {
        onConnect: () => console.log('connected'),
        onDisconnect: (reason: string) => console.log('discsonnect: ' + reason),
        onError: (error) => console.error(error),
    });

    return (
        <View className="flex-1 items-center justify-center bg-gray-100">
            <Text className="font-bold text-lg mb-3">Page 2</Text>
            <Text>Name: {props.name}</Text>
            <Text>Alter: {props.age}</Text>
            <Button
                onPress={() => socket.emit('message', 'moin')}
                title="Emit socket message"
            />
        </View>
    );
};

export default TestAudioComponent;
