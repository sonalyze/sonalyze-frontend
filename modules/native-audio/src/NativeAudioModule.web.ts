import { registerWebModule, NativeModule } from 'expo';
import {
  AudioDataEvent,
  AudioStreamingOptions,
  AudioPlaybackOptions,
  FileRecordingResult,
  AudioStreamingResult,
  AudioPlaybackResult,
  NativeAudioModuleEvents
} from './NativeAudio.types';

// This module is a placeholder for the web implementation of the NativeAudioModule.
// It does not implement any actual functionality, as web audio APIs are handled differently.
// The methods will log warnings to indicate that they are not implemented for web.

class NativeAudioModule extends NativeModule<NativeAudioModuleEvents> {
  // Permission management
  async requestMicrophonePermission(): Promise<boolean> {
    console.warn('NativeAudio: Microphone permissions are not implemented for web');
    return false;
  }

  getAvailableAudioSessionModes(): string[] {
    console.warn('NativeAudio: Audio session modes are not implemented for web');
    return [];
  }

  // File-based recording functions
  async fileStartRecording(fileName: string): Promise<FileRecordingResult> {
    console.warn('NativeAudio: File recording is not implemented for web');
    return { success: false, error: 'Not implemented for web' };
  }

  async fileStopRecording(): Promise<FileRecordingResult> {
    console.warn('NativeAudio: File recording is not implemented for web');
    return { success: false, error: 'Not implemented for web' };
  }

  isFileRecording(): boolean {
    return false;
  }

  deleteRecording(filePath: string): boolean {
    console.warn('NativeAudio: File operations are not implemented for web');
    return false;
  }

  // Audio streaming functions
  async startStreaming(options?: AudioStreamingOptions): Promise<AudioStreamingResult> {
    console.warn('NativeAudio: Audio streaming is not implemented for web');
    return { success: false, error: 'Not implemented for web' };
  }

  stopStreaming(): AudioStreamingResult {
    console.warn('NativeAudio: Audio streaming is not implemented for web');
    return { success: false, error: 'Not implemented for web' };
  }

  isStreaming(): boolean {
    return false;
  }

  setStreamingOptions(options: AudioStreamingOptions): boolean {
    console.warn('NativeAudio: Audio streaming is not implemented for web');
    return false;
  }

  // Audio playback functions
  async playAudioFile(filePath: string, options?: AudioPlaybackOptions): Promise<AudioPlaybackResult> {
    console.warn('NativeAudio: Audio playback is not implemented for web');
    return { success: false, error: 'Not implemented for web' };
  }

  stopAudioPlayback(): AudioPlaybackResult {
    console.warn('NativeAudio: Audio playback is not implemented for web');
    return { success: false, error: 'Not implemented for web' };
  }

  isPlaying(): boolean {
    return false;
  }
}

export default registerWebModule(NativeAudioModule, 'NativeAudio');