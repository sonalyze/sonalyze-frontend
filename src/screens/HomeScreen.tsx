import { useQuery } from '@tanstack/react-query';
import { getTodos } from '../api/testRequest';
import { Button, SafeAreaView, Text, TouchableHighlight, ScrollView, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC } from 'react';
import Icon from '@react-native-vector-icons/lucide';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';


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
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="px-3 py-2 h-25 flex-row items-top justify-between">
				<View>
					<Text className="text-2xl color-foreground">Welcome to Sonalyze!</Text>
					<Text className="text-xl text-muted-foreground">What would you like to do?</Text>
				</View>
				<TouchableOpacity className="pt-0.5" onPress={() => { props.navigation.push("SettingsScreen") }}>
					<Icon name="settings" size={24} />
				</TouchableOpacity>
			</View>

			{/* Page Content */}
			<ScrollView className="m-2">
				<Card title="Cooperative Measurement" subtitle="Perform acoustic measurements using multiple devices as speakers or microphones for precise room analysis.">
					<View className="flex-row justify-between">
						<PrimaryButton label="Start" onPress={() => { }} />
						<PrimaryButton label="Join" onPress={() => { }} />
					</View>
				</Card>
				<View className="h-2" />
				<Card title="3D Acoustics Simulation" subtitle="Simulate room acoustics in a virtual 3D space to analyze and optimize sound characteristics.">
					<View className="flex-row">
						<PrimaryButton label="Start" onPress={() => { }} />
					</View>
				</Card>
			</ScrollView>

		</SafeAreaView>
	);
};

export default HomeScreen;
