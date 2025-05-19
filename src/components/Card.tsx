import Icon from "@react-native-vector-icons/lucide";
import { FC } from "react";
import { Text, View } from "react-native";

// @TODO: Comment and clean up.

type CardProps = {
	title?: string;
	subtitle?: string;
	children?: React.ReactNode;
};

const Card: FC<CardProps> = (props: CardProps) => {
	return (
		<View className="px-4 py-3 rounded-xl bg-cardBackground">
			{/* Title and Subtitle */}
			{props.title && <Text className="text-lg font-semibold pb-1 color-cardForeground">{props.title}</Text>}
			{props.subtitle && <Text className="pb-2 color-cardForeground">{props.subtitle}</Text>}

			{/* Children */}
			{props.children}
		</View>
	);
};

export default Card;