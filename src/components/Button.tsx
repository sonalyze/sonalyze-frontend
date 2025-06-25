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
	const type = props.type ?? 'primary';
	const expand = props.expand ?? true;
	const width = expand ? 'w-full' : 'w-fit';

	let backgroundColor: string;
	let textColor: string;

    // Prüft, ob der Button deaktiviert ist, und passt die Farben an
	if (props.disabled) {
		backgroundColor = 'bg-gray-300';
		textColor = 'text-gray-500';
	} else {
		switch (type) {
			case 'primary':
				backgroundColor = 'bg-primary';
				textColor = 'text-primaryForeground';
				break;
			case 'secondary':
				backgroundColor = 'bg-secondary';
				textColor = 'text-secondaryForeground';
				break;
			case 'destructive':
				backgroundColor = 'bg-destructive';
				textColor = 'text-destructiveForeground';
				break;
			case 'ghost':
				backgroundColor = 'bg-transparent';
				textColor = 'text-foreground';
				break;
		}
	}


	return (
		<TouchableOpacity
			onPress={props.onPress}
			disabled={props.disabled}
			className={`rounded-xl px-4 py-3 ${width} ${backgroundColor} ${props.className}`}
			activeOpacity={props.disabled ? 1 : 0.8}
		>
			<View className="flex-row items-center justify-center">
				{props.leadingIcon ? (
					<View className="mr-2">{props.leadingIcon}</View>
				) : null}
				{/* Label */}
				<Text
					className={`text-lg text-center font-semibold ${textColor}`}
				>
					{props.label}
				</Text>
				{props.trailingIcon}
			</View>
		</TouchableOpacity>
	);
};

export default Button;