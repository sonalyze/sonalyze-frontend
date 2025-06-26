import { FC, useState } from 'react';
import { KeyboardTypeOptions, Text, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import Button from './Button';

type MultiInputProps = {
	labels: string[];
	values: { x: number; y: number; z?: number }[];
	onChange: (values: { x: number; y: number; z?: number }[]) => void;
	notExpandable?: boolean;
	type?: KeyboardTypeOptions;
};

const MultiInput: FC<MultiInputProps> = (props: MultiInputProps) => {
	const [values, setValues] = useState<
		{ x: number | ''; y: number | ''; z?: number | '' }[]
	>([...props.values]);

	function hasOnlyValidNumbers() {
		for (const value of values) {
			if (value.x === '' || value.y === '' || value.z === '') {
				return false;
			}
		}
		return true;
	}

	return (
		<View className="flex flex-col justify-between gap-2">
			{values.map((value, index) => (
				<View className="flex flex-row justify-around" key={index}>
					<View className="flex w-[28%]">
						{index === 0 && (
							<Text className="m-auto mb-2">
								{props.labels[0]}
							</Text>
						)}
						<TextInput
							keyboardType={props.type}
							className="border border-gray-300 rounded-md p-2"
							placeholder="Mein toller Raum"
							value={value.x.toString()}
							onChange={(e) => {
								const newValues = [...values];
								if (e.nativeEvent.text === '') {
									newValues[index].x = '';
								} else {
									newValues[index].x = parseFloat(
										e.nativeEvent.text
									);
								}
								setValues(newValues);
							}}
							onSubmitEditing={() => {
								if (hasOnlyValidNumbers())
									props.onChange(
										values as {
											x: number;
											y: number;
											z?: number;
										}[]
									);
							}}
						/>
					</View>
					<View className="flex w-[28%]">
						{index === 0 && (
							<Text className="m-auto mb-2">
								{props.labels[1]}
							</Text>
						)}
						<TextInput
							keyboardType={props.type}
							className="border border-gray-300 rounded-md p-2"
							placeholder="Mein toller Raum"
							value={value.y.toString()}
							onChange={(e) => {
								const newValues = [...values];
								if (e.nativeEvent.text === '') {
									newValues[index].y = '';
								} else {
									newValues[index].y = parseFloat(
										e.nativeEvent.text
									);
								}
								setValues(newValues);
							}}
							onSubmitEditing={() => {
								if (hasOnlyValidNumbers())
									props.onChange(
										values as {
											x: number;
											y: number;
											z?: number;
										}[]
									);
							}}
						/>
					</View>
					{value.z !== undefined && (
						<View className="flex w-[28%]">
							{index === 0 && (
								<Text className="m-auto mb-2">
									{props.labels[2]}
								</Text>
							)}
							<TextInput
								keyboardType={props.type}
								className="border border-gray-300 rounded-md p-2"
								placeholder="Mein toller Raum"
								value={value.z.toString()}
								onChange={(e) => {
									const newValues = [...values];
									if (e.nativeEvent.text === '') {
										newValues[index].z = '';
									} else {
										newValues[index].z = parseFloat(
											e.nativeEvent.text
										);
									}
									setValues(newValues);
								}}
								onSubmitEditing={() => {
									if (hasOnlyValidNumbers())
										props.onChange(
											values as {
												x: number;
												y: number;
												z?: number;
											}[]
										);
								}}
							/>
						</View>
					)}
				</View>
			))}
			{!props.notExpandable && (
				<Button
					label="Add"
					onPress={() => {
						setValues((prevValues) => [
							...prevValues,
							{
								x: 0,
								y: 0,
								z: props.values[0].z != null ? 0 : undefined,
							},
						]);
					}}
					className="mt-2"
				/>
			)}
		</View>
	);
};

export default MultiInput;
