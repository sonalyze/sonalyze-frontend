import { Audio } from 'expo-av';


const playTestTone = async () => {
    const { sound } = await Audio.Sound.createAsync(
        require('../assets/audio/sine_440.wav')
    );
    await sound.playAsync();
}