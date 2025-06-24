import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

type RoomDetailProps = {
  hasSimulation: boolean;
};

const RoomDetail: React.FC<RoomDetailProps> = ({ hasSimulation }) => {
  const { t } = useTranslation();
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold mb-1">{t('simulation')}</Text>
      <Text className="text-base">{hasSimulation ? t('yes') : t('no')}</Text>
    </View>
  );
};

export default RoomDetail;