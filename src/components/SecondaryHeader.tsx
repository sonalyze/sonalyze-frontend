import React, { FC } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/lucide';

type SecondaryHeaderProps = {
  title: string;
  onBack?: () => void;
  // Optional text button
  rightText?: string;
  onRightText?: () => void;
  // Optional icon button props
  rightIconName?: React.ComponentProps<typeof Icon>['name'];
  onRightIconPress?: (id: string) => void;
  rightIconId?: string;
};

const SecondaryHeader: FC<SecondaryHeaderProps> = (props) => {
  const {
    title,
    onBack,
    rightText,
    onRightText,
    rightIconName,
    onRightIconPress,
    rightIconId,
  } = props;

  return (
    <View className="relative h-[60px] px-2 py-2 flex-row items-center">
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-left" size={28} />
        </TouchableOpacity>
      )}

      <View className="ml-3 flex-1">
        <Text className="text-2xl color-foreground">{title}</Text>
      </View>

      {rightIconName && onRightIconPress && rightIconId ? (
        <TouchableOpacity
          onPress={() => onRightIconPress(rightIconId)}
          className="mr-3"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name={rightIconName} size={24} />
        </TouchableOpacity>
      ) : (
        rightText &&
        onRightText && (
          <TouchableOpacity
            onPress={onRightText}
            className="mr-3"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-2xl color-[#007AFF]">
              {rightText}
            </Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
};

export default SecondaryHeader;
