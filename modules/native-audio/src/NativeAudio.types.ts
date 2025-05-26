export type AudioStreamingOptions = {
  bufferSize?: number;
};

export type FileRecordingResult = {
  success: boolean;
  fileUri?: string;
  path?: string;
  error?: string;
};

export type AudioStreamingResult = {
  success: boolean;
  error?: string;
};

export type AudioDataEvent = {
  data: number[];
  timestamp: number;
  sampleRate: number;
};

export type NativeAudioModuleEvents = {
  onAudioData: (event: AudioDataEvent) => void;
};