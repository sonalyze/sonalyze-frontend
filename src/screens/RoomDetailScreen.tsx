import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { copyToClipboard } from '../tools/clipboardAccess';
import { Copy } from 'lucide-react-native';
import { Trash2 } from 'lucide-react-native';
import SecondaryHeader from '../components/SecondaryHeader';

import {
	deleteRoom,
	getRoomScene,
	importRoom,
	removeImportedRoom,
} from '../api/roomRequests';
import { formatWithOptions } from 'date-fns/fp';
import { enUS, de, fr, tr, it, es } from 'date-fns/locale';
import { RootStackParamList } from '../App';
import RoomDetail from '../components/RoomDetail';
import { FC } from 'react';
import { RouteProp } from '@react-navigation/native';
import Button from '../components/Button';

// Typen für Navigation und Route
type ScreenRouteProp = RouteProp<RootStackParamList, 'RoomDetailScreen'>;
type ScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'RoomDetailScreen'
>;
type RoomDetailScreenProps = {
	navigation: ScreenNavigationProp;
	route: ScreenRouteProp;
};
const RoomDetailScreen: FC<RoomDetailScreenProps> = (props) => {
	const { t, i18n } = useTranslation();
	const queryClient = useQueryClient();
	const { roomId } = props.route.params;
	const roomQuery = useQuery({
		queryKey: ['room', roomId],
		queryFn: () => importRoom(roomId),
	});
	const roomSceneQuery = useQuery({
		queryKey: ['roomScene', roomId],
		queryFn: () => getRoomScene(roomId),
	});
	const isOwner = roomQuery.data?.isOwner;

	// Zeigt ein Bestätigungs-Popup vor dem Löschen
	const confirmDelete = () => {
		Alert.alert(t('confirmDeletionTitle'), t('confirmDeletionMessage'), [
			{ text: t('cancel'), style: 'cancel' },
			{
				text: t('confirm'),
				style: 'destructive',
				onPress: () => handleDelete(roomQuery.data?.id || ''),
			},
		]);
	};

	const handleDelete = async (id: string) => {
		try {
			if (!isOwner) {
				await removeImportedRoom(id);
				toast.success(t('removeImportedRoomSuccess'));
			} else {
				await deleteRoom(id);
				toast.success(t('deleteRoomSuccess'));
			}

			await queryClient.invalidateQueries({ queryKey: ['measurements'] });
			await queryClient.invalidateQueries({ queryKey: ['rooms'] });
			props.navigation.goBack();
		} catch (err: unknown) {
			console.error('[Delete] failed:', err);
			let status: number | undefined;
			if (typeof err === 'object' && err !== null && 'response' in err) {
				const resp = (err as any).response;
				if (resp && typeof resp.status === 'number')
					status = resp.status;
			}
			if (status === 401) toast.error(t('unauthorizedError'));
			else if (status === 404) toast.error(t('notFoundError'));
			else if (status === 422) toast.error(t('invalidIdError'));
			else toast.error(t('genericError'));
		}
	};

	const localeMap: Record<string, typeof enUS> = {
		en: enUS,
		de,
		fr,
		tr,
		it,
		es,
	};
	const formatLocale = formatWithOptions({
		locale: localeMap[i18n.language] || enUS,
	});
	const getFormattedDate = (value: string | undefined) => {
		if (!value) {
			return '';
		}
		return i18n.language === 'de'
			? formatLocale("d. MMMM yyyy 'um' HH:mm 'Uhr'", new Date(value))
			: formatLocale('PPPp', new Date(value));
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={roomQuery.data?.name || ''}
				onBack={() => props.navigation.pop()}
				suffix={
					<TouchableOpacity onPress={confirmDelete}>
						<Trash2 size={24} />
					</TouchableOpacity>
				}
			/>

			<ScrollView className="p-4">
				<View className="flex-row items-center mb-2">
					<Text className="text-base text-muted">
						ID: {roomQuery.data?.id}
					</Text>
					<TouchableOpacity
						onPress={() => {
							copyToClipboard(roomQuery.data?.id || '');
							toast.success(t('copySuccess'));
						}}
						className="ml-2"
					>
						<Copy size={18} />
					</TouchableOpacity>
				</View>

				<Text className="text-base text-muted font-medium mb-2">
					{getFormattedDate(roomQuery.data?.lastUpdatedAt)}
				</Text>
				<Text className="text-base text-muted font-medium mb-4">
					{roomQuery.data?.isOwner ? 'Owner' : 'Imported'}
				</Text>
				<Button
					label={'Edit Room'}
					onPress={() =>
						props.navigation.replace('CreateRoomScreen', {
							roomId: roomQuery.data?.id,
							roomScene: roomSceneQuery.data,
							roomName: roomQuery.data?.name,
						})
					}
					type="primary"
					expand
					disabled={false}
				/>
				{roomQuery.data && (
					<RoomDetail
						roomId={roomQuery.data?.id}
						hasSimulation={roomQuery.data?.hasSimulation || false}
					/>
				)}
			</ScrollView>
		</SafeAreaView>
	);
};

export default RoomDetailScreen;
