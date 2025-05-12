import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Button,
  StyleSheet,
  Platform,
  Text,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [floatData, setFloatData] = useState<Float32Array | null>(null);
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Lade Mikrofone (nur Web)
  useEffect(() => {
    if (Platform.OS === 'web') {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
        navigator.mediaDevices.enumerateDevices().then((allDevices) => {
          const mics = allDevices.filter((d) => d.kind === 'audioinput');
          setDevices(mics);
          setSelectedDeviceId(mics[0]?.deviceId);
        });
      }).catch((err) => {
        Alert.alert('Mikrofonfehler', err.message);
      });
    }
  }, []);

  // Starte Aufnahme
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
      },
    });

    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const arrayBuffer = await blob.arrayBuffer();

      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const float32 = audioBuffer.getChannelData(0);
      setSampleRate(audioBuffer.sampleRate);
      setFloatData(float32);
      audioChunksRef.current = [];

      // Senden an Backend
      sendRecordingToBackend(float32, audioBuffer.sampleRate);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  // Stoppe Aufnahme
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Sende an Backend
  const sendRecordingToBackend = async (floatData: Float32Array, sampleRate: number) => 
    {
    // Payload vorbereiten
    const payload = {
      sampleRate,
      signal: Array.from(floatData),
    };

    try {
      const response = await fetch('http://localhost:8000/api/impulse-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Serverfehler: ${response.status}`);
      }

      const result = await response.json();
      console.log('Backend-Antwort:', result);
      Alert.alert(`📊 ${result.samples} Samples, Dauer: ${result.duration_s}s`);
    } catch (error) {
      console.error('Fehler beim Senden:', error);
      Alert.alert('❌ Fehler beim Senden ans Backend');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🎙 Mikrofon auswählen</Text>
      <Picker
        selectedValue={selectedDeviceId}
        onValueChange={(itemValue) => setSelectedDeviceId(itemValue)}
        style={styles.picker}
      >
        {devices.map((device) => (
          <Picker.Item
            key={device.deviceId}
            label={device.label || 'Unbekanntes Mikrofon'}
            value={device.deviceId}
          />
        ))}
      </Picker>

      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={isRecording ? stopRecording : startRecording}
      />

      {floatData && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>✅ Aufnahme abgeschlossen</Text>
          <Text>📏 Länge: {floatData.length} Samples</Text>
          <Text>🔍 Erste 5 Werte:</Text>
          <Text>
            {Array.from(floatData.slice(0, 5)).map((v) =>
              v.toFixed(5)
            ).join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    marginBottom: 20,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  resultBox: {
    marginTop: 30,
    backgroundColor: '#e0f7fa',
    padding: 15,
    borderRadius: 10,
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});
