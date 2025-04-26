import { FC } from 'react';
import { Text, View } from 'react-native';

type ExampleComponentProps = {
	name: string;
	age: number;
};

const ExampleComponent: FC<ExampleComponentProps> = (
	props: ExampleComponentProps
) => {
	return (
		<View className="flex-1 items-center justify-center bg-gray-100">
			<Text className="font-bold text-lg mb-3">Page 2</Text>
			<Text>Name: {props.name}</Text>
			<Text>Alter: {props.age}</Text>
		</View>
	);
};

export default ExampleComponent;
