import './globals.css';
import './i18n';
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
import HistoryScreen from './screens/HistoryScreen';
import HistoryDetailScreen from './screens/HistoryDetailScreen';
import DevSettingsScreen from './screens/settings/DevSettings';

enableScreens();
const queryClient = new QueryClient();
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
	return (
		<SafeAreaProvider>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<LocalSettingsProvider>
					<QueryClientProvider client={queryClient}>
						<SocketProvider>
							<NavigationContainer>
								<Stack.Navigator
									screenOptions={{ headerShown: false }}
								>
									<Stack.Screen
										name="HomeScreen"
										component={HomeScreen}
									/>
									<Stack.Screen
										name="StartSessionScreen"
										component={StartSessionScreen}
									/>
									<Stack.Screen
										name="JoinSessionScreen"
										component={JoinSessionScreen}
									/>
									<Stack.Screen
										name="SettingsScreen"
										component={SettingsScreen}
									/>
									<Stack.Screen
										name="QrScanScreen"
										component={QrScanScreen}
									/>
									<Stack.Screen
										name="QrViewScreen"
										component={QrViewScreen}
									/>
									<Stack.Screen
										name="LanguageScreen"
										component={LanguageScreen}
									/>
									<Stack.Screen
										name="HistoryScreen"
										component={HistoryScreen}
									/>
									<Stack.Screen
										name="HistoryDetailScreen"
										component={HistoryDetailScreen}
									/>
									<Stack.Screen
										name="DevSettingsScreen"
										component={DevSettingsScreen}
									/>
								</Stack.Navigator>
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

const RootStack = () => (
	<Stack.Navigator screenOptions={{ headerShown: false }}>
		<Stack.Screen name="HomeScreen" component={HomeScreen} />
		<Stack.Screen
			name="StartSessionScreen"
			component={StartSessionScreen}
		/>
		<Stack.Screen name="JoinSessionScreen" component={JoinSessionScreen} />
		<Stack.Screen name="SettingsScreen" component={SettingsScreen} />
		<Stack.Screen name="QrScanScreen" component={QrScanScreen} />
		<Stack.Screen name="QrViewScreen" component={QrViewScreen} />
		<Stack.Screen name="LanguageScreen" component={LanguageScreen} />
		<Stack.Screen name="DevSettingsScreen" component={DevSettingsScreen} />
		<Stack.Screen name="HistoryScreen" component={HistoryScreen} />
		<Stack.Screen
			name="HistoryDetailScreen"
			component={HistoryDetailScreen}
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
	HistoryScreen: undefined;
	HistoryDetailScreen: { item: Measurement };
	DevSettingsScreen: undefined;
};
