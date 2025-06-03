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

/**
 * Native Audio Module for web platform
 * 
 * Provides high-quality audio recording, streaming, and playback capabilities
 * optimized for audio analysis in web environments, matching the API
 * of the native iOS and Android implementations.
 */
class NativeAudioModule extends NativeModule<NativeAudioModuleEvents> {
  // ===== AUDIO CONFIGURATION =====
  private sampleRate = 48000;
  private bufferSize = 4096;
  private streamingOptions: AudioStreamingOptions = { bufferSize: 4096 };

  // ===== STATE TRACKING =====
  private isRecording = false;
  private isPlaybackActive = false;
  private isStreamingActive = false;

  // ===== AUDIO CONTEXTS AND PROCESSING NODES =====
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private analyserNode: AnalyserNode | null = null;
  private streamingIntervalId: number | null = null;

  // ===== STORAGE =====
  /**
   * Web implementation uses in-memory storage with virtual paths instead of
   * file system access (which is limited in browsers) to match the file-based
   * API of native implementations.
   */
  private recordingsStorage: Map<string, Blob> = new Map();

  // ===== INITIALIZATION AND CLEANUP =====
  constructor() {
    super();
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  /**
   * Cleans up all audio resources when the module is destroyed or page is unloaded
   * 
   * Ensures all active audio processes are properly stopped and resources released
   * to prevent memory leaks and hanging audio contexts.
   * 
   * Parameters:
   *   - None
   * 
   * Side effects:
   *   - Stops any active streaming session
   *   - Stops any active audio playback
   *   - Stops any active file recording session
   *   - Closes the audio context if it exists
   */
  private cleanup(): void {
    this.stopStreaming();
    this.stopAudioPlayback();
    if (this.isRecording) {
      this.fileStopRecording();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  /**
   * Creates or returns an existing AudioContext with configured sample rate
   * 
   * AudioContext is created only when needed to conserve system resources
   * and comply with browser autoplay policies.
   * 
   * Parameters:
   *   - None
   * 
   * Returns:
   *   - AudioContext: A Web Audio API context configured with the module's sample rate
   */
  private getOrCreateAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    }
    return this.audioContext;
  }

  // ===== PERMISSION MANAGEMENT =====
  /**
   * Requests microphone permission from the user
   * 
   * Attempts to access the user's microphone, triggering the browser's
   * permission request dialog if permission has not already been granted.
   * 
   * Parameters:
   *   - None
   * 
   * Returns:
   *   - Promise<boolean>: Resolves to true if permission was granted, false if denied
   * 
   * Side effects:
   *   - Creates and immediately releases a media stream to verify permissions
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.sampleRate,
          channelCount: 1
        }
      });

      const tracks = stream.getAudioTracks();
      for (const track of tracks) {
        track.stop();
      }

      return true;
    } catch (error) {
      console.warn('NativeAudio: Microphone permission denied', error);
      return false;
    }
  }

  /**
   * Returns available audio session modes for debugging purposes
   * 
   * This is a stub implementation as web doesn't have distinct audio session modes
   * like iOS. Provided for API compatibility with native implementations.
   * 
   * Parameters:
   *   - None
   * 
   * Returns:
   *   - string[]: Array containing only "default" as the web has no concept of audio modes
   */
  getAvailableAudioSessionModes(): string[] {
    return ["default"];
  }

  // ===== FILE-BASED RECORDING =====
  /**
   * Starts recording audio to a file with high quality settings
   * 
   * Creates a virtual file using WebM format
   * with the specified name and begins recording.
   * 
   * Parameters:
   *   - fileName: string - Name for the output file (will add .webm extension if needed)
   * 
   * Returns:
   *   - Promise<FileRecordingResult>: Object with the following keys:
   *     - success: boolean - Indicates if recording started successfully
   *     - fileUri: string - Virtual path to the recording file
   *     - path: string - Same as fileUri for API consistency
   *     - error: string - Description if an error occurred (only on failure)
   * 
   * Side effects:
   *   - Creates a MediaRecorder instance
   *   - Starts microphone capture
   *   - Sets isRecording state to true
   */
  async fileStartRecording(fileName: string): Promise<FileRecordingResult> {
    try {
      if (this.isRecording) {
        await this.fileStopRecording();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          /**
         * Disable audio processing to get clean, unprocessed audio data.
         * This matches the native implementations which also disable
         * similar audio effects for analysis purposes.
         */
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.sampleRate,
          channelCount: 1
        }
      });

      this.recordedChunks = [];

      /**
       * Web implementation uses WebM format instead of WAV (used in native)
       * because it's the most widely supported audio container format in browsers.
       */
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Start recording with 100ms chunks for smooth data collection
      this.mediaRecorder.start(100);
      this.isRecording = true;

      const normalizedFileName = fileName.endsWith('.webm') ? fileName : `${fileName}.webm`;
      const virtualPath = `/_expo_web_recording_/${normalizedFileName}`;

      return {
        success: true,
        fileUri: virtualPath,
        path: virtualPath
      };
    } catch (error) {
      console.error('NativeAudio: Recording error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown recording error'
      };
    }
  }

  /**
   * Stops the current file recording and completes the audio file
   * 
   * Stops the recording process, collects all recorded audio chunks,
   * combines them into a single Blob, and stores it in memory with a virtual path.
   * 
   * Parameters:
   *   - None
   * 
   * Returns:
   *   - Promise<FileRecordingResult>: Object with the following keys:
   *     - success: boolean - Indicates if recording was stopped successfully
   *     - fileUri: string - Virtual path to the recording file
   *     - path: string - Same as fileUri for API consistency
   *     - error: string - Description if an error occurred (only on failure)
   * 
   * Side effects:
   *   - Stops the MediaRecorder if active
   *   - Adds the recording to in-memory storage
   *   - Releases microphone access
   *   - Sets isRecording state to false
   */
  async fileStopRecording(): Promise<FileRecordingResult> {
    if (!this.isRecording || !this.mediaRecorder) {
      return { success: false, error: 'No active recording' };
    }

    try {
      const recordingPromise = new Promise<FileRecordingResult>((resolve) => {
        if (!this.mediaRecorder) return;

        this.mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(this.recordedChunks, {
            type: 'audio/webm'
          });

          const virtualPath = `/_expo_web_recording_/recording-${Date.now()}.webm`;

          this.recordingsStorage.set(virtualPath, audioBlob);

          if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
          }

          this.mediaRecorder = null;
          this.mediaStream = null;
          this.isRecording = false;

          console.log('Recording saved. Access with path:', virtualPath);

          resolve({
            success: true,
            fileUri: virtualPath,
            path: virtualPath
          });
        };
      });

      this.mediaRecorder.stop();
      return await recordingPromise;

    } catch (error) {
      console.error('NativeAudio: Error stopping recording', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error stopping recording'
      };
    }
  }

  /**
   * Checks if a file recording is currently in progress
   * 
   * Parameters:
   *   - None
   * 
   * Returns:
   *   - boolean: true if recording is active, false otherwise
   */
  isFileRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Deletes a previously recorded audio file
   * 
   * Removes a recording from in-memory storage based on its virtual file path
   * 
   * Parameters:
   *   - filePath: string - Virtual path to the recording file to delete
   * 
   * Returns:
   *   - boolean: true if file was successfully deleted, false if not found
   */
  deleteRecording(filePath: string): boolean {
    if (this.recordingsStorage.has(filePath)) {
      this.recordingsStorage.delete(filePath);
      return true;
    }
    return false;
  }

  // ===== AUDIO STREAMING =====
  /**
   * Starts streaming audio data to JavaScript in real-time
   * 
   * Sets up a continuous audio processing pipeline that captures
   * audio data and emits it as events at regular intervals.
   * 
   * Parameters:
   *   - options: AudioStreamingOptions (optional) - Configuration options:
   *     - bufferSize: number - Size of audio buffers in samples (affects latency)
   * 
   * Returns:
   *   - Promise<AudioStreamingResult>: Object with the following keys:
   *     - success: boolean - Indicates if streaming started successfully
   *     - error: string - Description if an error occurred (only on failure)
   * 
   * Side effects:
   *   - Creates an audio processing graph with AnalyserNode
   *   - Sets up a timer to periodically emit audio data events
   *   - Sets isStreamingActive state to true
   *   - Emits "onAudioData" events with audio buffers to JavaScript
   */
  async startStreaming(options?: AudioStreamingOptions): Promise<AudioStreamingResult> {
    try {
      if (this.isStreamingActive) {
        this.stopStreaming();
      }

      if (options?.bufferSize) {
        this.streamingOptions.bufferSize = options.bufferSize;
        this.bufferSize = options.bufferSize;
      }

      const audioContext = this.getOrCreateAudioContext();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.sampleRate,
          channelCount: 1
        }
      });

      const source = audioContext.createMediaStreamSource(this.mediaStream);

      /**
       * AnalyserNode provides FFT-based audio analysis capabilities.
       * fftSize must be double the buffer size to properly capture the full frequency range.
       * This is a Web Audio API constraint (fftSize must be a power of 2).
       */
      this.analyserNode = audioContext.createAnalyser();
      this.analyserNode.fftSize = this.bufferSize * 2;

      source.connect(this.analyserNode);

      const dataArray = new Float32Array(this.bufferSize);
      let timestamp = 0;

      this.isStreamingActive = true;
      /**
       * Web Audio doesn't have native buffer callbacks like native platforms.
       * Instead, we simulate buffer-based streaming using a timer with an interval
       * precisely calculated to match the buffer duration at the current sample rate.
       */
      this.streamingIntervalId = window.setInterval(() => {
        if (!this.analyserNode || !this.isStreamingActive) return;

        this.analyserNode.getFloatTimeDomainData(dataArray);

        this.emit("onAudioData", {
          data: Array.from(dataArray),
          timestamp: timestamp,
          sampleRate: audioContext.sampleRate
        });

        // Track time position for consistent buffer sequencing
        timestamp += this.bufferSize;
      }, 1000 * this.bufferSize / this.sampleRate);

      return { success: true };

    } catch (error) {
      console.error('NativeAudio: Streaming error', error);
      this.isStreamingActive = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown streaming error'
      };
    }
  }

  /**
   * Stops the audio streaming process and cleans up resources
   * 
   * Parameters:
   *   - None
   * 
   * Returns:
   *   - AudioStreamingResult: Object with the following keys:
   *     - success: boolean - Indicates if streaming was stopped successfully
   *     - error: string - Description if no active streaming was found
   * 
   * Side effects:
   *   - Clears the streaming interval timer
   *   - Stops and releases all media tracks
   *   - Sets analyserNode to null
   *   - Sets isStreamingActive state to false
   */
  stopStreaming(): AudioStreamingResult {
    if (!this.isStreamingActive) {
      return { success: false, error: 'No active streaming' };
    }

    if (this.streamingIntervalId !== null) {
      clearInterval(this.streamingIntervalId);
      this.streamingIntervalId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.analyserNode = null;
    this.isStreamingActive = false;

    return { success: true };
  }

  /**
   * Checks if audio streaming is currently active
   * 
   * Parameters:
   *   - None
   * 
   * Returns:
   *   - boolean: true if streaming is active, false otherwise
   */
  isStreaming(): boolean {
    return this.isStreamingActive;
  }

  /**
   * Updates streaming configuration options
   * 
   * Parameters:
   *   - options: AudioStreamingOptions - Configuration options:
   *     - bufferSize: number - New buffer size in samples
   * 
   * Returns:
   *   - boolean: true if options were successfully updated, false otherwise
   */
  setStreamingOptions(options: AudioStreamingOptions): boolean {
    if (options.bufferSize && options.bufferSize > 0) {
      this.streamingOptions.bufferSize = options.bufferSize;
      this.bufferSize = options.bufferSize;
      return true;
    }
    return false;
  }

  // ===== AUDIO PLAYBACK =====
  /**
   * Plays an audio file with specified options
   * 
   * Handles both external URLs and in-memory recordings via virtual paths.
   * Creates an HTMLAudioElement for playback.
   * 
   * Parameters:
   *   - filePath: string - Path or URL to the audio file
   *   - options: AudioPlaybackOptions (optional) - Configuration options:
   *     - volume: number - Volume level between 0.0 and 1.0
   * 
   * Returns:
   *   - Promise<AudioPlaybackResult>: Object with the following keys:
   *     - success: boolean - Indicates if playback started successfully
   *     - error: string - Description if an error occurred (only on failure)
   * 
   * Side effects:
   *   - Creates and starts an HTMLAudioElement
   *   - Sets isPlaybackActive state to true
   *   - Automatically handles cleanup when playback completes
   */
  async playAudioFile(filePath: string, options?: AudioPlaybackOptions): Promise<AudioPlaybackResult> {
    try {
      if (this.isPlaybackActive) {
        this.stopAudioPlayback();
      }

      let audioUrl = filePath;

      /**
       * Handle our virtual file system for recordings made in the web environment.
       * External URLs pass through unchanged, but in-memory recordings need to be
       * converted to object URLs for playback.
       */
      if (filePath.startsWith('/_expo_web_recording_/')) {
        const recordingBlob = this.recordingsStorage.get(filePath);
        if (!recordingBlob) {
          return {
            success: false,
            error: `Recording not found: ${filePath}`
          };
        }

        audioUrl = URL.createObjectURL(recordingBlob);
      }

      this.audioElement = new Audio(audioUrl);

      if (options?.volume !== undefined) {
        this.audioElement.volume = Math.max(0, Math.min(1, options.volume));
      }

      this.audioElement.onended = () => {
        this.isPlaybackActive = false;
        if (audioUrl !== filePath) {
          URL.revokeObjectURL(audioUrl);
        }
        this.audioElement = null;
      };

      const playPromise = this.audioElement.play();
      await playPromise;
      this.isPlaybackActive = true;

      return { success: true };
    } catch (error) {
      console.error('NativeAudio: Playback error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown playback error'
      };
    }
  }

  /**
   * Stops audio playback and releases resources
   * 
   * Parameters:
   *   - None
   * 
   * Returns:
   *   - AudioPlaybackResult: Object with the following keys:
   *     - success: boolean - Indicates if playback was stopped successfully
   *     - error: string - Description if no active playback was found
   * 
   * Side effects:
   *   - Pauses the audio element
   *   - Resets playback position
   *   - Sets audioElement to null
   *   - Sets isPlaybackActive state to false
   */
  stopAudioPlayback(): AudioPlaybackResult {
    if (!this.isPlaybackActive || !this.audioElement) {
      return { success: false, error: 'No active playback' };
    }

    try {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
      this.isPlaybackActive = false;
      return { success: true };
    } catch (error) {
      console.error('NativeAudio: Error stopping playback', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error stopping playback'
      };
    }
  }

  /**
   * Checks if audio playback is currently active
   * 
   * Parameters:
   *   - None
   * 
   * Returns:
   *   - boolean: true if playback is active, false otherwise
   */
  isPlaying(): boolean {
    return this.isPlaybackActive;
  }
}

export default registerWebModule(NativeAudioModule, 'NativeAudio');