import { FC } from 'react';
import { View, Text } from 'react-native';
import Card from './Card';
import { useTranslation } from 'react-i18next';
import { timeAgo } from '../tools/helpers';
import { ChartBar, House, Import, User } from 'lucide-react-native';

type HistoryItemProps = {
	item: {
		id: string;
		name: string;
		isOwner: boolean;
		createdAt: string;
	};
	type: 'measurement' | 'room';
};

const HistoryItem: FC<HistoryItemProps> = (props) => {
	const { item } = props;

	const { t } = useTranslation();

	return (
		<Card className="mb-2 bg-white  p-4">
			<View className="flex flex-row justify-between items-start">
				<View className="flex flex-row gap-2 items-start">
					{props.type === 'measurement' ? (
						<ChartBar size={30} className="text-muted" />
					) : (
						<House size={30} className="text-muted" />
					)}
					<Text className="my-auto text-base font-medium">
						{item.name}
					</Text>

					<Text className="my-auto bg-secondary text-black px-2 rounded-full">
						{timeAgo(item.createdAt)}
					</Text>
				</View>
				{item.isOwner ? (
					<View className="flex flex-row items-end gap-2">
						<Text className="my-auto">{t('owned')}</Text>
						<User size={30} className="text-muted my-auto" />
					</View>
				) : (
					<View className="flex flex-row items-end gap-2">
						<Text className="my-auto">{t('imported')}</Text>
						<Import size={30} className="text-muted my-auto" />
					</View>
				)}
			</View>
		</Card>
	);
};

export default HistoryItem;
