import React, { ReactNode } from 'react';
import { View } from 'react-native';

interface CenterProps {
	children: ReactNode;
}

const Center: React.FC<CenterProps> = (props: CenterProps) => {
	return (
		<View className="items-center justify-center">{props.children}</View>
	);
};

export default Center;
