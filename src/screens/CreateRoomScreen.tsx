import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ScrollView, Swipeable } from 'react-native-gesture-handler';
import SecondaryHeader from '../components/SecondaryHeader';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import MultiInput from '../components/MutliInput';
import { createEmpyRoomScene, validateRoomScene } from '../tools/helpers';
import Button from '../components/Button';
import { showHapticErrorToast } from '../tools/hapticToasts';
import { createRoom, updateRoom, updateRoomScene } from '../api/roomRequests';
import MaterialDropdown from '../components/MaterialDropdown';
import {
	Armchair,
	BrickWall,
	Mic,
	Move3D,
	Speaker,
	TextCursor,
	X,
} from 'lucide-react-native';
import { RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

type ScreenRouteProp = RouteProp<RootStackParamList, 'CreateRoomScreen'>;
type CreateRoomNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'CreateRoomScreen'
>;

type CreateRoomScreenProps = {
	navigation: CreateRoomNavigationProp;
	route: ScreenRouteProp;
};

const CreateRoomScreen: React.FC<CreateRoomScreenProps> = (
	props: CreateRoomScreenProps
) => {
	const roomId = props.route.params.roomId;
	const initialRoomScene = props.route.params.roomScene;
	const queryClient = useQueryClient();

	const [scene, setScene] = useState<RoomScene>(
		initialRoomScene ?? createEmpyRoomScene()
	);
	const [roomName, setRoomName] = useState<string>(
		props.route.params.roomName || ''
	);

	const { t } = useTranslation();

	return (
		<SafeAreaView className="flex-1 p-2 bg-background">
			<SecondaryHeader
				title={t('createRoom.title')}
				onBack={() => props.navigation.goBack()}
			/>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{
					flexGrow: 1,
					paddingBottom: 20,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<Card className="mt-5">
					<View className="flex flex-row items-center gap-2 mb-2">
						<TextCursor size={20} className="text-muted" />
						<Text className="text-lg font-semibold my-auto">
							{t('createRoom.placeholders.roomName')}
						</Text>
					</View>
					<TextInput
						keyboardType="default"
						className="border border-gray-300 rounded-md p-2"
						placeholder={t('createRoom.placeholders.roomName')}
						value={roomName}
						onChange={(e) => setRoomName(e.nativeEvent.text)}
					/>
				</Card>

				<Card className="mt-5">
					<View className="flex flex-row items-center gap-2 mb-2">
						<Move3D size={20} className="text-muted" />
						<Text className="text-lg font-semibold my-auto">
							{t('createRoom.sections.dimensions')}
						</Text>
					</View>
					<MultiInput
						labels={['Width', 'Height', 'Depth']}
						onChange={(values) => {
							setScene((scene) => ({
								...scene,
								dimensions: {
									width: values[0].x ?? '0',
									height: values[0].y ?? '0',
									depth: values[0].z ?? '0',
								},
							}));
						}}
						values={[
							{
								x: scene.dimensions.width,
								y: scene.dimensions.height,
								z: scene.dimensions.depth,
							},
						]}
						notExpandable
					/>
				</Card>

				<Card className="mt-5">
					<View className="flex flex-row items-center gap-2 mb-2">
						<Armchair size={20} className="text-muted" />
						<Text className="text-lg font-semibold my-auto">
							{t('createRoom.sections.furniture')}
						</Text>
					</View>
					{scene.furniture.map((value, index) => (
						<Swipeable
							overshootLeft={false}
							overshootRight={false}
							key={index}
							renderRightActions={() => {
								return (
									<TouchableOpacity
										className="bg-red-500 flex mb-2 justify-center rounded-md px-2"
										onPress={() =>
											setScene((prev) => ({
												...prev,
												furniture: [
													...prev.furniture.filter(
														(_, i) => i !== index
													),
												],
											}))
										}
									>
										<X size={24} color="#fff" />
									</TouchableOpacity>
								);
							}}
						>
							<View
								key={index}
								className="bg-white rounded-xl gap-2 mb-2 px-4 py-2"
							>
								<MultiInput
									labels={['x', 'y']}
									onChange={(values) => {
										setScene((prev) => {
											const newFurniture = [
												...prev.furniture,
											];
											newFurniture[index] = {
												...newFurniture[index],
												points: values.map((v) => ({
													x: v.x,
													y: v.y,
												})),
											};
											return {
												...prev,
												furniture: newFurniture,
											};
										});
									}}
									values={value.points.map((f) => ({
										x: f.x,
										y: f.y,
									}))}
								/>
								<View className="flex justify-around m-2 mt-6">
									<Text className="m-auto mb-2">
										{t('common.height')}
									</Text>
									<TextInput
										keyboardType="decimal-pad"
										className="border border-gray-300 rounded-md w-2/3 m-auto p-2"
										placeholder={t('common.height')}
										value={value.height.toString()}
										onChange={(e) =>
											setScene((prev) => {
												const newFurniture = [
													...prev.furniture,
												];
												newFurniture[index] = {
													...newFurniture[index],
													height: e.nativeEvent.text.replaceAll(
														',',
														'.'
													),
												};
												return {
													...prev,
													furniture: newFurniture,
												};
											})
										}
									/>
								</View>
							</View>
						</Swipeable>
					))}
					<Button
						label={t('createRoom.buttons.addFurniture')}
						onPress={() => {
							setScene((prev) => ({
								...prev,
								furniture: [
									...prev.furniture,
									{
										height: '',
										points: [{ x: '', y: '' }],
									},
								],
							}));
						}}
						className="mt-2"
					/>
				</Card>

				<Card className="mt-5">
					<View className="flex flex-row items-center gap-2 mb-2">
						<Mic size={20} className="text-muted" />
						<Text className="text-lg font-semibold my-auto">
							{t('createRoom.sections.microphone')}
						</Text>
					</View>
					<MultiInput
						labels={['x', 'y', 'z']}
						onChange={(values) => {
							setScene((scene) => ({
								...scene,
								microphones: values as {
									x: string;
									y: string;
									z: string;
								}[],
							}));
						}}
						values={scene.microphones}
					/>
				</Card>
				<Card className="mt-5">
					<View className="flex flex-row items-center gap-2 mb-2">
						<Speaker size={20} className="text-muted" />
						<Text className="text-lg font-semibold my-auto">
							{t('createRoom.sections.speaker')}
						</Text>
					</View>
					<MultiInput
						labels={['x', 'y', 'z']}
						onChange={(values) => {
							setScene((scene) => ({
								...scene,
								speakers: values as {
									x: string;
									y: string;
									z: string;
								}[],
							}));
						}}
						values={scene.speakers}
					/>
				</Card>
				<Card className="mt-5">
					<View className="flex flex-row items-center gap-2 mb-2">
						<BrickWall size={20} className="text-muted" />
						<Text className="text-lg font-semibold my-auto">
							{t('createRoom.sections.materials')}
						</Text>
					</View>
					<MaterialDropdown
						onChange={(key, val) =>
							setScene((prev) => {
								return {
									...prev,
									materials: {
										...prev.materials,
										[key]: val,
									},
								};
							})
						}
						initialValues={
							roomId ? initialRoomScene?.materials : undefined
						}
					/>
				</Card>
				<Button
					label="Save Room"
					onPress={async () => {
						if (!roomName.trim()) {
							showHapticErrorToast('Please enter a room name');
							return;
						}
						const validate = validateRoomScene(scene);
						if (!validate.valid) {
							showHapticErrorToast(validate.errors.join('\n'));
							return;
						}
						queryClient.invalidateQueries({
							queryKey: ['rooms', 'roomScene'],
						});

						if (roomId && initialRoomScene) {
							await updateRoomScene(roomId, scene);
							console.log(roomName);
							await updateRoom(roomId, roomName);
							props.navigation.replace('RoomDetailScreen', {
								roomId: roomId,
							});
							return;
						}

						const result = await createRoom(roomName, scene);
						props.navigation.replace('RoomDetailScreen', {
							roomId: result.id,
						});
					}}
					className="mt-4"
				/>
			</ScrollView>
		</SafeAreaView>
	);
};

export default CreateRoomScreen;
