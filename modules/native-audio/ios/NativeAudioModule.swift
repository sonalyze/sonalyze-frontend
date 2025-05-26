import ExpoModulesCore
import AVFoundation

/**
 * Native Audio Module for high-quality audio recording and streaming
 * 
 * This module provides two different approaches to capture audio:
 * 1. File-based recording: Records a complete WAV file for analysis after recording completes
 * 2. Real-time streaming: Continuously provides audio buffer data for immediate analysis
 */
public class NativeAudioModule: Module {
  /**
   * High quality WAV recording settings optimized for audio analysis
   * 
   * - 48kHz sample rate: Professional standard, captures frequencies up to 24kHz
   * - 24-bit depth: Provides high dynamic range needed for detailed analysis
   * - Linear PCM format: Uncompressed to avoid artifacts from compression algorithms
   */
  private let wavSettings: [String: Any] = [
    AVFormatIDKey: kAudioFormatLinearPCM,
    AVSampleRateKey: 48000.0,
    AVNumberOfChannelsKey: 1,
    AVLinearPCMBitDepthKey: 24,
    AVLinearPCMIsFloatKey: false,
    AVLinearPCMIsBigEndianKey: false,
    AVLinearPCMIsNonInterleaved: false,
    AVEncoderAudioQualityKey: AVAudioQuality.max.rawValue
  ]
  
  // MARK: - File Recording Properties
  private var audioRecorder: AVAudioRecorder?
  
  // MARK: - Streaming Properties
  private var audioEngine: AVAudioEngine?
  private var inputNode: AVAudioInputNode?
  private var isStreamingActive = false
  
  /**
   * Size of audio buffers for streaming (in frames)
   * A value of 4096 balances between:
   * - Responsiveness: Lower values reduce latency but increase CPU usage
   * - Efficiency: Higher values are more efficient but introduce latency
   */
  private var streamBufferSize: AVAudioFrameCount = 4096
  
