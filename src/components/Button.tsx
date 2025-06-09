import { TouchableOpacity, Text, View } from 'react-native';
import { FC } from 'react';
import Icon from '@react-native-vector-icons/lucide';

type ButtonProps = {
	label: string;
	leadingIcon?: any;
	trailingIcon?: any;
	onPress: () => void;
	type?: 'primary' | 'secondary' | 'ghost';
	extend?: boolean;
	className?: string;
};

const Button: FC<ButtonProps> = (props: ButtonProps) => {
	// Default properties.
	const type = props.type ?? 'primary';
	const extend = props.extend ?? true;
	const width = extend ? 'w-full' : 'w-fit';

	let backgroundColor: string;

	switch (type) {
		case 'primary':
			backgroundColor = 'bg-primary';
			break;
		case 'secondary':
			backgroundColor = 'bg-secondary';
			break;
		case 'ghost':
			backgroundColor = 'bg-transparent';
			break;
	}

	let textColor: string;

	switch (type) {
		case 'primary':
			textColor = 'primaryForeground';
			break;
		case 'secondary':
			textColor = 'text-secondaryForeground';
			break;
		case 'ghost':
			textColor = 'foreground';
			break;
	}

	return (
		<TouchableOpacity
			onPress={props.onPress}
			className={`rounded-xl px-4 py-3 ${width} ${backgroundColor} ${props.className}`}
		>
			<View className="flex-row items-center justify-center">
				{/* Leading Icon */}
				{props.leadingIcon && (
					<Icon
						name={props.leadingIcon}
						size={18}
						style={{ paddingRight: 5 }}
					/>
				)}
				{/* Label */}
				<Text
					className={`text-lg text-center font-semibold ${textColor}`}
				>
					{props.label}
				</Text>
				{/* Trailing Icon */}
				{props.trailingIcon && (
					<Icon
						name={props.trailingIcon}
						size={18}
						style={{ paddingLeft: 5 }}
					/>
				)}
			</View>
		</TouchableOpacity>
	);
};

export default Button;
