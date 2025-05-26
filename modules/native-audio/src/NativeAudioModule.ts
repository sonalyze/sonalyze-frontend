import { NativeModule, requireNativeModule } from 'expo';
import {
  NativeAudioModuleEvents,
  AudioStreamingOptions,
  FileRecordingResult,
  AudioStreamingResult
} from './NativeAudio.types';

declare class NativeAudioModule extends NativeModule<NativeAudioModuleEvents> {
  // Permission management
  requestMicrophonePermission(): Promise<boolean>;
  getAvailableAudioSessionModes(): string[];

  // File-based recording functions
  fileStartRecording(fileName: string): Promise<FileRecordingResult>;
  fileStopRecording(): Promise<FileRecordingResult>;
  isFileRecording(): boolean;
  deleteRecording(filePath: string): boolean;

  // Audio streaming functions
  startStreaming(options?: AudioStreamingOptions): Promise<AudioStreamingResult>;
  stopStreaming(): AudioStreamingResult;
  isStreaming(): boolean;
  setStreamingOptions(options: AudioStreamingOptions): boolean;
}

export default requireNativeModule<NativeAudioModule>('NativeAudio');