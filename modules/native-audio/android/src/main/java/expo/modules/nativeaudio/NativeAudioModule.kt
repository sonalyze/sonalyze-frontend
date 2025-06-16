package expo.modules.nativeaudio

// Core Android
import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build

// Android Audio
import android.media.*
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.AutomaticGainControl
import android.media.audiofx.NoiseSuppressor

// Expo Module
import androidx.core.app.ActivityCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Kotlin & Coroutines
import kotlinx.coroutines.*

// Java utilities
import java.io.*
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Native module for high-quality audio recording, streaming, and playback on Android.
 * Provides clean, unprocessed audio capture for analysis purposes and simple playback capabilities.
 */
class NativeAudioModule : Module() {
    // ===== AUDIO CONFIGURATION =====
    private val sampleRate = 48000 
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_FLOAT 
    private val bufferSize = 4096 
    
    // ===== STATE MANAGEMENT =====
    private var audioRecord: AudioRecord? = null
    private var mediaPlayer: MediaPlayer? = null
    private var recordingFile: File? = null
    private var isRecording = AtomicBoolean(false)
    private var isPlaying = AtomicBoolean(false)
    private var isStreaming = AtomicBoolean(false)
    
    private var recordingJob: Job? = null
    private var playbackJob: Job? = null
    private var streamingJob: Job? = null
    private val coroutineScope = CoroutineScope(Dispatchers.IO)
    
    private var streamBufferSize = bufferSize
    
    // ===== MODULE DEFINITION =====
    override fun definition() = ModuleDefinition {
        Name("NativeAudio")

        // Ensure resources are properly released when the module is destroyed
        OnDestroy {
            stopRecording()
            stopStreaming() 
            stopPlayback()
            coroutineScope.cancel()
        }
        
        // Define events that can be sent to JavaScript
        Events("onAudioData")
        
        // ===== PERMISSIONS =====
        /**
         * Requests microphone permission from the user
         * 
         * Checks for existing permission and requests it if not already granted.
         * Returns the permission status after the request.
         * 
         * Parameters:
         *   - promise: Promise object used to resolve the request asynchronously
         * 
         * Returns: 
         *   - Boolean value through the promise:
         *     - true: User granted microphone permission
         *     - false: User denied microphone permission
         */
        AsyncFunction("requestMicrophonePermission") { promise: Promise ->
            val activity = appContext.currentActivity ?: run {
                // Using Kotlin's "run" for early return with a value when activity is null
                promise.resolve(false)
                return@AsyncFunction
            }
            
            if (ActivityCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) 
                == PackageManager.PERMISSION_GRANTED) {
                promise.resolve(true)
                return@AsyncFunction
            }
            
            // Request permissions if not granted
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                0
            )
            
            // Check if permission was granted after request
            val granted = ActivityCompat.checkSelfPermission(
                activity, 
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED
            
            promise.resolve(granted)
        }
        
        /**
         * Returns available audio session modes for debugging purposes
         * 
         * This is a placeholder function because Android does not have a direct equivalent
         * 
         * Parameters:
         *   - None
         * 
         * Returns:
         *   - [String]: Empty array of string identifiers
         */
        Function("getAvailableAudioSessionModes") {
            // Currently not implemented, returning empty list
            emptyList<String>()
        }
        
        // ===== FILE RECORDING =====
        /**
         * Starts recording audio to a file with high quality settings
         * 
         * Creates a WAV file with float PCM format at 48kHz for detailed audio analysis.
         * Audio is first captured to a raw PCM file, then converted to WAV when stopped.
         * 
         * Parameters:
         *   - fileName: String name for the output file (will add .wav extension if needed)
         * 
         * Returns:
         *   - Map<String, Any> with the following keys:
         *     - "success": Boolean indicating if recording started successfully
         *     - "fileUri": String URI to the recording file
         *     - "path": String file system path to the recording
         *     - "error": String description if an error occurred (only on failure)
         * 
         * Side effects:
         *   - Creates a file in the app's audio directory
         *   - Starts a background coroutine that writes audio data to disk
         *   - Sets isRecording state to true
         */
        AsyncFunction("fileStartRecording") { fileName: String -> 
            val activity = appContext.currentActivity
            val context = appContext.reactContext ?: run {
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "Context not available"
                )
            }
            
