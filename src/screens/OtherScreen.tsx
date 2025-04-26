import { FC } from 'react';
import { View } from 'react-native';
import ExampleComponent from '../components/ExampleComponent';

const OtherScreen: FC = () => {
	return (
		<View className="flex-1 items-center justify-center bg-gray-100">
			<ExampleComponent name="TestName" age={43} />
		</View>
	);
};

export default OtherScreen;
