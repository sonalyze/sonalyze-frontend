import { FC } from 'react';
import { Text, View } from 'react-native';

//Tiles for HomeScreen

type CardProps = {
	title?: string;
	subtitle?: string;
	children?: React.ReactNode;
};

const Card: FC<CardProps> = ({ title, subtitle, children }) => {
	return (
		<View className="px-4 py-3 rounded-xl bg-cardBackground">
			{/* Title + Subtitle Group with space around */}
			{(title || subtitle) && (
				<View className="mb-2 px-2 py-2">
					{title && (
						<Text className="text-xl font-bold pb-1 color-cardForeground">
							{title}
						</Text>
					)}
					{subtitle && (
						<Text className="text-sm text-muted-foreground leading-relaxed">
							{subtitle}
						</Text>
					)}
				</View>
			)}

			{/* Children */}
			{children}
		</View>
	);
};

export default Card;
