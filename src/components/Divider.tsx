// Thanks to Parthiba Sugumar, available under:
// https://medium.com/@prathiba2796/simple-custom-divider-component-in-react-native-f6d7c01eba58

import React from 'react';
import { View } from 'react-native';

type DividerProps = {
	width?: number;
	indent?: number;
	orientation?: 'horizontal' | 'vertical';
	color?: string;
	dividerStyle?: any;
};

const Divider: React.FC<DividerProps> = ({
	width = 1,
	indent = 0,
	orientation = 'horizontal',
	color = '#DFE4EA',
	dividerStyle,
}) => {
	return (
		<View
			style={{
				width: orientation === 'horizontal' ? '100%' : width,
				height: orientation === 'vertical' ? '100%' : width,
				backgroundColor: color,
				marginLeft: indent,
				...dividerStyle,
			}}
		/>
	);
};

export default Divider;
