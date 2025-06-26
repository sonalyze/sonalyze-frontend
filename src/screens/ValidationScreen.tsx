import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecondaryHeader from '../components/SecondaryHeader';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TextInput, View } from 'react-native';
import Center from '../components/Center';
import Button from '../components/Button';

type ValidationScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'ValidationScreen'
>;

type ValidationScreenProps = {
	navigation: ValidationScreenNavigationProp;
};

const ValidationScreen: FC<ValidationScreenProps> = (
	props: ValidationScreenProps
) => {
	const { t } = useTranslation();

	const bier = [
		{
			name: 'G',
			default: '0',
			unit: 'dB',
		},
		{
			name: 'C50',
			default: '0',
			unit: 'dB',
		},
		{
			name: 'C80',
			default: '0',
			unit: 'dB',
		},
		{
			name: 'RT60',
			default: '0',
			unit: 'dB',
		},
		{
			name: 'D50',
			default: '0',
			unit: '%',
		},
	];

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={t('validation')}
				onBack={() => props.navigation.pop()}
			/>
			<ScrollView className="m-2">
				<View className="flex-row">
					<View className="flex-1">
						<Text className="text-center text-lg">
							{t('value')}
						</Text>
					</View>
					<View className="flex-1">
						<Text className="text-center text-lg">
							{t('tolerances')}
						</Text>
					</View>
				</View>

				{bier.map((item, index) => {
					return (
						<View
							key={index}
							className="flex-row items-center justify-between p-5 my-2"
						>
							<Text className="text-base flex-1">
								{item.name}
							</Text>
							<TextInput
								value={item.default}
								className="bg-secondary w-40 p-2 rounded-md"
							/>
							<Text className="text-base w-8 text-right ">
								{item.unit}
							</Text>
						</View>
					);
				})}

				<Center>
					<Button
						label={t('validate')}
						onPress={() => {}}
						expand={false}
					/>
				</Center>
			</ScrollView>
		</SafeAreaView>
	);
};

export default ValidationScreen;
