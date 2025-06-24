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

  private var tempRecordingFile: URL?
  private var finalRecordingFile: URL?
  private var recordingMetadata: (Int, Int, Int)?
  
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
    
    AsyncFunction("fileStartRecording") { (fileName: String, calibrationFactor: Double) -> [String: Any] in
      do {
        let audioSession = AVAudioSession.sharedInstance()
        if audioSession.availableModes.contains(.measurement) {
          try audioSession.setCategory(.record, mode: .measurement)
        } else {
          try audioSession.setCategory(.record, mode: .default)
        }
        try audioSession.setActive(true)

        // Init engine
        let engine = AVAudioEngine()
        let inputNode = engine.inputNode
        let format = inputNode.outputFormat(forBus: 0)
        let sampleRate = Int(format.sampleRate)
        let channels = Int(format.channelCount)
        let bitsPerSample = 32

        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let outputURL = documentsPath.appendingPathComponent(fileName.hasSuffix(".wav") ? fileName : "\(fileName).wav")
        let temppcmFile = outputURL.deletingPathExtension().appendingPathExtension("pcm")

        if FileManager.default.fileExists(atPath: temppcmFile.path) {
          try FileManager.default.removeItem(at: temppcmFile)
        }

        FileManager.default.createFile(atPath: temppcmFile.path, contents: nil)
        guard let fileHandle = try? FileHandle(forWritingTo: temppcmFile) else {
          return ["success": false, "error": "Cannot create file for writing"]
        }

        // Tap
        inputNode.installTap(onBus: 0, bufferSize: 4096, format: format) { buffer, _ in
          let frameLength = Int(buffer.frameLength)
          guard let channelData = buffer.floatChannelData?[0] else { return }

          let calibratedSamples = UnsafeBufferPointer(start: channelData, count: frameLength).map {
            Float32($0 * Float(calibrationFactor))
          }

          var data = Data()
          for sample in calibratedSamples {
            var s = sample
            data.append(UnsafeBufferPointer(start: &s, count: 1))
          }

          try? fileHandle.seekToEnd()
          try? fileHandle.write(contentsOf: data)
        }

        engine.prepare()
        try engine.start()

        // Save for stopRecording
        self.audioEngine = engine
        self.inputNode = inputNode
        self.isStreamingActive = true
        self.tempRecordingFile = temppcmFile
        self.finalRecordingFile = outputURL
        self.recordingMetadata = (sampleRate, channels, bitsPerSample)

        return [
          "success": true,
          "fileUri": outputURL.absoluteString,
          "path": outputURL.path
        ]
      } catch {
        return ["success": false, "error": error.localizedDescription]
      }
    }

    
    AsyncFunction("fileStopRecording") { () -> [String: Any] in
      guard isStreamingActive,
            let pcmFile = tempRecordingFile,
            let wavFile = finalRecordingFile,
            let (sampleRate, channels, bitsPerSample) = recordingMetadata else {
        return ["success": false, "error": "No active calibrated recording"]
      }

      inputNode?.removeTap(onBus: 0)
      audioEngine?.stop()
      isStreamingActive = false

      do {
        try addWavHeader(from: pcmFile, to: wavFile, sampleRate: sampleRate, channels: channels, bitsPerSample: bitsPerSample)
        try FileManager.default.removeItem(at: pcmFile)
        return [
          "success": true,
          "fileUri": wavFile.absoluteString,
          "path": wavFile.path
        ]
      } catch {
        return ["success": false, "error": error.localizedDescription]
      }
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
  
    /**
    * Retrieves the raw audio data from a recorded file
    * 
    * Reads the audio file from disk and returns it as a base64 encoded string.
    * This allows JavaScript to access the raw audio data for processing or transmission.
    * 
    * Parameters:
    *   - filePath: String containing the full file system path to the recording
    * 
    * Returns:
    *   - Dictionary with the following keys:
    *     - "success": Boolean indicating if data was retrieved successfully
    *     - "data": String containing base64 encoded audio data (only when success is true)
    *     - "error": String description if an error occurred (only when success is false)
    */
    AsyncFunction("getRecordingData") { (filePath: String) -> [String: Any] in
      do {
        let fileManager = FileManager.default
        
        if !fileManager.fileExists(atPath: filePath) {
          return ["success": false, "error": "Recording file not found at path: \(filePath)"]
        }
        
        let fileURL = URL(fileURLWithPath: filePath)
        let audioData = try Data(contentsOf: fileURL)
        let base64String = audioData.base64EncodedString()
        
        return [
          "success": true,
          "data": base64String
        ]
      } catch {
        return [
          "success": false,
          "error": error.localizedDescription
        ]
      }
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

  /// Adds a WAV header to raw PCM audio data.
  ///
  /// WAV files require a specific 44-byte header that describes the audio format.
  /// This function creates that header and prepends it to raw PCM data to make
  /// a valid WAV file that audio players can recognize.
  ///
  /// - Parameters:
  ///   - pcmFile: URL of the file containing raw PCM audio data.
  ///   - wavFile: URL where the complete WAV file will be written.
  ///   - sampleRate: The sample rate in Hz (e.g., 48000).
  ///   - channels: The number of audio channels (1 for mono, 2 for stereo).
  ///   - bitsPerSample: The number of bits per sample (e.g., 16, 24, or 32).
  ///
  /// - Throws: An error if the file operations fail (e.g., reading the PCM file or writing the WAV file).
  ///
  /// - Note: This function creates a new WAV file at the specified location,
  ///   copying all PCM data into it with the proper header.
  private func addWavHeader(
      from pcmFile: URL,
      to wavFile: URL,
      sampleRate: Int,
      channels: Int,
      bitsPerSample: Int
  ) throws {
      // Read the raw PCM data from the input file.
      let pcmData = try Data(contentsOf: pcmFile)
      let totalDataLen = pcmData.count

      // The total file size is the PCM data length plus the header size (44 bytes) minus 8 bytes
      // for the "RIFF" and size fields which are not included in the chunk size.
      let totalSize = totalDataLen + 36

      // Create a Data object to build the 44-byte WAV header.
      var header = Data()

      // Helper to append values in little-endian format.
      func appendLittleEndian<T: FixedWidthInteger>(_ value: T, to data: inout Data) {
          var littleEndianValue = value.littleEndian
          withUnsafeBytes(of: &littleEndianValue) {
              data.append(contentsOf: $0)
          }
      }

      // MARK: - RIFF Chunk Descriptor
      // "RIFF" marker (0-3)
      header.append("RIFF".data(using: .ascii)!)

      // Overall file size in bytes (4-7)
      appendLittleEndian(Int32(totalSize), to: &header)

      // "WAVE" marker (8-11)
      header.append("WAVE".data(using: .ascii)!)

      // MARK: - "fmt " Sub-chunk
      // "fmt " marker (12-15)
      header.append("fmt ".data(using: .ascii)!)

      // Sub-chunk size: 16 for PCM (16-19)
      appendLittleEndian(Int32(16), to: &header)

      // Audio Format: 3 for IEEE float, 1 for PCM. (20-21)
      // The original Kotlin code used 3 (IEEE float), so we replicate that.
      // For standard PCM, you would use a value of 1.
      appendLittleEndian(Int16(3), to: &header)

      // Number of Channels (22-23)
      appendLittleEndian(Int16(channels), to: &header)

      // Sample Rate (24-27)
      appendLittleEndian(Int32(sampleRate), to: &header)

      // Byte Rate = SampleRate * NumChannels * BitsPerSample/8 (28-31)
      let byteRate = sampleRate * channels * (bitsPerSample / 8)
      appendLittleEndian(Int32(byteRate), to: &header)

      // Block Align = NumChannels * BitsPerSample/8 (32-33)
      let blockAlign = channels * (bitsPerSample / 8)
      appendLittleEndian(Int16(blockAlign), to: &header)

      // Bits Per Sample (34-35)
      appendLittleEndian(Int16(bitsPerSample), to: &header)

      // MARK: - "data" Sub-chunk
      // "data" marker (36-39)
      header.append("data".data(using: .ascii)!)

      // Size of the actual audio data in bytes (40-43)
      appendLittleEndian(Int32(totalDataLen), to: &header)

      // Combine the header with the PCM audio data.
      let wavData = header + pcmData

      // Write the final WAV data to the output file.
      try wavData.write(to: wavFile)
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