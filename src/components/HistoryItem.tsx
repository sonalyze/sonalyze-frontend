import { FC } from 'react';
import { View, Text } from 'react-native';
import Card from './Card';
import { format } from 'date-fns';
import { enUS, de } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

type HistoryItemProps = {
	item: {
		id: string;
		name: string;
		isOwner: boolean;
		createdAt: string;
	};
};

const HistoryItem: FC<HistoryItemProps> = ({ item }) => {
	const { t, i18n } = useTranslation();

	const locale = i18n.language === 'de' ? de : enUS;
	const formattedDate = format(new Date(item.createdAt), 'P p', { locale });

	return (
		<Card className="mb-2 bg-white shadow-lg p-4">
			<View>
				<Text className="text-base font-medium">{item.name}</Text>
				<Text className="text-sm">
					{item.isOwner ? t('owner') : t('imported')}
				</Text>
				{/* Label and date value separate */}
				<Text className="text-sm">
					{t('dateLabel')}: {formattedDate}
				</Text>
			</View>
		</Card>
	);
};

export default HistoryItem;
