import { FC } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable, TextInput } from 'react-native-gesture-handler';
import Button from './Button';
import { X } from 'lucide-react-native';

type MultiInputProps = {
	labels: string[];
	values: { x: string; y: string; z?: string }[];
	onChange: (values: { x: string; y: string; z?: string }[]) => void;
	notExpandable?: boolean;
};

const MultiInput: FC<MultiInputProps> = (props: MultiInputProps) => {
	return (
		<View className="flex flex-col justify-between gap-2">
			{props.values.map((value, index) => (
				<Swipeable
					overshootLeft={false}
					overshootRight={false}
					key={index}
					renderRightActions={
						!props.notExpandable
							? () => {
									return (
										<TouchableOpacity
											className="bg-red-500 flex justify-center rounded-md px-2"
											onPress={() =>
												props.onChange(
													props.values.filter(
														(_, i) => i !== index
													)
												)
											}
										>
											<X size={24} color="#fff" />
										</TouchableOpacity>
									);
								}
							: undefined
					}
				>
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
								placeholder={props.labels[0]}
								value={value.x.toString()}
								onChange={(e) => {
									const newValues = [...props.values];
									newValues[index].x =
										e.nativeEvent.text.replaceAll(',', '.');
									props.onChange(newValues);
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
								keyboardType="numeric"
								className="border border-gray-300 rounded-md p-2"
								placeholder={props.labels[1]}
								value={value.y.toString()}
								onChange={(e) => {
									const newValues = [...props.values];
									newValues[index].y =
										e.nativeEvent.text.replaceAll(',', '.');
									props.onChange(newValues);
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
									keyboardType="numeric"
									className="border border-gray-300 rounded-md p-2"
									placeholder={props.labels[2]}
									value={value.z.toString()}
									onChange={(e) => {
										const newValues = [...props.values];
										newValues[index].z =
											e.nativeEvent.text.replaceAll(
												',',
												'.'
											);
										props.onChange(newValues);
									}}
								/>
							</View>
						)}
					</View>
				</Swipeable>
			))}
			{!props.notExpandable && (
				<Button
					label="Add"
					onPress={() => {
						props.onChange([
							...props.values,
							{
								x: '',
								y: '',
								z: props.values[0].z != null ? '' : undefined,
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
