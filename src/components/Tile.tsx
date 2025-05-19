import { View, Text, TouchableOpacity } from 'react-native'
import { FC } from 'react'
import Icon from "@react-native-vector-icons/lucide";

/**
 * Props for Tile.
 */
type TileProps = {
    title: string;
    subtitle: string;
    trailingIcon: any,
    onPress?: () => void;
};

/**
 * Reusable tile that displays a title, subtitle, and a trailing icon.
 * 
 * Can be made touchable by providing an onPress function.
 */
const Tile: FC<TileProps> = (props: TileProps) => {
    return (
        <TouchableOpacity onPress={props.onPress} disabled={!props.onPress}>
            <View className="px-4 py-3 rounded-xl bg-tileBackground flex-row items-center">
                {/* Title and Subtitle */}
                <View className="flex-1">
                    <Text className="text-lg font-semibold pb-1 color-tileForeground">{props.title}</Text>
                    <Text className="pb-2 color-tileForeground">{props.subtitle}</Text>
                </View>
                {/* Trailing Icon */}
                <View className="flex-0">
                    <Icon name={props.trailingIcon} size={24} color="#2e2e2e" />
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default Tile;