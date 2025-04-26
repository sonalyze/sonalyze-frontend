import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import OtherScreen from './screens/OtherScreen';
import HomeScreen from './screens/HomeScreen';

enableScreens();

const queryClient = new QueryClient();

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<NavigationContainer>
				<RootStack />
			</NavigationContainer>
		</QueryClientProvider>
	);
}

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStack = () => (
	<Stack.Navigator>
		<Stack.Screen
			name="HomeScreen"
			component={HomeScreen}
			options={{ headerShown: false }}
		/>
		<Stack.Screen
			name="OtherScreen"
			component={OtherScreen}
			options={{ headerShown: true }}
		/>
	</Stack.Navigator>
);

export type RootStackParamList = {
	HomeScreen: undefined;
	OtherScreen: undefined;
};
