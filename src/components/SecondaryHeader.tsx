import { View, Text, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/lucide';
import { FC } from 'react';

type SecondaryHeaderProps = {
	title: string;
	onBack?: () => void;
};

const SecondaryHeader: FC<SecondaryHeaderProps> = ({ title, onBack }) => {
	return (
		<View className="relative h-[60px] px-2 py-2 h-25 flex-row items-center">
			{onBack && (
				<TouchableOpacity onPress={onBack}>
					<Icon name="chevron-left" size={28} />
				</TouchableOpacity>
			)}
			<View className="ml-3 flex-1">
				<Text className="text-2xl color-foreground">{title}</Text>
			</View>
		</View>
	);
};

export default SecondaryHeader;
