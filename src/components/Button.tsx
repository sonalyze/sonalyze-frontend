import { TouchableOpacity, Text, View } from 'react-native';
import { FC } from 'react';
import Icon from '@react-native-vector-icons/lucide';

type ButtonProps = {
    label: string;
    leadingIcon?: any;
    trailingIcon?: any;
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
                    <Icon
                        name={leadingIcon}
                        size={18}
                        color={iconColor}
                        style={{ paddingRight: 5 }}
                    />
                )}
                <Text className={`text-lg text-center font-semibold ${textColor}`}>
                    {label}
                </Text>
                {trailingIcon && (
                    <Icon
                        name={trailingIcon}
                        size={18}
                        color={iconColor}
                        style={{ paddingLeft: 5 }}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
};

export default Button;
