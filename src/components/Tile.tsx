import { View, Text, TouchableOpacity } from 'react-native';
import { FC } from 'react';

type TileProps = {
	title?: string;
	subtitle?: string;
	trailingIcon?: React.ReactElement;
	onPress?: () => void;
};

const Tile: FC<TileProps> = ({ title, subtitle, trailingIcon, onPress }) => {
	return (
		<TouchableOpacity onPress={onPress} disabled={!onPress}>
			<View className="bg-cardBackground px-5 py-4 border border-gray-300 rounded-xl flex-row items-center">
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
				<View className="pl-2">{trailingIcon}</View>
			</View>
		</TouchableOpacity>
	);
};

export default Tile;
