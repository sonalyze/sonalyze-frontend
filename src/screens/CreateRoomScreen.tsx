import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { ScrollView, Swipeable } from 'react-native-gesture-handler';
import SecondaryHeader from '../components/SecondaryHeader';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import MultiInput from '../components/MutliInput';
import { createEmpyRoomScene, validateRoomScene } from '../tools/helpers';
import Button from '../components/Button';
import { showHapticErrorToast } from '../tools/hapticToasts';
import { createRoom } from '../api/roomRequests';
import MaterialDropdown from '../components/MaterialDropdown';
import { X } from 'lucide-react-native';

type CreateRoomNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'CreateRoomScreen'
>;

type CreateRoomScreenProps = {
	navigation: CreateRoomNavigationProp;
	roomId?: string;
	roomScene?: RoomScene;
};

const CreateRoomScreen: React.FC<CreateRoomScreenProps> = (
	props: CreateRoomScreenProps
) => {
	const [scene, setScene] = useState<RoomScene>(
		props.roomScene ?? createEmpyRoomScene()
	);
	const [roomName, setRoomName] = useState<string>('');

	const { t } = useTranslation();

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={t('createRoom.title')}
				onBack={() => props.navigation.goBack()}
			/>

			<ScrollView
				className="flex-1 px-5"
				contentContainerStyle={{
					flexGrow: 1,
					paddingBottom: 20,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<Card className="mt-5">
					<Text className="text-lg font-semibold mb-2">
						Room name
					</Text>
					<TextInput
						keyboardType="default"
						className="border border-gray-300 rounded-md p-2"
						placeholder="Mein toller Raum"
						value={roomName}
						onChange={(e) => setRoomName(e.nativeEvent.text)}
					/>
				</Card>

				<Card className="mt-5">
					<Text className="text-lg font-semibold mb-2">
						Room Dimensions
					</Text>
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
					<Text className="text-lg font-semibold mb-2">
						Furniture
					</Text>
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
									<Text className="m-auto mb-2">Height</Text>
									<TextInput
										keyboardType="decimal-pad"
										className="border border-gray-300 rounded-md w-2/3 m-auto p-2"
										placeholder="Mein toller Raum"
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
						label="Add"
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
					<Text className="text-lg font-semibold mb-2">
						Microphones
					</Text>
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
					<Text className="text-lg font-semibold mb-2">Speakers</Text>
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
					<Text className="text-lg font-semibold mb-2">
						Materials
					</Text>
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
						}

						const result = await createRoom(roomName, scene);
						props.navigation.replace('HistoryDetailScreen', {
							item: {
								id: result.id,
								name: result.name,
								lastUpdatedAt: result.lastUpdatedAt,
								hasSimulation: result.hasSimulation,
								isOwner: true,
							},
						});
					}}
					className="mt-4"
				/>
			</ScrollView>
		</SafeAreaView>
	);
};

export default CreateRoomScreen;
