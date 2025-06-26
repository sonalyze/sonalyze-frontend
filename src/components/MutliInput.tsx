import { FC, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import Button from './Button';

type MultiInputProps = {
	labels: string[];
	values: { x: number; y: number; z?: number }[];
	onChange: (values: { x: number; y: number; z?: number }[]) => void;
	notExpandable?: boolean;
};

const MultiInput: FC<MultiInputProps> = (props: MultiInputProps) => {
	const [values, setValues] = useState<
		{ x: string; y: string; z?: string }[]
	>(
		props.values.map((value) => ({
			x: value.x.toString(),
			y: value.y.toString(),
			z: value.z !== undefined ? value.z.toString() : undefined,
		}))
	);

	useEffect(() => {
		setValues(
			props.values.map((value) => ({
				x: value.x.toString(),
				y: value.y.toString(),
				z: value.z !== undefined ? value.z.toString() : undefined,
			}))
		);
	}, [props.values]);

	function hasOnlyValidNumbers() {
		for (const value of values) {
			if (value.x === '' || value.y === '' || value.z === '') {
				return false;
			}
		}
		return true;
	}

	function onSubmit() {
		if (hasOnlyValidNumbers())
			props.onChange(
				values.map((v) => ({
					x: parseFloat(v.x.replace(',', '.')),
					y: parseFloat(v.y.replace(',', '.')),
					z: v.z ? parseFloat(v.z.replace(',', '.')) : undefined,
				}))
			);
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
							keyboardType="decimal-pad"
							className="border border-gray-300 rounded-md p-2"
							placeholder="Mein toller Raum"
							value={value.x.toString()}
							onChange={(e) => {
								const newValues = [...values];
								newValues[index].x = e.nativeEvent.text;
								setValues(newValues);
							}}
							onBlur={onSubmit}
						/>
					</View>
					<View className="flex w-[28%]">
						{index === 0 && (
							<Text className="m-auto mb-2">
								{props.labels[1]}
							</Text>
						)}
						<TextInput
							keyboardType="numeric"
							className="border border-gray-300 rounded-md p-2"
							placeholder="Mein toller Raum"
							value={value.y.toString()}
							onChange={(e) => {
								const newValues = [...values];
								newValues[index].y = e.nativeEvent.text;
								setValues(newValues);
							}}
							onBlur={onSubmit}
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
								keyboardType="numeric"
								className="border border-gray-300 rounded-md p-2"
								placeholder="Mein toller Raum"
								value={value.z.toString()}
								onChange={(e) => {
									const newValues = [...values];
									newValues[index].z = e.nativeEvent.text;
									setValues(newValues);
								}}
								onBlur={onSubmit}
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
								x: '',
								y: '',
								z: values[0].z != null ? '' : undefined,
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
