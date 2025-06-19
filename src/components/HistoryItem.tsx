import { FC } from 'react';
import { View, Text } from 'react-native';
import Card from './Card';
import { format, Locale } from 'date-fns';
import { enUS, de, fr, es, it, tr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const localeMap: Record<string, Locale> = {
	de,
	fr,
	es,
	it,
	tr,
	en: enUS,
	enUS: enUS,
};

type HistoryItemProps = {
	item: {
		id: string;
		name: string;
		isOwner: boolean;
		createdAt: string;
	};
};

const HistoryItem: FC<HistoryItemProps> = ({ item }) => {
	// i18n für Lokalisierung von Text und Datum
	const { t, i18n } = useTranslation();
	const locale = localeMap[i18n.language] ?? enUS;
	const formattedDate = format(new Date(item.createdAt), 'P p', { locale });

	return (
		<Card className="mb-2 bg-white shadow-lg p-4">
			<View>
				<Text className="text-base font-medium">{item.name}</Text>
				<Text className="text-sm">
					{item.isOwner ? t('owner') : t('imported')}
				</Text>
				<Text className="text-sm">
					{t('dateLabel')}: {formattedDate}
				</Text>
			</View>
		</Card>
	);
};

export default HistoryItem;
