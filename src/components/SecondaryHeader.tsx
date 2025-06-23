import React, { FC } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, Trash2 } from 'lucide-react-native';

type SecondaryHeaderProps = {
	title: string;
	onBack?: () => void;
	rightText?: string;
	onRightText?: () => void;
	rightIcon?: React.ReactElement;
	onRightIconPress?: (id: string) => void;
	rightIconId?: string;
};

const SecondaryHeader: FC<SecondaryHeaderProps> = (props) => {
	const {
		title,
		onBack,
		rightText,
		onRightText,
		onRightIconPress,
		rightIconId,
    rightIcon,
	} = props;

	return (
		<View className="relative h-[60px] px-2 py-2 flex-row items-center">
			{onBack && (
				<TouchableOpacity
					onPress={onBack}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<ChevronLeft size={28} />
				</TouchableOpacity>
			)}

			<View className="ml-3 flex-1">
				<Text className="text-2xl color-foreground">{title}</Text>
			</View>

			{rightIcon && onRightIconPress && rightIconId ? (
				<TouchableOpacity
					onPress={() => onRightIconPress(rightIconId)}
					className="mr-3"
				>
					{rightIcon}
				</TouchableOpacity>
			) : (
				rightText &&
				onRightText && (
					<TouchableOpacity
						onPress={onRightText}
						className="mr-3"
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<Text className="text-2xl color-[#007AFF]">
							{rightText}
						</Text>
					</TouchableOpacity>
				)
			)}
		</View>
	);
};

export default SecondaryHeader;
