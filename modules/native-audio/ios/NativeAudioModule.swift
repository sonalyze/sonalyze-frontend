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
      return modeStrings
    }

    // -----------------------------------------------------------------------
    // MARK: - File-based Recording Functions (for debugging and testing)
    
    AsyncFunction("fileStartRecording") { (fileName: String) -> [String: Any] in
      
      do {
        let audioSession = AVAudioSession.sharedInstance()
        
        // Measurement mode provides minimal signal processing for clean recording
        let availableModes = audioSession.availableModes
        if availableModes.contains(.measurement) {
          try audioSession.setCategory(.record, mode: .measurement)
        } else {
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
    
    AsyncFunction("fileStopRecording") { () -> [String: Any] in     
      guard let recorder = audioRecorder, recorder.isRecording else {
        return ["success": false, "error": "No active recording"]
      }
      
      let path = recorder.url.path
      
      recorder.stop()
      
      // Release audio resources to allow other apps to use audio
      _ = try? AVAudioSession.sharedInstance().setActive(false)
      
      let fileURL = recorder.url
      audioRecorder = nil
      
      if FileManager.default.fileExists(atPath: fileURL.path) {
        let fileSize = try? FileManager.default.attributesOfItem(atPath: fileURL.path)[.size] as? Int64
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
      let fileManager = FileManager.default
      
      if !fileManager.fileExists(atPath: filePath) {
        return false
      }
            
      do {
        try fileManager.removeItem(atPath: filePath)
        return true
      } catch {
        return false
      }
    }

    // -----------------------------------------------------------------------
    // MARK: - Streaming Functions
    
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
        }
        try audioSession.setActive(true)
        
        // Allow custom buffer size configuration
        let originalBufferSize = streamBufferSize
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
        let oldSize = streamBufferSize
        streamBufferSize = AVAudioFrameCount(bufferSize)
        return true
      } else {
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
      do {
        // Stop any ongoing playback
        if isPlaybackActive {
          stopPlayback()
        }
        
        let audioSession = AVAudioSession.sharedInstance()
        
        // Use .playback category for highest quality output with minimal interference
        try audioSession.setCategory(.playback, mode: .default, options: [.duckOthers])
        
        // Activate audio session
        try audioSession.setActive(true)
        
        // Create engine and nodes
        playbackEngine = AVAudioEngine()
        audioPlayerNode = AVAudioPlayerNode()
        
        guard let engine = playbackEngine, let playerNode = audioPlayerNode else {
          return ["success": false, "error": "Failed to create audio engine"]
        }
        
        // Create file URL from path
        let fileURL = URL(fileURLWithPath: filePath)
        
        // Load audio file
        audioFile = try AVAudioFile(forReading: fileURL)
        
        guard let file = audioFile else {
          return ["success": false, "error": "Failed to load audio file"]
        }
        
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
        }
        
        // Prepare engine
        engine.prepare()
        
        // Start the engine
        try engine.start()
        
        // Schedule file for playback
        playerNode.scheduleFile(file, at: nil) {
          // Playback completion handler
          self.isPlaybackActive = false
        }
        
        // Start playback
        playerNode.play()
        isPlaybackActive = true
        
        return ["success": true]
      } catch {
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
      if isPlaybackActive {
        stopPlayback()
        return ["success": true]
      } else {
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
    inputNode?.removeTap(onBus: 0)
    
    audioEngine?.stop()
    audioEngine = nil
    inputNode = nil
    isStreamingActive = false
    

    _ = try? AVAudioSession.sharedInstance().setActive(false)
  }

  /**
  * Helper method to clean up playback resources
  */
  private func stopPlayback() {    
    audioPlayerNode?.stop()
    playbackEngine?.stop()
    
    audioPlayerNode = nil
    audioFile = nil
    playbackEngine = nil
    isPlaybackActive = false
  
    _ = try? AVAudioSession.sharedInstance().setActive(false)

  }
}