import {
	Text,
	ScrollView,
	TouchableOpacity,
	View,
	ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC, useCallback, useEffect, useState } from 'react';
import Icon from '@react-native-vector-icons/lucide';
import Button from '../components/Button';
import Card from '../components/Card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNetworkState } from 'expo-network';
import { useLocalSettings } from '../contexts/LocalSettingsContext';
import { register } from '../api/userRequests';
import { axiosClient } from '../tools/helpers';
import { checkApiReachable } from '../api/generalRequests';

type HomeScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'HomeScreen'
>;

type HomeScreenProps = {
	navigation: HomeScreenNavigationProp;
};

const HomeScreen: FC<HomeScreenProps> = (props: HomeScreenProps) => {
	const { t } = useTranslation();
	const networkState = useNetworkState();
	const [isLoading, setLoading] = useState(false);
	const [isConnected, setConnected] = useState(false);
	const { settings, updateSettings, initial } = useLocalSettings();

	const refreshConnectionState = useCallback(async () => {
		// If the settings have not been loaded yet, do not do anything.
		if (initial) {
			return;
		}

		// Set base URL to currently selected backend server.
		axiosClient.defaults.baseURL = settings.currentServer;

		if (networkState.isInternetReachable !== true) {
			setConnected(false);
			return;
		}

		setLoading(true);

		// Add a delay so the app does not seem to flicker when showing the loading indicator.
		// This is reaaalllyy sketchy, I know.
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Check if the API is reachable.
		let isApiReachable = await checkApiReachable().then(
			(success) => success,
			() => false
		);

		// If the backend is not reachable.
		if (!isApiReachable) {
			setConnected(false);
			setLoading(false);
			return;
		}

		// If there is already a user token in the settings.
		if (settings.userToken) {
			setConnected(true);
			setLoading(false);
			return;
		}

		// Otherwise, obtain one from the server.
		try {
			const user = await register();
			await updateSettings({
				userToken: user.id,
			});
		} finally {
			setConnected(true);
			setLoading(false);
		}
	}, [networkState.isInternetReachable, settings, updateSettings, initial]);

	// Update state whenever the network state or the local settings change.
	useEffect(() => {
		refreshConnectionState();
	}, [
		networkState.isInternetReachable,
		settings,
		initial,
		refreshConnectionState,
	]);

	return (
		<SafeAreaView className="flex-1 bg-background">
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

			{/* Loading Indicator. */}
			{isLoading && (
				<View className="flex-1 items-center justify-center m-10 mb-24">
					<ActivityIndicator size="large" />
					<Text className="text-center text-lg pt-2">
						{t('connecting')}
					</Text>
				</View>
			)}

			{/* Connection Error. */}
			{!isLoading && !isConnected && (
				<View className="flex-1 items-center justify-center m-10 mb-24">
					<Icon name="cloud-alert" size={48} />
					<Text className="text-center text-lg">
						{t('connectionError')}
					</Text>
					<Text className="text-center pt-2 pb-4">
						{t('connectionErrorInfo')}
					</Text>
					<Button
						label="Retry"
						onPress={refreshConnectionState}
						expand={false}
						type="secondary"
					/>
				</View>
			)}

			{/* Page Content. */}
			{!isLoading && isConnected && (
				<ScrollView className="m-2">
					<Card
						title={t('cooperativeTitle')}
						subtitle={t('cooperativeSubtitle')}
					>
						<View className="flex-row gap-2">
							<View className="flex-1">
								<Button
									label={t('start')}
									onPress={() =>
										props.navigation.push(
											'StartSessionScreen'
										)
									}
								/>
							</View>
							<View className="flex-1">
								<Button
									label={t('join')}
									onPress={() =>
										props.navigation.push(
											'JoinSessionScreen'
										)
									}
								/>
							</View>
						</View>
					</Card>
					<View className="h-2" />
					<Card
						title={t('simulationTitle')}
						subtitle={t('simulationSubtitle')}
					>
						<View className="flex-row">
							<Button label={t('start')} onPress={() => {}} />
						</View>
					</Card>
				</ScrollView>
			)}
		</SafeAreaView>
	);
};

export default HomeScreen;
