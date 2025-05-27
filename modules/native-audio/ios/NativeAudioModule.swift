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

  // MARK: - Playback Properties
  private var audioPlayerNode: AVAudioPlayerNode?
  private var audioFile: AVAudioFile?
  private var isPlaybackActive = false
  private var playbackEngine: AVAudioEngine?
  
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
      log(.debug, message: "Starting permission request")
      
      if #available(iOS 17.0, *) {
        AVAudioApplication.requestRecordPermission { granted in
          log(.info, message: "Permission \(granted ? "granted" : "denied") after request")
          promise.resolve(granted)
        }
      } else {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
          log(.info, message: "Permission \(granted ? "granted" : "denied") after request")
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
      log(.debug, message: "Function called")
      
      let audioSession = AVAudioSession.sharedInstance()
      let modes = audioSession.availableModes
      let modeStrings = modes.map { $0.rawValue }
      
      log(.info, message: "Available modes: \(modeStrings)")
      log(.debug, message: "Returning \(modeStrings.count) available modes")
      
      return modeStrings
    }

    // -----------------------------------------------------------------------
    // MARK: - File-based Recording Functions (for debugging and testing)
    
    AsyncFunction("fileStartRecording") { (fileName: String) -> [String: Any] in
      log(.info, message: "Starting with filename '\(fileName)'")
      
      do {
        let audioSession = AVAudioSession.sharedInstance()
        
        // Measurement mode provides minimal signal processing for clean recording
        let availableModes = audioSession.availableModes
        if availableModes.contains(.measurement) {
          try audioSession.setCategory(.record, mode: .measurement)
          log(.info, message: "Using MEASUREMENT audio mode for clean recording")
        } else {
          try audioSession.setCategory(.record, mode: .default)
          log(.warning, message: "Measurement mode not available, falling back to DEFAULT mode")
        }
        try audioSession.setActive(true)
        
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName.hasSuffix(".wav") ? fileName : "\(fileName).wav")
        log(.debug, message: "Recording to file: \(fileURL.path)")
        
        audioRecorder = try AVAudioRecorder(url: fileURL, settings: wavSettings)
        
        if let recorder = audioRecorder, recorder.record() {
          log(.info, message: "Recording started successfully")
          return [
            "success": true,
            "fileUri": fileURL.absoluteString,
            "path": fileURL.path
          ]
        } else {
          log(.error, message: "Failed to start recording")
          return ["success": false, "error": "Failed to start recording"]
        }
      } catch {
        log(.error, message: "Exception occurred: \(error.localizedDescription)")
        return ["success": false, "error": error.localizedDescription]
      }
    }
    
    AsyncFunction("fileStopRecording") { () -> [String: Any] in
      log(.debug, message: "Function called")
      
      guard let recorder = audioRecorder, recorder.isRecording else {
        log(.warning, message: "No active recording found")
        return ["success": false, "error": "No active recording"]
      }
      
      let path = recorder.url.path
      log(.info, message: "Stopping recording with output at \(path)")
      
      recorder.stop()
      log(.debug, message: "Recording stopped successfully")
      
      // Release audio resources to allow other apps to use audio
      do {
        try AVAudioSession.sharedInstance().setActive(false)
        log(.debug, message: "Audio session deactivated")
      } catch {
        log(.error, message: "Error deactivating audio session: \(error.localizedDescription)")
      }
      
      let fileURL = recorder.url
      audioRecorder = nil
      
      if FileManager.default.fileExists(atPath: fileURL.path) {
        let fileSize = try? FileManager.default.attributesOfItem(atPath: fileURL.path)[.size] as? Int64
        log(.info, message: "WAV file confirmed at \(fileURL.path) (\(fileSize ?? 0) bytes)")
      } else {
        log(.warning, message: "File doesn't exist at expected path: \(fileURL.path)")
      }
      
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
      log(.debug, message: "Attempting to delete file at path: \(filePath)")
      
      let fileManager = FileManager.default
      
      if !fileManager.fileExists(atPath: filePath) {
        log(.warning, message: "File not found at path: \(filePath)")
        return false
      }
      
      log(.debug, message: "File exists, attempting deletion")
      
      do {
        try fileManager.removeItem(atPath: filePath)
        log(.info, message: "File successfully deleted: \(filePath)")
        return true
      } catch {
        log(.error, message: "Exception while deleting file: \(error.localizedDescription)")
        return false
      }
    }

    // -----------------------------------------------------------------------
    // MARK: - Streaming Functions
    
    AsyncFunction("startStreaming") { (options: [String: Any]?) -> [String: Any] in
      log(.info, message: "Starting audio streaming")
      
      do {
        // Clean up any existing streaming session
        if isStreamingActive {
          log(.debug, message: "Stopping previous streaming session")
          stopAudioStreaming()
        }
    
        let audioSession = AVAudioSession.sharedInstance()
        
        // Use measurement mode for clean audio when available
        let availableModes = audioSession.availableModes
        if availableModes.contains(.measurement) {
          try audioSession.setCategory(.record, mode: .measurement)
          log(.info, message: "Using MEASUREMENT audio mode for clean recording")
        } else {
          try audioSession.setCategory(.record, mode: .default)
          log(.warning, message: "Measurement mode not available, falling back to DEFAULT mode")
        }
        try audioSession.setActive(true)
        
        // Allow custom buffer size configuration
        let originalBufferSize = streamBufferSize
        if let bufferSize = options?["bufferSize"] as? Int, bufferSize > 0 {
          streamBufferSize = AVAudioFrameCount(bufferSize)
          log(.debug, message: "Updated buffer size from \(originalBufferSize) to \(streamBufferSize)")
        }
        
        audioEngine = AVAudioEngine()
        inputNode = audioEngine?.inputNode
        log(.debug, message: "Creating AudioEngine and obtaining input node")
        
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
        
        log(.debug, message: "Starting audio engine")
        try audioEngine?.start()
        isStreamingActive = true
        log(.info, message: "Audio streaming started successfully")
        
        return ["success": true]
      } catch {
        log(.error, message: "Exception occurred: \(error.localizedDescription)")
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
      log(.debug, message: "Function called")
      
      if isStreamingActive {
        log(.info, message: "Stopping active streaming session")
        stopAudioStreaming()
        log(.debug, message: "Streaming stopped successfully")
        return ["success": true]
      } else {
        log(.warning, message: "No active streaming to stop")
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
      log(.debug, message: "Called with options \(options)")
      
      if let bufferSize = options["bufferSize"] as? Int, bufferSize > 0 {
        let oldSize = streamBufferSize
        streamBufferSize = AVAudioFrameCount(bufferSize)
        log(.info, message: "Updated buffer size from \(oldSize) to \(streamBufferSize) samples")
        return true
      } else {
        log(.warning, message: "Invalid buffer size provided: \(options["bufferSize"] ?? "nil")")
        return false
      }
    }

    /**
    * Plays an audio file with maximum fidelity
    * 
    * Optimized for precision playback of test signals and analytical audio
    * 
    * Parameters:
    *   - filePath: String containing the system path to the audio file
    *   - options: Optional dictionary with configuration options:
    *     - "volume": Float between 0.0 and 1.0 (default: 1.0)
    * 
    * Returns:
    *   - Dictionary with the following keys:
    *     - "success": Boolean indicating if playback started successfully
    *     - "error": String with error description (on failure)
    */
    AsyncFunction("playAudioFile") { (filePath: String, options: [String: Any]?) -> [String: Any] in
      log(.info, message: "Starting playback of file: \(filePath)")
      
      do {
        // Stop any ongoing playback
        if isPlaybackActive {
          log(.debug, message: "Stopping previous playback")
          stopPlayback()
        }
        
        let audioSession = AVAudioSession.sharedInstance()
        
        // Use .playback category for highest quality output with minimal interference
        try audioSession.setCategory(.playback, mode: .default, options: [.duckOthers])
        log(.debug, message: "Set audio session category to playback")
        
        // Activate audio session
        try audioSession.setActive(true)
        
        // Create engine and nodes
        playbackEngine = AVAudioEngine()
        audioPlayerNode = AVAudioPlayerNode()
        log(.debug, message: "Created audio engine and player node")
        
        guard let engine = playbackEngine, let playerNode = audioPlayerNode else {
          log(.error, message: "Failed to create audio engine")
          return ["success": false, "error": "Failed to create audio engine"]
        }
        
        // Create file URL from path
        let fileURL = URL(fileURLWithPath: filePath)
        
        // Load audio file
        audioFile = try AVAudioFile(forReading: fileURL)
        
        guard let file = audioFile else {
          log(.error, message: "Failed to load audio file")
          return ["success": false, "error": "Failed to load audio file"]
        }
        
        log(.debug, message: "Loaded audio file: \(fileURL.lastPathComponent), format: \(file.processingFormat)")
        
        // Get the file format
        let fileFormat = file.processingFormat
        
        // Add player node to engine
        engine.attach(playerNode)
        
        // Connect player to output using file's native format
        // This avoids sample rate conversion when possible
        engine.connect(playerNode, to: engine.mainMixerNode, format: fileFormat)
        
        // Set volume if specified
        if let volume = options?["volume"] as? Float {
          playerNode.volume = max(0.0, min(1.0, volume))
          log(.debug, message: "Set playback volume to \(playerNode.volume)")
        }
        
        // Prepare engine
        engine.prepare()
        
        // Start the engine
        try engine.start()
        log(.debug, message: "Audio engine started")
        
        // Schedule file for playback
        playerNode.scheduleFile(file, at: nil) {
          // Playback completion handler
          self.isPlaybackActive = false
          self.log(.info, message: "Playback completed")
        }
        
        // Start playback
        playerNode.play()
        isPlaybackActive = true
        log(.info, message: "Playback started successfully")
        
        return ["success": true]
      } catch {
        log(.error, message: "Exception occurred: \(error.localizedDescription)")
        return ["success": false, "error": error.localizedDescription]
      }
    }

    /**
    * Stops audio playback and releases resources
    * 
    * Parameters:
    *   - None
    * 
    * Returns:
    *   - Dictionary with the following keys:
    *     - "success": Boolean indicating if playback was stopped successfully
    *     - "error": String with error description (if no active playback)
    */
    Function("stopAudioPlayback") { () -> [String: Any] in
      log(.debug, message: "Function called")
      
      if isPlaybackActive {
        log(.info, message: "Stopping active playback session")
        stopPlayback()
        log(.debug, message: "Playback stopped successfully")
        return ["success": true]
      } else {
        log(.warning, message: "No active playback to stop")
        return ["success": false, "error": "No active playback"]
      }
    }

    /**
    * Checks if audio playback is currently active
    * 
    * Parameters:
    *   - None
    * 
    * Returns:
    *   - Boolean: true if playback is active, false otherwise
    */
    Function("isPlaying") { () -> Bool in
      return isPlaybackActive
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
    log(.debug, message: "Removing tap and stopping audio engine")
    inputNode?.removeTap(onBus: 0)
    
    audioEngine?.stop()
    audioEngine = nil
    inputNode = nil
    isStreamingActive = false
    log(.debug, message: "Audio engine stopped and resources cleared")
    
    do {
      try AVAudioSession.sharedInstance().setActive(false)
      log(.debug, message: "Audio session deactivated")
    } catch {
      log(.error, message: "Error deactivating audio session: \(error.localizedDescription)")
    }
  }

  /**
  * Helper method to clean up playback resources
  */
  private func stopPlayback() {
    log(.debug, message: "Stopping playback and cleaning up resources")
    
    audioPlayerNode?.stop()
    playbackEngine?.stop()
    
    audioPlayerNode = nil
    audioFile = nil
    playbackEngine = nil
    isPlaybackActive = false
    log(.debug, message: "Playback resources released")
    
    do {
      try AVAudioSession.sharedInstance().setActive(false)
      log(.debug, message: "Audio session deactivated")
    } catch {
      log(.error, message: "Error deactivating audio session: \(error.localizedDescription)")
    }
  }

    /**
   * Unified logging function that mimics Android logging style for consistent cross-platform debugging
   * 
   * @param level LogLevel The severity level of the log
   * @param function String The function name (automatically provided by default)
   * @param message String The message to log
   */
  private enum LogLevel: String {
    case debug = "[DEBUG]"
    case info = "[INFO]"
    case warning = "[WARNING]"
    case error = "[ERROR]"
  }
  
  private func log(_ level: LogLevel, 
                   function: String = #function, 
                   message: String) {
    // Format: [LEVEL] NativeAudioModule: functionName: message
    let functionName = function.components(separatedBy: "(").first ?? function
    print("\(level.rawValue) NativeAudioModule: \(functionName): \(message)")
  }
}