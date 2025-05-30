import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { SocketProvider } from './contexts/SocketContext';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/settings/SettingsScreen';
import QrViewScreen from './screens/settings/QrViewScreen';
import { Toaster } from 'sonner-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LocalSettingsProvider } from './contexts/LocalSettingsContext';
import QrScanScreen from './screens/settings/QrScanScreen';
import LanguageScreen from './screens/settings/LanguageScreen'; 
import JoinSessionScreen from './screens/JoinSessionScreen';
import StartSessionScreen from './screens/StartSessionScreen';


enableScreens();

const queryClient = new QueryClient();

export default function App() {
	return (
		<SafeAreaProvider>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<LocalSettingsProvider>
					<QueryClientProvider client={queryClient}>
					<SocketProvider>
						<NavigationContainer>
						<RootStack />
						</NavigationContainer>
						<Toaster
						position="bottom-center"
						closeButton={true}
						swipeToDismissDirection="left"
						/>
					</SocketProvider>
					</QueryClientProvider>
				</LocalSettingsProvider>
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
			name="StartSessionScreen"
			component={StartSessionScreen}
			options={{
				headerShown: false
			}}
		/>
		<Stack.Screen
			name="JoinSessionScreen"
			component={JoinSessionScreen}
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
			name="QrScanScreen"
			component={QrScanScreen}
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
		<Stack.Screen
			name="LanguageScreen"
			component={LanguageScreen}
			options={{
				headerShown: false
			}}
		/>

	</Stack.Navigator>
);

export type RootStackParamList = {
	HomeScreen: undefined;
	StartSessionScreen: undefined;
	JoinSessionScreen: undefined;
	SettingsScreen: undefined;
	QrScanScreen: undefined;
	QrViewScreen: undefined;
	LanguageScreen: undefined; 
};

