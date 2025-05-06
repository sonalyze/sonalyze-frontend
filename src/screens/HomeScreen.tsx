import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { getTodos } from '../api/testRequest';
import { Button, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC } from 'react';

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
		<View className="flex-1 items-center justify-center bg-gray-100">
			<Text className="bg-green-500 text-white p-4 rounded-lg">
				Willkommen im Aal
			</Text>
			{todos.isLoading && <Text>Loading...</Text>}
			{todos.isError && <Text>Error: {todos.error.message}</Text>}
			{todos.isSuccess && (
				<Text className="text-lg">{JSON.stringify(todos.data)}</Text>
			)}

			<StatusBar style="auto" />
			<Button
				title="Zu Seite 2"
				onPress={() => props.navigation.navigate('OtherScreen')}
			/>
			<Button
				title="Zur Audio Test Seite"
				onPress={() => props.navigation.navigate('TestAudio')}
			/>
		</View>
	);
};

export default HomeScreen;
