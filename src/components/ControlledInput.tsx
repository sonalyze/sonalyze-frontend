import { TextInput, TextInputProps } from 'react-native';
import { Controller, Control, Path, RegisterOptions, FieldValues } from 'react-hook-form';

// Props-Typ mit Generics für maximale Wiederverwendbarkeit
interface ControlledInputProps<TFieldValues extends FieldValues> extends TextInputProps {
    control: Control<TFieldValues>;
    name: Path<TFieldValues>;
    rules?: Omit<RegisterOptions<TFieldValues, Path<TFieldValues>>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'>;
    containerClassName?: string;
}

/**
 * Eine wiederverwendbare, generische Komponente, die einen TextInput mit einem react-hook-form Controller verbindet.
 * Sie reduziert Redundanz und vereinfacht das Formular-Layout.
 */
export function ControlledInput<TFieldValues extends FieldValues>({ 
    control, 
    name, 
    rules, 
    placeholder, 
    containerClassName, 
    ...props 
}: ControlledInputProps<TFieldValues>) {
    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                    className={`bg-gray-100 h-12 rounded-lg px-4 text-base ${containerClassName}`}
                    placeholder={placeholder}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    {...props} // Übergibt alle weiteren TextInput-Props (z.B. keyboardType)
                />
            )}
        />
    );
}
