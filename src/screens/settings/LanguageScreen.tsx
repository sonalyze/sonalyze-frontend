import { FC, useState } from 'react';
import { View, Text } from 'react-native';
import SecondaryHeader from '../../components/SecondaryHeader';
import Button from '../../components/Button';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Deutsch', value: 'de' },
];

type LanguageScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'LanguageScreen'
>;

type LanguageScreenProps = {
  navigation: LanguageScreenNavigationProp;
};

const LanguageScreen: FC<LanguageScreenProps> = ({ navigation }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  return (
    <View className="flex-1 bg-background">
      <SecondaryHeader title="Change Language" onBack={() => navigation.pop()} />
      <View className="px-4 pt-6">

        {languages.map((lang) => (
          <View key={lang.value} className="mb-2">
            <Button
              label={lang.label}
              onPress={() => setSelectedLanguage(lang.value)}
              type={selectedLanguage === lang.value ? 'primary' : 'secondary'}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export default LanguageScreen;


