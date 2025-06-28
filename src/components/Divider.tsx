// Thanks to Parthiba Sugumar, available under:
// https://medium.com/@prathiba2796/simple-custom-divider-component-in-react-native-f6d7c01eba58

import React from 'react';
import { View } from 'react-native';

type DividerProps = {
	width?: number;
	indent?: number;
	orientation?: 'horizontal' | 'vertical';
	verticalPadding?: number;
	color?: string;
	dividerStyle?: any;
};

const Divider: React.FC<DividerProps> = ({
	width = 1,
	indent = 0,
	orientation = 'horizontal',
	verticalPadding = 0,
	color = '#DFE4EA',
	dividerStyle,
}) => {
	return (
		<View
			style={{
				width: orientation === 'horizontal' ? '100%' : width,
				height: orientation === 'vertical' ? '100%' : width,
				marginVertical:
					orientation === 'horizontal' ? verticalPadding : 0,
				backgroundColor: color,
				marginLeft: indent,
				...dividerStyle,
			}}
		/>
	);
};

export default Divider;
