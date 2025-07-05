import './globals.css';
import './i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens, ScreenContainer } from 'react-native-screens';
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
import DevSettingsScreen from './screens/settings/DevSettings';
import MeasurementScreen from './screens/MeasurementScreen';
import MeasurementDetailScreen from './screens/MeasurementDetailScreen';
import HistoryScreen from './screens/HistoryScreen';
import CreateRoomScreen from './screens/CreateRoomScreen';
import RoomDetailScreen from './screens/RoomDetailScreen';
import { View } from 'react-native';

enableScreens();

const queryClient = new QueryClient();

export default function App() {
	return (
		<SafeAreaProvider>
			<GestureHandlerRootView
				style={{ flex: 1, backgroundColor: '#f2f2f2' }}
			>
				<LocalSettingsProvider>
					<QueryClientProvider client={queryClient}>
						<SocketProvider>
							<View className="w-[100%] xl:w-[1024px] mx-auto flex-1">
								<NavigationContainer>
									<RootStack />
								</NavigationContainer>
								<Toaster
									position="bottom-center"
									closeButton={true}
									swipeToDismissDirection="left"
								/>
							</View>
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
				headerShown: false,
			}}
		/>
		<Stack.Screen
			name="MeasurementDetailScreen"
			component={MeasurementDetailScreen}
			options={{
				headerShown: false,
			}}
		/>
		<Stack.Screen
			name="HistoryScreen"
			component={HistoryScreen}
			options={{
				headerShown: false,
			}}
		/>
		<Stack.Screen
			name="StartSessionScreen"
			component={StartSessionScreen}
			options={{
				headerShown: false,
				gestureEnabled: false,
			}}
		/>
		<Stack.Screen
			name="JoinSessionScreen"
			component={JoinSessionScreen}
			options={{
				headerShown: false,
				gestureEnabled: false,
			}}
		/>
		<Stack.Screen
			name="MeasurementScreen"
			component={MeasurementScreen}
			options={{
				headerShown: false,
				gestureEnabled: false,
			}}
		/>
		<Stack.Screen
			name="SettingsScreen"
			component={SettingsScreen}
			options={{
				headerShown: false,
			}}
		/>
		<Stack.Screen
			name="QrScanScreen"
			component={QrScanScreen}
			options={{
				headerShown: false,
			}}
		/>
		<Stack.Screen
			name="QrViewScreen"
			component={QrViewScreen}
			options={{
				headerShown: false,
			}}
		/>
		<Stack.Screen
			name="LanguageScreen"
			component={LanguageScreen}
			options={{
				headerShown: false,
			}}
		/>
		<Stack.Screen
			name="DevSettingsScreen"
			component={DevSettingsScreen}
			options={{
				headerShown: false,
			}}
		/>
		<Stack.Screen
			name="CreateRoomScreen"
			component={CreateRoomScreen}
			options={{
				headerShown: false,
			}}
		/>
		<Stack.Screen
			name="RoomDetailScreen"
			component={RoomDetailScreen}
			options={{
				headerShown: false,
			}}
		/>
	</Stack.Navigator>
);

export type RootStackParamList = {
	HomeScreen: undefined;
	HistoryScreen: undefined;
	MeasurementDetailScreen: { item: Measurement };
	StartSessionScreen: undefined;
	JoinSessionScreen: undefined;
	MeasurementScreen: { deviceType: 'microphone' | 'speaker' };
	SettingsScreen: undefined;
	QrScanScreen: undefined;
	QrViewScreen: undefined;
	LanguageScreen: undefined;
	DevSettingsScreen: undefined;
	CreateRoomScreen: {
		roomId?: string;
		roomScene?: RoomScene;
		roomName?: string;
	};
	RoomDetailScreen: { roomId: string };
};
