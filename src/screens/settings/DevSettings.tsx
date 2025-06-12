import { FC } from 'react';
import { View, FlatList, Text, TouchableHighlight, Alert } from 'react-native';
import SecondaryHeader from '../../components/SecondaryHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSettings } from '../../contexts/LocalSettingsContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';
import * as Haptics from 'expo-haptics';
import Card from '../../components/Card';
import Icon from '@react-native-vector-icons/lucide';
import Divider from '../../components/Divider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../../components/Button';
import Center from '../../components/Center';
import Swipeable from 'react-native-gesture-handler/Swipeable';

type DevSettingsScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'DevSettingsScreen'
>;

type DevSettingsScreenProps = {
	navigation: DevSettingsScreenNavigationProp;
};

const DevSettingsScreen: FC<DevSettingsScreenProps> = (
	props: DevSettingsScreenProps
) => {
	const { settings, updateSettings } = useLocalSettings();
	const { t } = useTranslation();

	async function onSelectServer(server: string) {
		await updateSettings({
			currentServer: server,
			userToken: '',
		});
	}

	async function onAddServer() {
		Alert.prompt(t('addServerTitle'), t('addServerDescr'), [
			{
				text: t('cancel'),
				style: 'cancel',
			},
			{
				text: t('save'),
				style: 'default',
				onPress: (input) => {
					if (input && !settings.servers.includes(input)) {
						updateSettings({
							servers: [...settings.servers, input],
						});
					}
				},
			},
		]);
	}

	async function onRemoveServer(server: string) {
		await updateSettings({
			servers: settings.servers.filter((s) => s !== server),
		});
	}

	async function onPurgeLocalStorage() {
		Alert.alert(t('purgeLocalStorageTitle'), t('purgeLocalStorageInfo'), [
			{
				text: t('cancel'),
				style: 'cancel',
			},
			{
				text: t('purge'),
				style: 'destructive',
				onPress: async () => {
					await AsyncStorage.clear();
					Haptics.notificationAsync(
						Haptics.NotificationFeedbackType.Warning
					);
					toast.warning(t('purgeSuccess'));
				},
			},
		]);
	}

	function ServerTile(server: string, deleteable: boolean) {
		return (
			<Swipeable
				overshootLeft={false}
				overshootRight={false}
				renderRightActions={
					deleteable
						? () => {
								return (
									<View className="flex-0 items-end">
										<Button
											type="destructive"
											label="Delete"
											expand={false}
											onPress={() =>
												onRemoveServer(server)
											}
										/>
									</View>
								);
							}
						: undefined
				}
			>
				<TouchableHighlight
					onPress={() => onSelectServer(server)}
					underlayColor="#dcdcdc40"
					className="rounded-lg bg-cardBackground"
				>
					<View className="flex-row p-3 items-center justify-start gap-3">
						<Text className="text-lg mr-auto">{server}</Text>

						{server === settings.currentServer && (
							<Icon name="check" size={20} />
						)}
					</View>
				</TouchableHighlight>
			</Swipeable>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<SecondaryHeader
				title={t('devSettings')}
				onBack={() => props.navigation.pop()}
			/>

			{/* Content */}
			<View className="px-4 pt-4 flex-1 justify-around">
				{/* Toggle edit mode */}

				<Text className="text-lg font-semibold text-foreground ml-1 px-4 pb-2">
					{t('backendServers')}
				</Text>

				<View className="flex-1">
					<Card>
						<FlatList
							bounces={false}
							data={settings.servers}
							keyExtractor={(item) =>
								item + settings.currentServer
							}
							renderItem={(item) =>
								ServerTile(
									item.item,
									// The two predefined servers and the currently selected server should not be deleteable.
									item.index > 1 &&
										item.item !== settings.currentServer
								)
							}
							ItemSeparatorComponent={() => (
								<Divider indent={8} verticalPadding={4} />
							)}
						/>
					</Card>
					<View className="h-3" />

					{/* Button to add a new backend server */}
					<Center>
						<Button
							label={t('addServer')}
							onPress={onAddServer}
							leadingIcon="plus"
							expand={false}
						/>
					</Center>
				</View>

				{/* Button to purge local storage */}
				<Center>
					<Button
						label={t('purgeLocalStorage')}
						onPress={onPurgeLocalStorage}
						type="destructive"
						expand={false}
					/>
				</Center>
			</View>
		</SafeAreaView>
	);
};

export default DevSettingsScreen;
