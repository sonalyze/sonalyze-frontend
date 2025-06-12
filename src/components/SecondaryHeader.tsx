import { View, Text, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/lucide';
import { FC } from 'react';

type SecondaryHeaderProps = {
	title: string;
	onBack?: () => void;
	rightText?: string;
	onRightText?: () => void;
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
			{props.rightText && props.onRightText && (
				<TouchableOpacity
					onPress={props.onRightText}
					className="mr-3"
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<Text className="text-2xl color-[#007AFF]">
						{props.rightText}
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};

export default SecondaryHeader;