            // Double-check permission at runtime as it could be revoked
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) 
                != PackageManager.PERMISSION_GRANTED) {
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "Microphone permission not granted"
                )
            }
            
            try {
                // Stop any existing recording
                if (isRecording.get()) {
                    stopRecording()
                }
                
                // Get minimum buffer size required by the hardware
                val minBufferSize = AudioRecord.getMinBufferSize(
                    sampleRate, 
                    channelConfig, 
                    audioFormat
                )

                if (minBufferSize == AudioRecord.ERROR_BAD_VALUE || minBufferSize == AudioRecord.ERROR) {
                    return@AsyncFunction mapOf(
                        "success" to false,
                        "error" to "getMinBufferSize failed with code $minBufferSize"
                    )
                }
                
                // Select best audio source based on device capabilities
                // UNPROCESSED provides raw audio without system processing, ideal for analysis
                // VOICE_RECOGNITION is optimized for speech but with some processing
                val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
                val audioSource = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N &&
                    audioManager.getProperty(AudioManager.PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED) == "true") {
                    MediaRecorder.AudioSource.UNPROCESSED
                } else {
                    MediaRecorder.AudioSource.VOICE_RECOGNITION
                }
                
                // Create audio recorder with double the minimum buffer for better performance
                audioRecord = AudioRecord(
                    audioSource,
                    sampleRate,
                    channelConfig,
                    audioFormat,
                    minBufferSize * 2
                )
                
                // Disable automatic audio processing to get cleaner audio
                disableAudioEffects(audioRecord?.audioSessionId ?: 0)
                
                // Set up file storage
                val filesDir = context.filesDir
                val audioDir = File(filesDir, "audio")
                if (!audioDir.exists()) {
                    audioDir.mkdir()
                }
                
                val wavFileName = if (fileName.endsWith(".wav")) fileName else "$fileName.wav"
                recordingFile = File(audioDir, wavFileName)
                
                val record = audioRecord ?: run {
                    return@AsyncFunction mapOf(
                        "success" to false,
                        "error" to "Failed to initialize audio recorder"
                    )
                }
                
                record.startRecording()
                isRecording.set(true)
                
                // Start recording in a separate coroutine to not block the UI thread
                recordingJob = coroutineScope.launch {
                    // First record to temporary PCM file, then convert to WAV when done
                    val tempFile = File("${recordingFile?.absolutePath}.pcm")
                    val outputStream = FileOutputStream(tempFile)
                    val buffer = FloatArray(bufferSize)
                    var totalSamples = 0L
                    
                    try {
                        // Recording loop - continues until stopped or coroutine is cancelled
                        while (isRecording.get() && isActive) {
                            val readResult = record.read(buffer, 0, bufferSize, AudioRecord.READ_BLOCKING)
                            if (readResult > 0) {
                                // Convert float audio data to bytes for storage
                                val byteBuffer = ByteBuffer.allocate(buffer.size * 4)
                                    .order(ByteOrder.LITTLE_ENDIAN)
                                
                                for (i in 0 until readResult) {
                                    byteBuffer.putFloat(buffer[i])
                                }
                                
                                outputStream.write(byteBuffer.array(), 0, readResult * 4)
                                totalSamples += readResult
                            }
                        }
                    } finally {
                        outputStream.close()
                        
                        // Convert PCM data to WAV format by adding a proper header
                        if (recordingFile != null && tempFile.exists()) {
                            addWavHeader(tempFile, recordingFile!!, sampleRate, 1, 32)
                            tempFile.delete()
                        }
                    }
                }
                
                return@AsyncFunction mapOf(
                    "success" to true,
                    "fileUri" to "file://${recordingFile?.absolutePath}",
                    "path" to recordingFile?.absolutePath
                )
                
            } catch (e: Exception) {
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to e.message
                )
            }
        }
        
        /**
         * Stops the current file recording and completes the WAV file
         * 
         * Stops the recording process and returns the path to the completed file.
         * 
         * Parameters:
         *   - None
         * 
         * Returns:
         *   - Map<String, Any> with the following keys:
         *     - "success": Boolean indicating if recording was stopped successfully
         *     - "fileUri": String URI to the recording file
         *     - "path": String file system path to the recording
         *     - "error": String description if an error occurred (only on failure)
         * 
         * Side effects:
         *   - Cancels any running recording coroutine
         *   - Releases audio recording resources
         *   - Sets isRecording state to false
         */
        AsyncFunction("fileStopRecording") {
            if (!isRecording.get()) {
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "No active recording"
                )
            }
            
            val path = recordingFile?.absolutePath
            
            stopRecording()
            
            return@AsyncFunction mapOf(
                "success" to true,
                "fileUri" to "file://$path",
                "path" to path
            )
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
        Function("isFileRecording") {
            isRecording.get()
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
        Function("deleteRecording") { filePath: String ->
            try {
                val file = File(filePath)
                
                if (!file.exists()) {
                    return@Function false
                }
                
                val deleted = file.delete()
                deleted
            } catch (e: Exception) {
                false
            }
        }
        
        // ===== STREAMING =====
        /**
         * Starts streaming audio data to JavaScript in real-time
         * 
         * Unlike file recording, this sends audio buffers directly to JavaScript
         * via events for immediate analysis without writing to disk.
         * 
         * Parameters:
         *   - options: Map<String, Any>? Optional configuration map:
         *     - "bufferSize": Int - Size of audio buffers in samples (affects latency)
         * 
         * Returns:
         *   - Map<String, Any> with the following keys:
         *     - "success": Boolean indicating if streaming started successfully
         *     - "error": String description if an error occurred (only on failure)
         * 
         * Side effects:
         *   - Starts a background coroutine that captures and sends audio data
         *   - Sets isStreaming state to true
         *   - Emits "onAudioData" events with audio buffers to JavaScript
         */
        AsyncFunction("startStreaming") { options: Map<String, Any>? ->
            val context = appContext.reactContext ?: run {
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "Context not available"
                )
            }
            
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) 
                != PackageManager.PERMISSION_GRANTED) {
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "Microphone permission not granted"
                )
            }
            
            try {
                if (isStreaming.get()) {
                    stopStreaming()
                }
                
                // Allow user to configure buffer size for different latency/processing needs
                if (options != null && options["bufferSize"] is Int) {
                    val requestedSize = options["bufferSize"] as Int
                    if (requestedSize > 0) {
                        streamBufferSize = requestedSize
                    }
                }
                
                val minBufferSize = AudioRecord.getMinBufferSize(
                    sampleRate,
                    channelConfig,
                    audioFormat
                )
                
                if (minBufferSize == AudioRecord.ERROR_BAD_VALUE || minBufferSize == AudioRecord.ERROR) {
                    return@AsyncFunction mapOf(
                        "success" to false,
                        "error" to "getMinBufferSize failed with code $minBufferSize"
                    )
                }
                
                // Use the larger of minimum required or requested size
                val bufferSize = maxOf(streamBufferSize, minBufferSize)
                
                val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
                val audioSource: Int = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N &&
                    audioManager.getProperty(AudioManager.PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED) == "true") {
                    MediaRecorder.AudioSource.UNPROCESSED
                } else {
                    MediaRecorder.AudioSource.VOICE_RECOGNITION
                }
                
                audioRecord = AudioRecord(
                    audioSource,
                    sampleRate,
                    channelConfig,
                    audioFormat,
                    bufferSize
                )
                
                disableAudioEffects(audioRecord?.audioSessionId ?: 0)
                
                val record = audioRecord ?: run {
                    return@AsyncFunction mapOf(
                        "success" to false,
                        "error" to "Failed to initialize audio recorder"
                    )
                }
                
                if (record.state != AudioRecord.STATE_INITIALIZED) {
                    return@AsyncFunction mapOf(
                        "success" to false,
                        "error" to "AudioRecord initialization failed with state: ${record.state}"
                    )
                }
                
                record.startRecording()
                isStreaming.set(true)
                
                // Launch streaming in a separate coroutine
                streamingJob = coroutineScope.launch {
                    val buffer = FloatArray(streamBufferSize)
                    var timestamp: Long = 0
                    var samplesProcessed: Long = 0
                    
                    try {
                        while (isStreaming.get() && isActive) {
                            val readResult = record.read(buffer, 0, streamBufferSize, AudioRecord.READ_BLOCKING)
                            
                            if (readResult > 0) {
                                samplesProcessed += readResult
                                
                                // Copy only the valid part of the buffer to avoid sending zeroes
                                val samples = FloatArray(readResult)
                                System.arraycopy(buffer, 0, samples, 0, readResult)
                                
                                // Send audio data to JavaScript via events
                                sendEvent("onAudioData", mapOf(
                                    "data" to samples,
                                    "timestamp" to timestamp,
                                    "sampleRate" to sampleRate
                                ))
                                
                                timestamp += readResult
                            }
                        }
                    } catch (e: Exception) {
                        stopStreaming()
                    }
                }
                
                return@AsyncFunction mapOf("success" to true)
                
            } catch (e: Exception) {
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to e.message
                )
            }
        }
        
        /**
         * Stops the audio streaming process and cleans up resources
         * 
         * Parameters:
         *   - None
         * 
         * Returns:
         *   - Map<String, Any> with the following keys:
         *     - "success": Boolean indicating if streaming was stopped successfully
         *     - "error": String with error description (if no active streaming)
         * 
         * Side effects:
         *   - Cancels any running streaming coroutine
         *   - Releases audio recording resources
         *   - Sets isStreaming state to false
         */
        Function("stopStreaming") {
            if (!isStreaming.get()) {
                return@Function mapOf(
                    "success" to false,
                    "error" to "No active streaming"
                )
            }
            
            stopStreaming()
            return@Function mapOf("success" to true)
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
        Function("isStreaming") {
            isStreaming.get()
        }
        
        /**
         * Updates streaming configuration options
         * 
         * Parameters:
         *   - options: Map<String, Any> containing configuration options:
         *     - "bufferSize": Int specifying new buffer size in frames
         * 
         * Returns:
         *   - Boolean: true if options were successfully updated, false otherwise
         */
        Function("setStreamingOptions") { options: Map<String, Any> ->
            val size = options["bufferSize"] as? Int
            if (size != null && size > 0) {
                streamBufferSize = size
                true
            } else {
                false
            }
        }

        // ===== PLAYBACK =====
        /**
         * Plays an audio file with specified options
         * 
         * Creates a MediaPlayer instance to play an audio file with high fidelity.
         * Supports both file paths and content URIs.
         * 
         * Parameters:
         *   - filePath: String containing the path to the audio file
         *   - options: Map<String, Any>? Optional configuration map:
         *     - "volume": Float between 0.0 and 1.0
         * 
         * Returns:
         *   - Map<String, Any> with the following keys:
         *     - "success": Boolean indicating if playback started successfully
         *     - "error": String description if an error occurred (only on failure)
         * 
         * Side effects:
         *   - Creates and starts a MediaPlayer instance
         *   - Sets isPlaying state to true
         *   - Automatically releases resources when playback completes
         */
        AsyncFunction("playAudioFile") { filePath: String, options: Map<String, Any>? ->
            try {
                if (isPlaying.get()) {
                    stopPlayback()
                }
                
                // Using MediaPlayer with apply block - a Kotlin feature that applies operations to an object
                // This is equivalent to creating the object, setting properties, and returning it
                mediaPlayer = MediaPlayer().apply {
                    // Configure audio output characteristics
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .build()
                    )
                    
                    // Handle both content URIs and regular file paths
                    if (filePath.startsWith("content://")) {
                        setDataSource(appContext.reactContext!!, Uri.parse(filePath))
                    } else {
                        setDataSource(filePath)
                    }
                    
                    // Apply volume option if provided
                    if (options?.containsKey("volume") == true) {
                        val volume = (options["volume"] as? Float) ?: 1.0f
                        val clampedVolume = volume.coerceIn(0.0f, 1.0f)
                        setVolume(clampedVolume, clampedVolume)
                    }
                    
                    // Prepare must be called before playback
                    prepare()
                    
                    // Clean up resources when playback completes
                    setOnCompletionListener {
                        this@NativeAudioModule.isPlaying.set(false)
                        release()
                        mediaPlayer = null
                    }
                    
                    start()
                    this@NativeAudioModule.isPlaying.set(true)
                }
                
                return@AsyncFunction mapOf("success" to true)
                
            } catch (e: Exception) {
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to e.message
                )
            }
        }
        
        /**
         * Stops audio playback and releases resources
         * 
         * Parameters:
         *   - None
         * 
         * Returns:
         *   - Map<String, Any> with the following keys:
         *     - "success": Boolean indicating if playback was stopped successfully
         *     - "error": String with error description (if no active playback)
         * 
         * Side effects:
         *   - Releases MediaPlayer resources
         *   - Sets isPlaying state to false
         */
        Function("stopAudioPlayback") {
            if (!isPlaying.get()) {
                return@Function mapOf(
                    "success" to false,
                    "error" to "No active playback"
                )
            }
            
            stopPlayback()
            return@Function mapOf("success" to true)
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
        Function("isPlaying") {
            isPlaying.get()
        }
    }

    // ===== RESOURCE MANAGEMENT =====
    /**
     * Stops the audio streaming process and releases resources
     * 
     * Called internally when stopping streaming or when starting a new stream.
     * Ensures all resources are properly cleaned up to avoid memory leaks.
     * 
     * Side effects:
     *   - Cancels any running streaming coroutine
     *   - Stops and releases the AudioRecord instance
     *   - Sets isStreaming state to false
     */
    private fun stopStreaming() {
        isStreaming.set(false)
        streamingJob?.cancel()
        streamingJob = null
        
        audioRecord?.let { recorder ->
            try {
                if (recorder.state == AudioRecord.STATE_INITIALIZED) {
                    recorder.stop()
                }
                recorder.release()
            } catch (e: Exception) {
                // Ignore errors during cleanup
            }
        }
        audioRecord = null
    }
    
    /**
     * Stops the audio recording process and releases resources
     * 
     * Called internally when stopping recording or when starting a new recording.
     * Ensures all resources are properly cleaned up to avoid memory leaks.
     * 
     * Side effects:
     *   - Cancels any running recording coroutine
     *   - Stops and releases the AudioRecord instance
     *   - Sets isRecording state to false
     */
    private fun stopRecording() {
        isRecording.set(false)
        recordingJob?.cancel()
        recordingJob = null
        
        audioRecord?.let { recorder ->
            try {
                if (recorder.state == AudioRecord.STATE_INITIALIZED) {
                    recorder.stop()
                }
                recorder.release()
            } catch (e: Exception) {
                // Ignore errors during cleanup
            }
        }
        audioRecord = null
    }

    /**
     * Stops the audio playback process and releases resources
     * 
     * Called internally when stopping playback or when starting a new playback.
     * Ensures all resources are properly cleaned up to avoid memory leaks.
     * 
     * Side effects:
     *   - Stops and releases the MediaPlayer instance
     *   - Sets isPlaying state to false
     */
    private fun stopPlayback() {
        mediaPlayer?.let { player ->
            try {
                if (player.isPlaying) {
                    player.stop()
                }
                player.reset()
                player.release()
            } catch (e: Exception) {
                // Ignore errors during cleanup
            }
        }
        
        mediaPlayer = null
        isPlaying.set(false)
    }
    
    // ===== UTILITY FUNCTIONS =====
    /**
     * Disables automatic audio processing effects to get cleaner audio
     * 
     * Android applies various audio effects by default which can alter the
     * raw audio data. This function disables them to get unprocessed audio.
     * 
     * Parameters:
     *   - audioSessionId: Int representing the audio session to modify
     * 
     * Side effects:
     *   - Disables automatic gain control if available
     *   - Disables noise suppression if available
     *   - Disables echo cancellation if available
     */
    private fun disableAudioEffects(audioSessionId: Int) {
        if (audioSessionId == 0) {
            return
        }
        
        // Disable automatic gain control to prevent volume adjustments
        if (AutomaticGainControl.isAvailable()) {
            val agc = AutomaticGainControl.create(audioSessionId)
            agc?.enabled = false
        }
        
        // Disable noise suppression to preserve background sounds
        if (NoiseSuppressor.isAvailable()) {
            val ns = NoiseSuppressor.create(audioSessionId)
            ns?.enabled = false
        }
        
        // Disable echo cancellation to keep all audio components
        if (AcousticEchoCanceler.isAvailable()) {
            val aec = AcousticEchoCanceler.create(audioSessionId)
            aec?.enabled = false
        }
    }
    
    /**
     * Adds a WAV header to raw PCM audio data
     * 
     * WAV files require a specific 44-byte header that describes the audio format.
     * This function creates that header and prepends it to raw PCM data to make
     * a valid WAV file that audio players can recognize.
     * 
     * Parameters:
     *   - pcmFile: File containing raw PCM audio data
     *   - wavFile: File where the complete WAV file will be written
     *   - sampleRate: Int sample rate in Hz (e.g., 48000)
     *   - channels: Int number of audio channels (1 for mono, 2 for stereo)
     *   - bitsPerSample: Int bits per sample (16, 24, or 32)
     * 
     * Side effects:
     *   - Creates a new WAV file at the specified location
     *   - Copies all PCM data into the new WAV file with proper header
     */
    private fun addWavHeader(
        pcmFile: File, 
        wavFile: File, 
        sampleRate: Int, 
        channels: Int, 
        bitsPerSample: Int
    ) {
        val pcmData = pcmFile.readBytes()
        val totalDataLen = pcmData.size
        val totalSize = totalDataLen + 36
        
        // Create standard 44-byte WAV header as defined by the WAV file format specification
        val header = ByteBuffer.allocate(44)
        
        // "RIFF" chunk descriptor identifies the file as a WAV file
        header.put("RIFF".toByteArray())
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(totalSize)
        header.put("WAVE".toByteArray())
        
        // "fmt " sub-chunk contains format info
        header.put("fmt ".toByteArray())
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(16)
        header.order(ByteOrder.LITTLE_ENDIAN).putShort(3) // 3 = IEEE float format
        header.order(ByteOrder.LITTLE_ENDIAN).putShort(channels.toShort())
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(sampleRate)
        
        val byteRate = sampleRate * channels * (bitsPerSample / 8)
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(byteRate)
        header.order(ByteOrder.LITTLE_ENDIAN).putShort((channels * (bitsPerSample / 8)).toShort())
        header.order(ByteOrder.LITTLE_ENDIAN).putShort(bitsPerSample.toShort())
        
        // "data" sub-chunk contains the actual audio data
        header.put("data".toByteArray())
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(totalDataLen)
        
        // Write complete WAV file - first the header, then the audio data
        try {
            FileOutputStream(wavFile).use { output ->
                output.write(header.array())
                output.write(pcmData)
            }
        } catch (e: Exception) {
            // Ignore errors
        }
    }
}