  public func definition() -> ModuleDefinition {
    Name("NativeAudio")
    
    Events("onAudioData")
    
    /**
     * Requests microphone permission from the user
     * 
     * Handles iOS version differences in permission APIs
     * 
     * Parameters:
     *   - promise: Promise object used to resolve the request asynchronously
     * 
     * Returns: 
     *   - Boolean value through the promise:
     *     - true: User granted microphone permission
     *     - false: User denied microphone permission
     */
    AsyncFunction("requestMicrophonePermission") { (promise: Promise) in
      if #available(iOS 17.0, *) {
        AVAudioApplication.requestRecordPermission { granted in
          promise.resolve(granted)
        }
      } else {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
          promise.resolve(granted)
        }
      }
    }
    
    /**
     * Returns available audio session modes for debugging purposes
     * 
     * Useful to check what recording modes are supported on different devices
     * 
     * Parameters:
     *   - None
     * 
     * Returns:
     *   - [String]: Array of string identifiers for all available audio modes
     */
    Function("getAvailableAudioSessionModes") { () -> [String] in
      let audioSession = AVAudioSession.sharedInstance()
      let modes = audioSession.availableModes
      let modeStrings = modes.map { $0.rawValue }
      print("Available audio session modes: \(modeStrings)")
      return modeStrings
    }

    // -----------------------------------------------------------------------
    // MARK: - File-based Recording Functions (for debugging and testing)
    
    /**
     * Starts recording audio to a WAV file
     * 
     * Uses measurement mode when available to capture raw, unprocessed audio
     * which is essential for accurate analysis
     * 
     * Parameters:
     *   - fileName: String that specifies the name of the output file
     *              ".wav" extension will be added automatically if not included
     * 
     * Returns:
     *   - Dictionary with the following keys:
     *     - "success": Boolean indicating if recording started successfully
     *     - "fileUri": String with the complete URI to the recording file (on success)
     *     - "path": String with the file system path to the recording (on success)
     *     - "error": String with error description (on failure)
     */
    AsyncFunction("fileStartRecording") { (fileName: String) -> [String: Any] in
      do {
        let audioSession = AVAudioSession.sharedInstance()
        
        // Measurement mode provides minimal signal processing for clean recording
        // Fall back to default mode if not available on the device
        let availableModes = audioSession.availableModes
        if availableModes.contains(.measurement) {
          try audioSession.setCategory(.record, mode: .measurement)
        } else {
          print("Measurement mode not available, falling back to default mode")
          try audioSession.setCategory(.record, mode: .default)
        }
        try audioSession.setActive(true)
        
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName.hasSuffix(".wav") ? fileName : "\(fileName).wav")
        
        audioRecorder = try AVAudioRecorder(url: fileURL, settings: wavSettings)
        
        if let recorder = audioRecorder, recorder.record() {
          return [
            "success": true,
            "fileUri": fileURL.absoluteString,
            "path": fileURL.path
          ]
        } else {
          return ["success": false, "error": "Failed to start recording"]
        }
      } catch {
        return ["success": false, "error": error.localizedDescription]
      }
    }
    
    /**
     * Stops the current file recording and releases audio resources
     * 
     * Returns the location of the recorded file for further processing
     * 
     * Parameters:
     *   - None
     * 
     * Returns:
     *   - Dictionary with the following keys:
     *     - "success": Boolean indicating if recording stopped successfully
     *     - "fileUri": String with the URI to the recorded file (on success)
     *     - "path": String with the file system path to the recording (on success)
     *     - "error": String with error description (on failure)
     * 
     * Side effects:
     *   - Sets audioRecorder to nil
     *   - Deactivates audio session
     */
    AsyncFunction("fileStopRecording") { () -> [String: Any] in
      guard let recorder = audioRecorder, recorder.isRecording else {
        return ["success": false, "error": "No active recording"]
      }
      
      recorder.stop()
      
      // Release audio resources to allow other apps to use audio
      do {
        try AVAudioSession.sharedInstance().setActive(false)
      } catch {
        print("Error deactivating audio session: \(error)")
      }
      
      let fileURL = recorder.url
      audioRecorder = nil
      
      return [
        "success": true,
        "fileUri": fileURL.absoluteString,
        "path": fileURL.path
      ]
    }
    
    /**
     * Checks if a file recording is currently in progress
     * 
     * Parameters:
     *   - None
     * 
     * Returns:
     *   - Boolean: true if recording is active, false otherwise
     */
    Function("isFileRecording") { () -> Bool in
      return audioRecorder?.isRecording ?? false
    }
    
    /**
     * Deletes a previously recorded audio file
     * 
     * Useful for cleanup after analysis is complete
     * 
     * Parameters:
     *   - filePath: String containing the full file system path to the file to delete
     * 
     * Returns:
     *   - Boolean: true if file was successfully deleted, false if an error occurred
     */
    Function("deleteRecording") { (filePath: String) -> Bool in
      let fileManager = FileManager.default
      do {
        try fileManager.removeItem(atPath: filePath)
        return true
      } catch {
        print("Error deleting file: \(error)")
        return false
      }
    }

    // -----------------------------------------------------------------------
    // MARK: - Streaming Functions
    
    /**
     * Starts real-time streaming of audio data
     * 
     * Uses AVAudioEngine to provide audio buffers as they're captured
     * This allows for immediate analysis without waiting for recording to complete
     * 
     * Parameters:
     *   - options: Optional dictionary that can include:
     *     - "bufferSize": Integer specifying buffer size in frames
     * 
     * Returns:
     *   - Dictionary with the following keys:
     *     - "success": Boolean indicating if streaming started successfully
     *     - "error": String with error description (on failure)
     * 
     * Emits events:
     *   - "onAudioData": Dictionary containing:
     *     - "data": Array of float audio samples
     *     - "timestamp": Integer sample time
     *     - "sampleRate": Float sample rate in Hz
     */
    AsyncFunction("startStreaming") { (options: [String: Any]?) -> [String: Any] in
      do {
        // Clean up any existing streaming session
        if isStreamingActive {
          stopAudioStreaming()
        }

        let audioSession = AVAudioSession.sharedInstance()
        
        // Use measurement mode for clean audio when available
        let availableModes = audioSession.availableModes
        if availableModes.contains(.measurement) {
          try audioSession.setCategory(.record, mode: .measurement)
        } else {
          try audioSession.setCategory(.record, mode: .default)
          print("Measurement mode not available, falling back to default mode")
        }
        try audioSession.setActive(true)
        
        // Allow custom buffer size configuration
        if let bufferSize = options?["bufferSize"] as? Int, bufferSize > 0 {
          streamBufferSize = AVAudioFrameCount(bufferSize)
        }
        
        audioEngine = AVAudioEngine()
        inputNode = audioEngine?.inputNode
        
        /**
         * Install a tap on the input node to receive audio buffers
         * 
         * The closure is called each time a new buffer of audio is available
         * [weak self] prevents memory leaks by avoiding reference cycles
         */
        inputNode?.installTap(onBus: 0, bufferSize: streamBufferSize, format: inputNode?.outputFormat(forBus: 0)) { [weak self] buffer, time in
          guard let self = self else { return }
          
          // Safely access the raw audio data pointers
          let channels = UnsafeBufferPointer(start: buffer.floatChannelData, count: Int(buffer.format.channelCount))
          var samples: [Float] = []
          
          // Extract audio samples from the buffer (assuming mono recording)
          if let channelData = channels.first {
            for i in 0..<Int(buffer.frameLength) {
              samples.append(channelData[i])
            }
          }
          
          // Forward audio data to JavaScript via event
          if !samples.isEmpty {
            self.sendEvent("onAudioData", [
              "data": samples,
              "timestamp": time.sampleTime,
              "sampleRate": buffer.format.sampleRate
            ])
          }
        }
        
        try audioEngine?.start()
        isStreamingActive = true
        
        return ["success": true]
      } catch {
        return ["success": false, "error": error.localizedDescription]
      }
    }
    
    /**
     * Stops the audio streaming process and cleans up resources
     * 
     * Parameters:
     *   - None
     * 
     * Returns:
     *   - Dictionary with the following keys:
     *     - "success": Boolean indicating if streaming was stopped successfully
     *     - "error": String with error description (if no active streaming)
     * 
     * Side effects:
     *   - Calls stopAudioStreaming() which releases all audio resources
     */
    Function("stopStreaming") { () -> [String: Any] in
      if isStreamingActive {
        stopAudioStreaming()
        return ["success": true]
      } else {
        return ["success": false, "error": "No active streaming"]
      }
    }
    
    /**
     * Checks if audio streaming is currently active
     * 
     * Parameters:
     *   - None
     * 
     * Returns:
     *   - Boolean: true if streaming is active, false otherwise
     */
    Function("isStreaming") { () -> Bool in
      return isStreamingActive
    }
    
    /**
     * Updates streaming configuration options
     * 
     * Parameters:
     *   - options: Dictionary containing configuration options:
     *     - "bufferSize": Integer specifying new buffer size in frames
     * 
     * Returns:
     *   - Boolean: true if options were successfully updated, false otherwise
     */
    Function("setStreamingOptions") { (options: [String: Any]) -> Bool in
      if let bufferSize = options["bufferSize"] as? Int, bufferSize > 0 {
        streamBufferSize = AVAudioFrameCount(bufferSize)
        return true
      }
      return false
    }
  }
  
  
  /**
   * Cleanly stops the audio streaming process and releases all resources
   * 
   * Called internally when stopping streaming or when starting a new stream
   * 
   * Side effects:
   *   - Removes tap from input node
   *   - Stops audio engine
   *   - Sets audioEngine, inputNode to nil
   *   - Sets isStreamingActive to false
   *   - Deactivates audio session
   */
  private func stopAudioStreaming() {
    inputNode?.removeTap(onBus: 0)
    
    audioEngine?.stop()
    audioEngine = nil
    inputNode = nil
    isStreamingActive = false
    
    do {
      try AVAudioSession.sharedInstance().setActive(false)
    } catch {
      print("Error deactivating audio session: \(error)")
    }
  }
}