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

type Props = {
  onLatencyResult: (result: { latency_seconds: number; lag_samples: number }) => void;
  onCorrelationData: (data: number[]) => void;
  onOriginalData?: (original: number[]) => void;
  onRecordedData?: (recorded: number[]) => void;
};

export default function AudioRecorder({
  onLatencyResult,
  onCorrelationData,
  onOriginalData,
  onRecordedData,
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [originalSweep, setOriginalSweep] = useState<Float32Array | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Lade Mikrofone und Sweep (nur Web)
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

    const loadSweep = async () => {
      try {
        const response = await fetch(require('../assets/audio/sweep_log_20Hz_20kHz.wav'));
        const arrayBuffer = await response.arrayBuffer();

        const audioCtx = new AudioContext();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        const sweepData = audioBuffer.getChannelData(0);
        setOriginalSweep(new Float32Array(sweepData));
        console.log("Sweep geladen:", sweepData.length, sweepData.slice(0, 10));
      } catch (err) {
        console.error('Sweep konnte nicht geladen werden:', err);
      }
    };

    loadSweep();
  }, []);

  // Aufnahme starten
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
      audioChunksRef.current = [];

      sendRecordingToBackend(float32, audioBuffer.sampleRate);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendRecordingToBackend = async (floatData: Float32Array, sampleRate: number) => {
    if (!originalSweep) {
      Alert.alert('Sweep fehlt', 'Das Original-Testsignal konnte nicht geladen werden.');
      return;
    }

    const payload = {
      sampleRate,
      original: Array.from(originalSweep),
      recorded: Array.from(floatData),
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/calibration/correlation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Serverfehler: ${response.status}`);

      const result = await response.json();

      onLatencyResult({
        latency_seconds: result.latency_seconds,
        lag_samples: result.lag_samples,
      });

      onCorrelationData(result.correlation);
      onOriginalData?.(Array.from(originalSweep));
      onRecordedData?.(Array.from(floatData));
    } catch (error) {
      console.error('Fehler beim Senden:', error);
      Alert.alert('❌ Fehler bei der Analyse im Backend');
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
});
