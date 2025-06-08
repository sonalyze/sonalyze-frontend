import { View, Text, ScrollView } from 'react-native';
import { FC } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import Tile from '../../components/Tile';
import SecondaryHeader from '../../components/SecondaryHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'SettingsScreen'
>;

type SettingsScreenProps = {
	navigation: SettingsScreenNavigationProp;
};

const SettingsScreen: FC<SettingsScreenProps> = (
	props: SettingsScreenProps
) => {
	const { t } = useTranslation();

	const classNames = {
		sectionLabel: 'text-lg font-semibold text-foreground ml-1 px-4 py-2',
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<SecondaryHeader
				title={t('settings')}
				onBack={() => props.navigation.pop()}
			/>

			{/* Content */}
			<ScrollView className="px-2 flex-grow" bounces={false}>
				{/* General Section */}
				<Text className={classNames.sectionLabel}>{t('general')}</Text>
				<Tile
					title={t('language')}
					subtitle={t('languageInfo')}
					trailingIcon="languages"
					onPress={() => props.navigation.push('LanguageScreen')}
				/>

				{/* Account Transfer Section */}
				<Text className={classNames.sectionLabel}>
					{t('accountTransfer')}
				</Text>
				<Tile
					title={t('showTransferCode')}
					subtitle={t('showTransferCodeInfo')}
					trailingIcon="qr-code"
					onPress={() => props.navigation.push('QrViewScreen')}
				/>
				<View className="h-3" />
				<Tile
					title={t('scanTransferCode')}
					subtitle={t('scanTransferCodeInfo')}
					trailingIcon="camera"
					onPress={() => props.navigation.push('QrScanScreen')}
				/>
				<Text className={classNames.sectionLabel}>{t('dev')}</Text>
				<Tile
					title={t('devSettings')}
					subtitle={'Advanced configuration options for developers.'}
					trailingIcon=""
					onPress={() => props.navigation.push('DevSettingsScreen')}
				/>
			</ScrollView>
		</SafeAreaView>
	);
};

export default SettingsScreen;
