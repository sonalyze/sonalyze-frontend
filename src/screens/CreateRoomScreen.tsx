import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { toast } from 'sonner-native';
import { useForm, useFieldArray } from 'react-hook-form';
import { X } from 'lucide-react-native';
import { createRoom } from '../api/roomRequests';
import SecondaryHeader from '../components/SecondaryHeader';
import DropDownPicker from 'react-native-dropdown-picker';
import Button from '../components/Button';
import {
	FormData,
	materialKeys,
	getOptionsForSurface,
	parseFloatWithDefault,
	requiredNumericRules,
	optionalNumericRules,
} from './CreateRoom.utils';
import { ControlledInput } from '../components/ControlledInput';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { SetStateAction, useState } from 'react';
import MaterialDropdown from '../components/MaterialDropdown';

type CreateRoomNavProp = NativeStackNavigationProp<
	RootStackParamList,
	'CreateRoomScreen'
>;
const CreateRoomScreen: React.FC = () => {
	const { t } = useTranslation();
	const navigation = useNavigation<CreateRoomNavProp>();
	const {
		control,
		handleSubmit,
		formState: { isValid, isSubmitting },
	} = useForm<FormData>({
		mode: 'onChange',
		defaultValues: {
			roomName: '',
			dimensions: { width: '', height: '', depth: '' },
			materials: {
				east: '',
				west: '',
				north: '',
				south: '',
				floor: '',
				ceiling: '',
			},
			furniture: [],
			microphone: [{ x: '', y: '', z: '' }],
			speaker: [{ x: '', y: '', z: '' }],
		},
	});
	const {
		fields: furnitureFields,
		append: appendFurniture,
		remove: removeFurniture,
	} = useFieldArray({ control, name: 'furniture' });
	const {
		fields: microphoneFields,
		append: appendMicrophone,
		remove: removeMicrophone,
	} = useFieldArray({ control, name: 'microphone' });
	const {
		fields: speakerFields,
		append: appendSpeaker,
		remove: removeSpeaker,
	} = useFieldArray({ control, name: 'speaker' });

	const onSubmit = async (data: FormData) => {
		try {
			const sceneData: RoomScene = {
				roomId: '',
				dimensions: {
					width: parseFloatWithDefault(data.dimensions.width),
					height: parseFloatWithDefault(data.dimensions.height),
					depth: parseFloatWithDefault(data.dimensions.depth),
				},
				materials: data.materials,
				furniture: data.furniture.map((f) => ({
					height: parseFloatWithDefault(f.height),
					points: [
						{
							x: parseFloatWithDefault(f.points.x),
							y: parseFloatWithDefault(f.points.y),
						},
					],
				})),
				microphones: data.microphone.map((m) => ({
					x: parseFloatWithDefault(m.x),
					y: parseFloatWithDefault(m.y),
					z: parseFloatWithDefault(m.z),
				})),
				speakers: data.speaker.map((s) => ({
					x: parseFloatWithDefault(s.x),
					y: parseFloatWithDefault(s.y),
					z: parseFloatWithDefault(s.z),
				})),
			};

			const result = await createRoom(data.roomName, sceneData);
			toast.success(t('toasts.success.title'), {
				description: t('toasts.createRoomSuccess.message', {
					name: result.name,
					id: result.id,
				}),
			});
			navigation.navigate('HistoryDetailScreen', {
				item: {
					id: result.id,
					name: result.name,
					lastUpdatedAt: result.lastUpdatedAt,
					hasSimulation: result.hasSimulation,
					isOwner: true,
				},
			});
		} catch (error) {
			console.error(error);
			toast.error(t('toasts.submitError.title'), {
				description:
					error instanceof Error
						? error.message
						: t('common.unknownError'),
			});
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={t('createRoom.title')}
				onBack={() => navigation.goBack()}
			/>

			<ScrollView
				className="flex-1 px-5"
				contentContainerStyle={{
					flexGrow: 1,
					paddingBottom: 20,
				}}
				keyboardShouldPersistTaps="handled"
			>
				{/* Allgemeine Informationen */}
				<View className="bg-white rounded-xl p-4 mb-2 border border-gray-200">
					<ControlledInput
						control={control}
						name="roomName"
						rules={{ required: true }}
						placeholder={t('createRoom.placeholders.roomName')}
					/>
				</View>

				{/* Raum-Dimensionen */}
				<View className="bg-white rounded-xl p-4 mb-2 border border-gray-200">
					<Text className="text-xl font-semibold mb-4 text-gray-700">
						{t('createRoom.sections.dimensions')}
					</Text>
					<View className="flex-row justify-between">
						<ControlledInput
							control={control}
							name="dimensions.width"
							rules={requiredNumericRules}
							placeholder={t('common.width')}
							keyboardType="numeric"
							containerClassName="flex-1 mx-1"
						/>
						<ControlledInput
							control={control}
							name="dimensions.height"
							rules={requiredNumericRules}
							placeholder={t('common.height')}
							keyboardType="numeric"
							containerClassName="flex-1 mx-1"
						/>
						<ControlledInput
							control={control}
							name="dimensions.depth"
							rules={requiredNumericRules}
							placeholder={t('common.depth')}
							keyboardType="numeric"
							containerClassName="flex-1 mx-1"
						/>
					</View>
				</View>

				{/* Möbel */}
				<View className="bg-white rounded-xl p-4 mb-2 border border-gray-200">
					<Text className="text-xl font-semibold mb-4 text-gray-700">
						{t('createRoom.sections.furniture')}
					</Text>
					{furnitureFields.map((field, index) => (
						<View
							key={field.id}
							className="p-3 mb-3 border border-gray-200 rounded-lg relative"
						>
							<View className="flex-row justify-between">
								<ControlledInput
									control={control}
									name={`furniture.${index}.height`}
									rules={optionalNumericRules}
									placeholder={t('common.height')}
									keyboardType="numeric"
									containerClassName="flex-1 mx-1"
								/>
								<ControlledInput
									control={control}
									name={`furniture.${index}.points.x`}
									rules={optionalNumericRules}
									placeholder={t('common.positionX')}
									keyboardType="numeric"
									containerClassName="flex-1 mx-1"
								/>
								<ControlledInput
									control={control}
									name={`furniture.${index}.points.y`}
									rules={optionalNumericRules}
									placeholder={t('common.positionY')}
									keyboardType="numeric"
									containerClassName="flex-1 mx-1"
								/>
							</View>
							<TouchableOpacity
								onPress={() => removeFurniture(index)}
								className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
							>
								<X size={16} color="white" />
							</TouchableOpacity>
						</View>
					))}
					<Button
						label={t('createRoom.buttons.addFurniture')}
						type="secondary"
						onPress={() =>
							appendFurniture({
								height: '',
								points: { x: '', y: '' },
							})
						}
					/>
				</View>

				{/* Mikrofon */}
				<View className="bg-white rounded-xl p-4 mb-2 border border-gray-200">
					<Text className="text-xl font-semibold mb-4 text-gray-700">
						{t('createRoom.sections.microphone')}
					</Text>
					{microphoneFields.map((field, index) => (
						<View
							key={field.id}
							className="p-3 mb-3 border border-gray-200 rounded-lg relative"
						>
							<View className="flex-row justify-between">
								<ControlledInput
									control={control}
									name={`microphone.${index}.x`}
									rules={requiredNumericRules}
									placeholder="X"
									keyboardType="numeric"
									containerClassName="flex-1 mx-1"
								/>
								<ControlledInput
									control={control}
									name={`microphone.${index}.y`}
									rules={requiredNumericRules}
									placeholder="Y"
									keyboardType="numeric"
									containerClassName="flex-1 mx-1"
								/>
								<ControlledInput
									control={control}
									name={`microphone.${index}.z`}
									rules={requiredNumericRules}
									placeholder="Z"
									keyboardType="numeric"
									containerClassName="flex-1 mx-1"
								/>
							</View>
							{microphoneFields.length > 1 && (
								<TouchableOpacity
									onPress={() => removeMicrophone(index)}
									className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
								>
									<X size={16} color="white" />
								</TouchableOpacity>
							)}
						</View>
					))}
					<Button
						label={t('createRoom.buttons.addMicrophone')}
						type="secondary"
						onPress={() =>
							appendMicrophone({ x: '', y: '', z: '' })
						}
					/>
				</View>

				{/* Lautsprecher */}
				<View className="bg-white rounded-xl p-4 mb-2 border border-gray-200">
					<Text className="text-xl font-semibold mb-4 text-gray-700">
						{t('createRoom.sections.speaker')}
					</Text>
					{speakerFields.map((field, index) => (
						<View
							key={field.id}
							className="p-3 mb-3 border border-gray-200 rounded-lg relative"
						>
							<View className="flex-row justify-between">
								<ControlledInput
									control={control}
									name={`speaker.${index}.x`}
									rules={requiredNumericRules}
									placeholder="X"
									keyboardType="numeric"
									containerClassName="flex-1 mx-1"
								/>
								<ControlledInput
									control={control}
									name={`speaker.${index}.y`}
									rules={requiredNumericRules}
									placeholder="Y"
									keyboardType="numeric"
									containerClassName="flex-1 mx-1"
								/>
								<ControlledInput
									control={control}
									name={`speaker.${index}.z`}
									rules={requiredNumericRules}
									placeholder="Z"
									keyboardType="numeric"
									containerClassName="flex-1 mx-1"
								/>
							</View>
							{speakerFields.length > 1 && (
								<TouchableOpacity
									onPress={() => removeSpeaker(index)}
									className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
								>
									<X size={16} color="white" />
								</TouchableOpacity>
							)}
						</View>
					))}
					<Button
						label={t('createRoom.buttons.addSpeaker')}
						type="secondary"
						onPress={() => appendSpeaker({ x: '', y: '', z: '' })}
					/>
				</View>

				{/* Wandmaterialien */}
				<View className="bg-white rounded-xl p-4 mb-2 border border-gray-200">
					<Text className="text-xl font-semibold mb-4 text-gray-700">
						{t('createRoom.sections.materials')}
					</Text>
					<MaterialDropdown />
				</View>

				{/* Button zum Absenden */}
				<View className="mt-2">
					<Button
						label={
							isSubmitting
								? t('common.submitting')
								: t('createRoom.buttons.create')
						}
						onPress={handleSubmit(onSubmit)}
						disabled={!isValid || isSubmitting}
						type="primary"
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default CreateRoomScreen;
