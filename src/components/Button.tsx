import { TouchableOpacity, Text, View } from 'react-native';
import { FC, ReactElement } from 'react';

type ButtonProps = {
    label: string;
    leadingIcon?: ReactElement;
    trailingIcon?: ReactElement;
    onPress: () => void;
    type?: "primary" | "secondary" | "ghost";
    extend?: boolean;
    className?: string;
    disabled?: boolean;
};

const Button: FC<ButtonProps> = ({
    label,
    leadingIcon,
    trailingIcon,
    onPress,
    type = "primary",
    extend = true,
    className = "",
    disabled = false,
}) => {
    const width = extend ? "w-full" : "w-fit";

    let backgroundColor: string;
    let textColor: string;
    let iconColor: string;

    if (disabled) {
        backgroundColor = "bg-gray-300";
        textColor = "text-gray-500";
        iconColor = "#6b7280";
    } else {
        switch (type) {
            case "primary":
                backgroundColor = "bg-primary";
                textColor = "text-primaryForeground";
                iconColor = "#FFFFFF";
                break;
            case "secondary":
                backgroundColor = "bg-secondary";
                textColor = "text-secondaryForeground";
                iconColor = "#000000";
                break;
            case "ghost":
            default:
                backgroundColor = "bg-transparent";
                textColor = "text-foreground";
                iconColor = "#000000";
                break;
        }
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
                    <View style={{ paddingRight: 5 }}>
                        {leadingIcon}
                    </View>
                )}
                <Text className={`text-lg text-center font-semibold ${textColor}`}>
                    {label}
                </Text>
                {trailingIcon && (
                    <View style={{ paddingLeft: 5 }}>
                        {trailingIcon}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

export default Button;
