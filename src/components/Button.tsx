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
    // NEU: Die 'disabled'-Eigenschaft als optionalen boolean hinzufügen.
    disabled?: boolean;
};

// GEÄNDERT: Destructuring der Props für bessere Lesbarkeit.
const Button: FC<ButtonProps> = ({
    label,
    leadingIcon,
    trailingIcon,
    onPress,
    type = "primary", // Standardwerte direkt hier setzen.
    extend = true,
    className = "",
    disabled = false, // 'disabled' aus den Props holen, Standard ist false.
}) => {
    const width = extend ? "w-full" : "w-fit";

    let backgroundColor: string;
    let textColor: string;
    let iconColor: string; // NEU: Farbe für die Icons definieren

    // NEU: Logik für den deaktivierten Zustand.
    // Wenn der Button deaktiviert ist, überschreiben wir die normalen Farben.
    if (disabled) {
        backgroundColor = "bg-gray-300"; // Ein neutrales Grau für den Hintergrund
        textColor = "text-gray-500";   // Etwas dunkleres Grau für den Text
        iconColor = "#6b7280";         // Passende Hex-Farbe für Icons (text-gray-500)
    } else {
        // Die normale Logik, wenn der Button NICHT deaktiviert ist.
        switch (type) {
            case "primary":
                backgroundColor = "bg-primary";
                textColor = "text-primaryForeground";
                iconColor = "#FFFFFF"; // Annahme: primärer Vordergrund ist weiß
                break;
            case "secondary":
                backgroundColor = "bg-secondary";
                textColor = "text-secondaryForeground";
                iconColor = "#000000"; // Annahme: sekundärer Vordergrund ist schwarz/dunkel
                break;
            case "ghost":
            default:
                backgroundColor = "bg-transparent";
                textColor = "text-foreground";
                iconColor = "#000000"; // Annahme: normaler Vordergrund ist schwarz/dunkel
                break;
        }
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            // NEU: Die 'disabled'-Prop wird hier direkt an TouchableOpacity übergeben.
            // Das deaktiviert die onPress-Funktion und das visuelle Feedback beim Drücken.
            disabled={disabled}
            className={`rounded-xl px-4 py-3 ${width} ${backgroundColor} ${className}`}
            activeOpacity={0.8}
        >
            <View className="flex-row items-center justify-center">
                {/* Leading Icon */}
                {leadingIcon && (
                    <Icon
                        name={leadingIcon}
                        size={18}
                        // NEU: Icon-Farbe wird dynamisch gesetzt
                        color={iconColor}
                        style={{ paddingRight: 5 }}
                    />
                )}
                {/* Label */}
                <Text className={`text-lg text-center font-semibold ${textColor}`}>
                    {label}
                </Text>
                {/* Trailing Icon */}
                {trailingIcon && (
                    <Icon
                        name={trailingIcon}
                        size={18}
                        // NEU: Icon-Farbe wird dynamisch gesetzt
                        color={iconColor}
                        style={{ paddingLeft: 5 }}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
};

export default Button;