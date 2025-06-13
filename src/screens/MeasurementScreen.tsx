import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecondaryHeader from '../components/SecondaryHeader';
import { useTranslation } from 'react-i18next';

type MeasurementScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'MeasurementScreen'
>;

type MeasurementScreenProps = {
	navigation: MeasurementScreenNavigationProp;
};

const MeasurementScreen: FC<MeasurementScreenProps> = (
	props: MeasurementScreenProps
) => {
	const { t } = useTranslation();
	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={t('joinSession')}
				onBack={() => props.navigation.pop()}
			/>
		</SafeAreaView>
	);
};

export default MeasurementScreen;
