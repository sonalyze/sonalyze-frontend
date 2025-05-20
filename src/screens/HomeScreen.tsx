import { useQuery } from '@tanstack/react-query';
import { getTodos } from '../api/testRequest';
import {
	
	Text,
	TouchableHighlight,
	ScrollView,
	TouchableOpacity,
	View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC } from 'react';

import Icon from '@react-native-vector-icons/lucide';
import Button from '../components/Button';
import Card from '../components/Card';

type HomeScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'HomeScreen'
>;

type HomeScreenProps = {
	navigation: HomeScreenNavigationProp;
};

const HomeScreen: FC<HomeScreenProps> = (props: HomeScreenProps) => {
	const todos = useQuery({
		queryKey: ['todos'],
		queryFn: getTodos,
	});

	return (
		<View className="flex-1 bg-background">
			{/* Header */}
			<View className="relative h-[60px] flex-row items-center justify-between px-5 py-3 bg-card">
				<Text className="text-2xl font-semibold text-foreground">
					Sonalyze
				</Text>
				<TouchableOpacity
					onPress={() => props.navigation.push('SettingsScreen')}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					style={{ padding: 8 }}
				>
					<Icon name="settings" size={24} color="#000000" />
				</TouchableOpacity>
			</View>

			{/* Page Content */}
			<ScrollView className="m-2">
				<Card
					title="Cooperative Measurement"
					subtitle="Perform acoustic measurements using multiple devices as speakers or microphones for precise room analysis."
				>
					<View className="flex-row gap-2">
						<View className="flex-1">
							<Button label="Start" onPress={() => {}} />
						</View>
						<View className="flex-1">
							<Button label="Join" onPress={() => {}} />
						</View>
					</View>
				</Card>
				<View className="h-2" />
				<Card
					title="3D Acoustics Simulation"
					subtitle="Simulate room acoustics in a virtual 3D space to analyze and optimize sound characteristics."
				>
					<View className="flex-row">
						<Button label="Start" onPress={() => {}} />
					</View>
				</Card>
			</ScrollView>
		</View>
	);
};

export default HomeScreen;
