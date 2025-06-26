import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecondaryHeader from '../components/SecondaryHeader';
import { useTranslation } from 'react-i18next';

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

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={t('validation')}
				onBack={() => props.navigation.pop()}
			/>
		</SafeAreaView>
	);
};

export default ValidationScreen;
