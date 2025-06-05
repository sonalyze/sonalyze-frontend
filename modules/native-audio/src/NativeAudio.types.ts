export type AudioStreamingOptions = {
	bufferSize?: number;
};

export type AudioPlaybackOptions = {
	volume?: number;
};

export type FileRecordingResult =
	| {
			success: true;
			// TODO unite into one when usage is known & make not optional
			fileUri?: string;
			path?: string;
	  }
	| {
			success: false;
			error: string;
	  };

export type AudioStreamingResult =
	| { success: true }
	| {
			success: false;
			error: string;
	  };

export type AudioPlaybackResult =
	| { success: true }
	| {
			success: false;
			error: string;
	  };

export type AudioDataEvent = {
	data: number[];
	timestamp: number;
	sampleRate: number;
};

export type NativeAudioModuleEvents = {
	onAudioData: (event: AudioDataEvent) => void;
};
