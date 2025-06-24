import { FC } from 'react';
import { Text, View } from 'react-native';

type CardProps = {
	title?: string;
	subtitle?: string;
	children?: React.ReactNode;
	className?: string;
};

const Card: FC<CardProps> = (props: CardProps) => {
	return (
		<View className={`px-4 py-3 rounded-xl bg-cardBackground  ${props.className}`}>
			{/* Title + Subtitle Group with space around */}
			{(props.title || props.subtitle) && (
				<View className="mb-2 px-2 py-2 ">
					{props.title && (
						<Text className="text-xl font-bold pb-1 color-cardForeground">
							{props.title}
						</Text>
					)}
					{props.subtitle && (
						<Text className="text-sm text-muted-foreground leading-relaxed">
							{props.subtitle}
						</Text>
					)}
				</View>
			)}

			{/* Children */}
			{props.children}
		</View>
	);
};

export default Card;
