import { Text, TextInput, View } from 'react-native';
import { RootStackParamList } from '../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import SecondaryHeader from '../components/SecondaryHeader';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import MultiInput from '../components/MutliInput';
import { createEmpyRoomScene } from '../tools/helpers';

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
									width: values[0].x ?? 0,
									height: values[0].y ?? 0,
									depth: values[0].z ?? 0,
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
						Microphones
					</Text>
					<MultiInput
						labels={['x', 'y', 'z']}
						onChange={(values) => {
							setScene((scene) => ({
								...scene,
								microphones: values as {
									x: number;
									y: number;
									z: number;
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
									x: number;
									y: number;
									z: number;
								}[],
							}));
						}}
						values={scene.speakers}
					/>
				</Card>
			</ScrollView>
		</SafeAreaView>
	);
};

export default CreateRoomScreen;
