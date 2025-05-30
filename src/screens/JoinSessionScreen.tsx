import { ScrollView, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecondaryHeader from '../components/SecondaryHeader';


type JoinSessionScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'JoinSessionScreen'
>;

type JoinSessionScreenProps = {
    navigation: JoinSessionScreenNavigationProp;
};

const JoinSessionScreen: FC<JoinSessionScreenProps> = (props: JoinSessionScreenProps) => {
    return (
        <SafeAreaView className="flex-1 bg-background">
            <SecondaryHeader title="Join Session" onBack={() => props.navigation.pop()} />

            
        </SafeAreaView>
    );
};

export default JoinSessionScreen;
