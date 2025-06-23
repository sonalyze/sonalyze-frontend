import { NativeModule, requireNativeModule } from 'expo';
import {
	NativeAudioModuleEvents,
	AudioStreamingOptions,
	AudioPlaybackOptions,
	FileRecordingResult,
	AudioStreamingResult,
	AudioPlaybackResult,
} from './NativeAudio.types';

declare class NativeAudioModule extends NativeModule<NativeAudioModuleEvents> {
	// Permission management
	requestMicrophonePermission(): Promise<boolean>;
	getAvailableAudioSessionModes(): string[];

	// File-based recording functions
	fileStartRecording(fileName: string, calibrationFactor: number): Promise<FileRecordingResult>;
	fileStopRecording(): Promise<FileRecordingResult>;
	isFileRecording(): boolean;
	deleteRecording(filePath: string): boolean;
	getRecordingData(filePath: string): Promise<{ 
		success: boolean; 
		data?: string; 
		error?: string; 
	}>;

	// Audio streaming functions
	startStreaming(
		options?: AudioStreamingOptions
	): Promise<AudioStreamingResult>;
	stopStreaming(): AudioStreamingResult;
	isStreaming(): boolean;
	setStreamingOptions(options: AudioStreamingOptions): boolean;

	// Audio playback functions
	playAudioFile(
		filePath: string,
		options?: AudioPlaybackOptions
	): Promise<AudioPlaybackResult>;
	stopAudioPlayback(): AudioPlaybackResult;
	isPlaying(): boolean;
}

export default requireNativeModule<NativeAudioModule>('NativeAudio');
