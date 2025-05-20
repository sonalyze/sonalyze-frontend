import { TouchableOpacity, Text } from 'react-native';
import { FC } from 'react';

type ButtonProps = {
	label: string;
	onPress: () => void;
	type?: 'primary' | 'secondary';
	className?: string;
};

const Button: FC<ButtonProps> = ({
	label,
	onPress,
	type = 'primary',
	className,
}) => {
	const baseStyles = 'w-full rounded-xl px-4 py-4';
	const bgClass = type === 'primary' ? 'bg-primary' : 'bg-gray-200'; // or bg-gray-300 if you want darker

	const textColor = type === 'primary' ? 'text-black' : 'text-black'; // You can change this if needed

	return (
		<TouchableOpacity
			onPress={onPress}
			className={`${baseStyles} ${bgClass} ${className ?? ''}`}
		>
			<Text className={`text-lg text-center font-semibold ${textColor}`}>
				{label}
			</Text>
		</TouchableOpacity>
	);
};

export default Button;
