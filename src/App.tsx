import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { SocketProvider } from './contexts/SocketContext';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import QrViewScreen from './screens/QrViewScreen';
import { Toaster } from 'sonner-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

enableScreens();

const queryClient = new QueryClient();

export default function App() {
	return (
		<SafeAreaProvider>
			<GestureHandlerRootView>
				<QueryClientProvider client={queryClient}>
					<SocketProvider>
						<NavigationContainer>
							<RootStack />
						</NavigationContainer>
						<Toaster
							position='bottom-center'
							closeButton={true}
							swipeToDismissDirection='left'
						/>
					</SocketProvider>
				</QueryClientProvider>
			</GestureHandlerRootView>
		</SafeAreaProvider>
	);
}

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStack = () => (
	<Stack.Navigator>
		<Stack.Screen
			name="HomeScreen"
			component={HomeScreen}
			options={{
				headerShown: false
			}}
		/>
		<Stack.Screen
			name="SettingsScreen"
			component={SettingsScreen}
			options={{
				headerShown: false
			}}
		/>
		<Stack.Screen
			name="QrViewScreen"
			component={QrViewScreen}
			options={{
				headerShown: false
			}}
		/>
	</Stack.Navigator>
);

export type RootStackParamList = {
	HomeScreen: undefined;
	SettingsScreen: undefined;
	QrViewScreen: undefined;
};
