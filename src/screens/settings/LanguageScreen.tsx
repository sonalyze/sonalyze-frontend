import { FC } from 'react';
import { View, FlatList, Text, TouchableHighlight } from 'react-native';
import SecondaryHeader from '../../components/SecondaryHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { SafeAreaView } from 'react-native-safe-area-context';
import { locales } from '../../../locales/locales';
import { useLocalSettings } from '../../contexts/LocalSettingsContext';
import { useTranslation } from 'react-i18next';
import Card from '../../components/Card';
import Divider from '../../components/Divider';
import { Check } from 'lucide-react-native';

type LanguageScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'LanguageScreen'
>;

type LanguageScreenProps = {
	navigation: LanguageScreenNavigationProp;
};

const LanguageScreen: FC<LanguageScreenProps> = (
	props: LanguageScreenProps
) => {
	const { settings, updateSettings } = useLocalSettings();
	const { t } = useTranslation();

	// Callback for when a language is selected.
	async function onSelectLanguage(locale: string) {
		await updateSettings({
			locale: locale,
		});
	}

	return (
		<SafeAreaView className="flex-1 xl:max-w-3xl lg:mx-auto bg-background">
			{/* Header */}
			<SecondaryHeader
				title={t('language')}
				onBack={() => props.navigation.pop()}
			/>

			{/* Content */}
			<View className="px-4 pt-4 flex-1">
				{/* Display an option for each available language. */}
				<Card>
					<FlatList
						bounces={false}
						data={Object.keys(locales)}
						ItemSeparatorComponent={() => <Divider indent={8} />}
						renderItem={({ item }) => (
							<TouchableHighlight
								onPress={() => onSelectLanguage(item)}
								underlayColor="#dcdcdc40"
								className="rounded-lg"
							>
								<View className="flex-row p-3  justify-between">
									<Text className="text-lg">
										{locales[item].nativeName}
									</Text>

									{/* Display a checkmark if this is the selected language. */}
									{item === settings.locale && (
										<Check size={20} className="ml-auto" />
									)}
								</View>
							</TouchableHighlight>
						)}
					/>
				</Card>
			</View>
		</SafeAreaView>
	);
};

export default LanguageScreen;
