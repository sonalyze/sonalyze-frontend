import { TouchableOpacity, Text, View } from 'react-native';
import { FC, ReactElement } from 'react';

type ButtonProps = {
	label: string;
	leadingIcon?: ReactElement;
	trailingIcon?: ReactElement;
	onPress: () => void;
	type?: 'primary' | 'secondary' | 'destructive' | 'ghost';
	expand?: boolean;
	className?: string;
	disabled?: boolean;
};



const Button: FC<ButtonProps> = (props: ButtonProps) => {
	// @TODO: Proper state.
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
	let iconColor: string;

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
			onPress={onPress}
			disabled={disabled}
			className={`rounded-xl px-4 py-3 ${width} ${backgroundColor} ${className}`}
			activeOpacity={0.8}
		>
			<View className="flex-row items-center justify-center">
				{leadingIcon && (
					<View >{leadingIcon}</View>
				)}
				{/* Label */}
				<Text
					className={`text-lg text-center font-semibold ${textColor}`}
				>
					{props.label}
				</Text>
				{trailingIcon && (
					<View >{trailingIcon}</View>
				)}
			</View>
		</TouchableOpacity>
	);
};

export default Button;
