import { View, Text, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/lucide';
import { FC, ReactNode } from 'react';

type SecondaryHeaderProps = {
	title: string;
	onBack?: () => void;
	suffix?: ReactNode;
};

const SecondaryHeader: FC<SecondaryHeaderProps> = (
	props: SecondaryHeaderProps
) => {
	return (
		<View className="relative h-[60px] px-2 py-2 h-25 flex-row items-center">
			{props.onBack && (
				<TouchableOpacity onPress={props.onBack}>
					<Icon name="chevron-left" size={28} />
				</TouchableOpacity>
			)}
			<View className="ml-3 flex-1">
				<Text className="text-2xl color-foreground">{props.title}</Text>
			</View>
			{props.suffix && (
				<View className="flex-row items-center ml-auto">
					{props.suffix}
				</View>
			)}
		</View>
	);
};

export default SecondaryHeader;
