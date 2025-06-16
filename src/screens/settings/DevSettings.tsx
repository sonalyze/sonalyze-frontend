import { FC, useState } from 'react';
import {
	View,
	FlatList,
	Text,
	TouchableHighlight,
	TouchableOpacity,
	Alert,
} from 'react-native';
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
import Dialog from 'react-native-dialog';
import Divider from '../../components/Divider';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

	const [editMode, setEditMode] = useState(false);
	const [dialogVisible, setDialogVisible] = useState(false);
	const [input, setInput] = useState('');

	async function onSelectServer(server: string) {
		if (editMode) return;
		await updateSettings({
			currentServer: server,
		});
	}

	async function onAddServer() {
		const server = input.trim();
		if (!settings.servers.includes(server))
			await updateSettings({
				servers: [...settings.servers, server],
			});

		setDialogVisible(false);
		setInput('');
	}

	async function onRemoveServer(server: string) {
		if (settings.servers.indexOf(server) < 2) return;
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
				onPress: () => {
					AsyncStorage.clear();
					Haptics.notificationAsync(
						Haptics.NotificationFeedbackType.Warning
					);
					toast.info(t('purgeSuccess'));
				},
			},
		]);
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={t('devSettings')}
				onBack={() => props.navigation.pop()}
				rightText={!editMode ? t('edit') : t('done')}
				onRightText={() => setEditMode((e) => !e)}
			/>

			<View className="px-4 pt-4 flex-1 justify-around">
				<View className="flex-1">
					<Card>
						<FlatList
							bounces={false}
							data={settings.servers}
							ItemSeparatorComponent={() => (
								<Divider indent={8} />
							)}
							renderItem={({ item }) => (
								<TouchableHighlight
									onPress={() => onSelectServer(item)}
									underlayColor="#dcdcdc40"
									className="rounded-lg"
								>
									<View className="flex-row p-3  justify-start gap-3">
										{editMode && (
											<TouchableOpacity
												onPress={() =>
													onRemoveServer(item)
												}
												className="p-1 rounded-full bg-warnBackground"
											>
												<Icon
													name="minus"
													size={15}
													color="#fff"
												/>
											</TouchableOpacity>
										)}
										<Text className="text-lg mr-auto">
											{item}
										</Text>

										{item === settings.currentServer && (
											<Icon name="check" size={20} />
										)}
									</View>
								</TouchableHighlight>
							)}
						/>
					</Card>
					<View className="h-3" />

					<Card>
						<TouchableHighlight
							onPress={() => setDialogVisible(true)}
							underlayColor="#dcdcdc40"
							className="rounded-lg"
						>
							<View className="p-3">
								<Text className="color-editForeground text-xl">
									{t('addBackendServer')}
								</Text>
							</View>
						</TouchableHighlight>
					</Card>
				</View>
				<Card className="bg-red-800">
					<TouchableHighlight
						onPress={onPurgeLocalStorage}
						underlayColor="#dcdcdc40"
						className="rounded-lg"
					>
						<View className="p-3">
							<Text className="color-white text-xl">
								{t('purgeLocalStorage')}
							</Text>
						</View>
					</TouchableHighlight>
				</Card>
			</View>

			{/* Popup for entering custom backends */}
			<Dialog.Container visible={dialogVisible}>
				<Dialog.Title>{t('newServer')}</Dialog.Title>
				<Dialog.Description>{t('enterNewServer')}</Dialog.Description>
				<Dialog.Input
					value={input}
					onChangeText={setInput}
					autoCapitalize="none"
					autoCorrect={false}
				/>
				<Dialog.Button
					label={t('cancel')}
					onPress={() => setDialogVisible(false)}
				/>
				<Dialog.Button label={t('save')} onPress={onAddServer} />
			</Dialog.Container>
		</SafeAreaView>
	);
};

export default DevSettingsScreen;
