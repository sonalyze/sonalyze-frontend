import { View, Text, TouchableOpacity } from 'react-native';
import { FC } from 'react';
import Icon from '@react-native-vector-icons/lucide';

type TileProps = {
	title?: string;
	subtitle?: string;
	trailingIcon?: any;
	onPress?: () => void;
};

const Tile: FC<TileProps> = ({ title, subtitle, trailingIcon, onPress }) => {
	return (
		<TouchableOpacity onPress={onPress} disabled={!onPress}>
			<View className="bg-cardBackground px-5 py-4 rounded-xl flex-row items-center">
				<View className="flex-1 px-1 py-1">
					{/* Optional Title */}
					{title && (
						<Text className="text-xl font-bold pb-1 color-cardForeground">
							{title}
						</Text>
					)}

					{/* Optional Subtitle */}
					{subtitle && (
						<Text className="text-sm text-cardForeground">
							{subtitle}
						</Text>
					)}
				</View>

				{/* Trailing icon */}
				<View className="pl-2">
					<Icon name={trailingIcon} size={24} color="#2e2e2e" />
				</View>
			</View>
		</TouchableOpacity>
	);
};

export default Tile;
