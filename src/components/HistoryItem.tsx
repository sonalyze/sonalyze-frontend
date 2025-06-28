import { FC } from 'react';
import { View, Text } from 'react-native';
import Card from './Card';
import { useTranslation } from 'react-i18next';
import { timeAgo } from '../tools/helpers';

type HistoryItemProps = {
	item: {
		id: string;
		name: string;
		isOwner: boolean;
		createdAt: string;
	};
};

const HistoryItem: FC<HistoryItemProps> = (props) => {
	const { item } = props;

	const { t } = useTranslation();

	return (
		<Card className="mb-2 bg-white  p-4">
			<View>
				<Text className="text-base font-medium">{item.name}</Text>
				<Text className="text-sm">
					{item.isOwner ? t('owner') : t('imported')}
				</Text>
				<Text className="text-sm">
					{t('dateLabel')}: {timeAgo(item.createdAt)}
				</Text>
			</View>
		</Card>
	);
};

export default HistoryItem;
