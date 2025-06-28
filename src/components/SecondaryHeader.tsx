import React, { FC, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

type SecondaryHeaderProps = {
	title: string;
	onBack?: () => void;
	suffix?: ReactNode;
};

const SecondaryHeader: FC<SecondaryHeaderProps> = (props) => {
	return (
		<View className="relative h-[60px] px-2 py-2 flex-row items-center">
			{props.onBack && (
				<TouchableOpacity
					onPress={props.onBack}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<ChevronLeft size={28} />
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
