import { View, Text, ScrollView } from 'react-native';
import { FC } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import Tile from '../../components/Tile';
import SecondaryHeader from '../../components/SecondaryHeader';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'SettingsScreen'
>;

type SettingsScreenProps = {
	navigation: SettingsScreenNavigationProp;
};

const SettingsScreen: FC<SettingsScreenProps> = (props: SettingsScreenProps) => {
	const classNames = {
		sectionLabel: "text-lg font-semibold text-foreground ml-1 px-4 pt-4 pb-2",
	};

	return (
		<View className="flex-1 bg-background">
			{/* Header */}
			<SecondaryHeader
				title="Settings"
				onBack={() => props.navigation.pop()}
			/>

			{/* Content */}
			<ScrollView className="m-2 flex-grow">
				{/* General Section */}
				<Text className={classNames.sectionLabel}>
					General
				</Text>
				<Tile
					title="Language"
					subtitle="Choose the app language."
					trailingIcon="languages"
					onPress={() => props.navigation.push('LanguageScreen')}
				/>

				{/* Sync Section */}
				<Text className={classNames.sectionLabel}>
					Sync
				</Text>
				<Tile
					title="Your Account QR Code"
					subtitle="Shows a QR code on this device to transfer your account to another device."
					trailingIcon="qr-code"
					onPress={() => props.navigation.push('QrViewScreen')}
				/>
				<View className="h-3" />
				<Tile
					title="Scan Account QR Code"
					subtitle="Transfer your account from another device to this device by scanning the QR code."
					trailingIcon="camera"
					onPress={() => props.navigation.push('QrScanScreen')}
				/>
			</ScrollView>
		</View>
	);
};

export default SettingsScreen;