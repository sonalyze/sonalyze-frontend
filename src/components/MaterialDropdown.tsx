import { FC, SetStateAction, useState } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import { materialKeys } from '../screens/CreateRoom.utils';
import { View } from 'react-native';
import rawMaterials from '../assets/materials.json';

const materials = rawMaterials as {
	label: string;
	value: string;
	type: ('floor' | 'ceiling' | 'wall')[];
}[];
const keys = ['east', 'west', 'north', 'south', 'floor', 'ceiling'] as const;

type MaterialKey = (typeof keys)[number];
type MaterialsOpenState = Record<MaterialKey, boolean>;
type MaterialsValueState = Record<MaterialKey, string | null>;

function getMaterials(key: MaterialKey) {
	const type = key === 'ceiling' || key === 'floor' ? key : 'wall';
	return materials.filter((m) => m.type.includes(type));
}

type MaterialDropdownProps = {
	onChange: (key: MaterialKey, value: string) => void;
};

const MaterialDropdown: FC<MaterialDropdownProps> = (props) => {
	const [open, setOpen] = useState<MaterialsOpenState>(
		materialKeys.reduce((acc, key) => {
			acc[key] = false;
			return acc;
		}, {} as MaterialsOpenState)
	);
	const [value, setValue] = useState<MaterialsValueState>(
		materialKeys.reduce((acc, key) => {
			acc[key] = null;
			return acc;
		}, {} as MaterialsValueState)
	);
	function setOpenByKey(
		key: MaterialKey,
		isOpenAction: SetStateAction<boolean>
	) {
		setOpen((prev) => {
			const isOpen =
				typeof isOpenAction === 'function'
					? (isOpenAction as (prev: boolean) => boolean)(prev[key])
					: isOpenAction;
			return {
				...prev,
				[key]: isOpen,
			};
		});
	}
	function setValueByKey(
		key: MaterialKey,
		newValueAction: SetStateAction<string | null>
	) {
		setValue((prev) => {
			const newValue =
				typeof newValueAction === 'function'
					? (
							newValueAction as (
								prev: string | null
							) => string | null
						)(prev[key])
					: newValueAction;
			if (newValue != null) {
				props.onChange(key, newValue);
			}
			return {
				...prev,
				[key]: newValue,
			};
		});
	}

	return (
		<>
			{keys.map((key) => {
				return (
					<View
						className="bg-gray-100 rounded-lg mb-3 h-12 justify-center"
						key={key}
					>
						<DropDownPicker
							open={open[key]}
							value={value[key]}
							items={getMaterials(key)}
							setOpen={(val) => setOpenByKey(key, val)}
							setValue={(val) => setValueByKey(key, val)}
							placeholder={'Choose a Material'}
							listMode="MODAL"
							modalProps={{
								animationType: 'slide',
								presentationStyle: 'overFullScreen',
							}}
							modalTitle="Select Material"
						/>
					</View>
				);
			})}
		</>
	);
};
export default MaterialDropdown;
