import { TouchableOpacity, Text, View } from 'react-native';
import { FC } from 'react';
import Icon from '@react-native-vector-icons/lucide';

type ButtonProps = {
	label: string;
	leadingIcon?: any;
	trailingIcon?: any;
	onPress: () => void;
	type?: 'primary' | 'secondary' | 'destructive' | 'ghost';
	expand?: boolean;
	className?: string;
};

const Button: FC<ButtonProps> = (props: ButtonProps) => {
	// Default properties.
	const type = props.type ?? 'primary';
	const expand = props.expand ?? true;
	const width = expand ? 'w-full' : 'w-fit';

	let backgroundColor: string;

	switch (type) {
		case 'primary':
			backgroundColor = 'bg-primary';
			break;
		case 'secondary':
			backgroundColor = 'bg-secondary';
			break;
		case 'destructive':
			backgroundColor = 'bg-destructive';
			break;
		case 'ghost':
			backgroundColor = 'bg-transparent';
			break;
	}

	let textColor: string;

	switch (type) {
		case 'primary':
			textColor = 'text-primaryForeground';
			break;
		case 'secondary':
			textColor = 'text-secondaryForeground';
			break;
		case 'destructive':
			textColor = 'text-destructiveForeground';
			break;
		case 'ghost':
			textColor = 'text-foreground';
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
