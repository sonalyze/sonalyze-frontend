package expo.modules.nativeaudio

import android.Manifest
import android.content.pm.PackageManager
import android.media.*
import androidx.core.app.ActivityCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.*
import java.io.*
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.atomic.AtomicBoolean
import android.media.audiofx.AutomaticGainControl
import android.media.audiofx.NoiseSuppressor
import android.media.audiofx.AcousticEchoCanceler
import android.util.Log
import android.os.Build
import android.content.Context

/**
 * Native module for high-quality audio recording on Android.
 * This module focuses on clean, unprocessed audio capture for analysis purposes.
 */
class NativeAudioModule : Module() {
    // Using 48kHz and float encoding for maximum audio quality
    private val sampleRate = 48000 
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_FLOAT // 32-bit float format
    private val bufferSize = 4096 
    
    // State management using AtomicBoolean for thread safety
    private var audioRecord: AudioRecord? = null
    private var recordingFile: File? = null
    private var isRecording = AtomicBoolean(false)
    private var isPlaying = AtomicBoolean(false)
    private var isStreaming = AtomicBoolean(false)
    
    // Background processing using Kotlin coroutines
    private var recordingJob: Job? = null
    private var playbackJob: Job? = null
    private var streamingJob: Job? = null
    private val coroutineScope = CoroutineScope(Dispatchers.IO)
    
    private var streamBufferSize = bufferSize
    
    override fun definition() = ModuleDefinition {
        Name("NativeAudio")

        OnDestroy {
            stopRecording()
            stopStreaming() 
            coroutineScope.cancel()
        }
        
        Events("onAudioData")
        
        /**
         * Requests microphone permission from the user
         * 
         * @return Promise<Boolean> True if permission is granted, false otherwise
         */
        AsyncFunction("requestMicrophonePermission") { promise: Promise ->
            Log.d("NativeAudioModule", "requestMicrophonePermission: Starting permission request")
            
            val activity = appContext.currentActivity ?: run {
                Log.w("NativeAudioModule", "requestMicrophonePermission: No activity available, cannot request permission")
                promise.resolve(false)
                return@AsyncFunction
            }
            
            if (ActivityCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) 
                == PackageManager.PERMISSION_GRANTED) {
                Log.i("NativeAudioModule", "requestMicrophonePermission: Permission already granted")
                promise.resolve(true)
                return@AsyncFunction
            }
            
            Log.d("NativeAudioModule", "requestMicrophonePermission: Requesting RECORD_AUDIO permission")
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                0
            )
            
            // Android permission API is asynchronous but we need a synchronous response,
            // so we check if permission was immediately granted
            val granted = ActivityCompat.checkSelfPermission(
                activity, 
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED
            
            Log.d("NativeAudioModule", "requestMicrophonePermission: Permission ${if(granted) "granted" else "denied"} after request")
            promise.resolve(granted)
        }
        
        /**
         * Returns empty list since Android doesn't support iOS-style audio session modes
         * 
         * This is maintained for API compatibility with iOS, but has no effect on Android.
         * The Android implementation uses AudioSource types instead.
         * 
         * @return List<String> Empty list of audio modes
         */
        Function("getAvailableAudioSessionModes") {
            Log.w("NativeAudioModule", "Audio session modes are an iOS concept not available on Android")
            emptyList<String>()
        }
        
        /**
         * Starts recording audio to a file with maximum quality
         * 
         * @param fileName String Name of the output WAV file
         * @return Map<String, Any> Result containing success status and file information
         */
        AsyncFunction("fileStartRecording") { fileName: String -> 
            Log.i("NativeAudioModule", "fileStartRecording: Starting with filename '$fileName'")
            
            val activity = appContext.currentActivity
            if (activity == null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                Log.w("NativeAudioModule", "Recording started while app may be in background. " +
                    "Android 9+ restricts microphone access in background.")
            }
        
            val context = appContext.reactContext ?: run {
                Log.e("NativeAudioModule", "fileStartRecording: Failed - React context not available")
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "Context not available"
                )
            }
            
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) 
                != PackageManager.PERMISSION_GRANTED) {
                Log.e("NativeAudioModule", "fileStartRecording: Failed - Microphone permission not granted")
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "Microphone permission not granted"
                )
            }
            
            try {
                // Stop any ongoing recording
                if (isRecording.get()) {
                    Log.d("NativeAudioModule", "fileStartRecording: Stopping previous recording first")
                    stopRecording()
                }
                
                // Calculate minimum viable buffer size for this device
                val minBufferSize = AudioRecord.getMinBufferSize(
                    sampleRate, 
                    channelConfig, 
                    audioFormat
                )

                // Handle error codes
                if (minBufferSize == AudioRecord.ERROR_BAD_VALUE || minBufferSize == AudioRecord.ERROR) {
                    Log.e("NativeAudioModule", "fileStartRecording: getMinBufferSize failed with code $minBufferSize")
                    return@AsyncFunction mapOf(
                        "success" to false,
                        "error" to "getMinBufferSize failed with code $minBufferSize"
                    )
                }
                Log.d("NativeAudioModule", "fileStartRecording: Minimum buffer size for device: $minBufferSize bytes")
                
                val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
                val audioSource = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N &&
                    audioManager.getProperty(AudioManager.PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED) == "true") {
                    Log.i("NativeAudioModule", "fileStartRecording: Using UNPROCESSED audio source")
                    MediaRecorder.AudioSource.UNPROCESSED // Truly raw audio (API 24+)
                } else {
                    Log.i("NativeAudioModule", "fileStartRecording: Using VOICE_RECOGNITION audio source")
                    MediaRecorder.AudioSource.VOICE_RECOGNITION // Less processed audio
                }
                
                Log.d("NativeAudioModule", "fileStartRecording: Creating AudioRecord with sampleRate=$sampleRate, format=$audioFormat")
                audioRecord = AudioRecord(
                    audioSource,
                    sampleRate,
                    channelConfig,
                    audioFormat,
                    minBufferSize * 2
                )
                
                // Explicitly disable processing effects for clean audio
                disableAudioEffects(audioRecord?.audioSessionId ?: 0)
                Log.d("NativeAudioModule", "fileStartRecording: Audio effects disabled for session ID: ${audioRecord?.audioSessionId}")
                
                // Set up output file
                val filesDir = context.filesDir
                val audioDir = File(filesDir, "audio")
                if (!audioDir.exists()) {
                    Log.d("NativeAudioModule", "fileStartRecording: Creating audio directory")
                    audioDir.mkdir()
                }
                
                val wavFileName = if (fileName.endsWith(".wav")) fileName else "$fileName.wav"
                recordingFile = File(audioDir, wavFileName)
                Log.i("NativeAudioModule", "fileStartRecording: Recording to file: ${recordingFile?.absolutePath}")
                
                val record = audioRecord ?: run {
                    Log.e("NativeAudioModule", "fileStartRecording: Failed - Could not initialize AudioRecord")
                    return@AsyncFunction mapOf(
                        "success" to false,
                        "error" to "Failed to initialize audio recorder"
                    )
                }
                
                record.startRecording()
                isRecording.set(true)
                Log.i("NativeAudioModule", "fileStartRecording: Recording started successfully")
                
                // Process audio data in background coroutine
                recordingJob = coroutineScope.launch {
                    // We record to PCM first then convert to WAV when done
                    val tempFile = File("${recordingFile?.absolutePath}.pcm")
                    val outputStream = FileOutputStream(tempFile)
                    val buffer = FloatArray(bufferSize)
                    var totalSamples = 0L
                    var lastLogTime = System.currentTimeMillis()
                    
                    Log.d("NativeAudioModule", "fileStartRecording: Started background recording process")
                    
                    try {
                        while (isRecording.get() && isActive) {
                            val readResult = record.read(buffer, 0, bufferSize, AudioRecord.READ_BLOCKING)
                            if (readResult > 0) {
                                // Convert float samples to bytes
                                val byteBuffer = ByteBuffer.allocate(buffer.size * 4)
                                    .order(ByteOrder.LITTLE_ENDIAN)
                                
                                for (i in 0 until readResult) {
                                    byteBuffer.putFloat(buffer[i])
                                }
                                
                                outputStream.write(byteBuffer.array(), 0, readResult * 4)
                                totalSamples += readResult
                                
                                // Log progress every ~5 seconds to avoid flooding the logs
                                val currentTime = System.currentTimeMillis()
                                if (currentTime - lastLogTime > 5000) {
                                    val durationSeconds = totalSamples.toFloat() / sampleRate
                                    Log.v("NativeAudioModule", "fileStartRecording: Recording in progress - ${String.format("%.2f", durationSeconds)}s recorded")
                                    lastLogTime = currentTime
                                }
                            }
                        }
                    } finally {
                        outputStream.close()
                        Log.d("NativeAudioModule", "fileStartRecording: Recording stopped, finalizing file")
                        
                        // Convert raw PCM to WAV format with proper header
                        if (recordingFile != null && tempFile.exists()) {
                            Log.d("NativeAudioModule", "fileStartRecording: Converting PCM to WAV format")
                            addWavHeader(tempFile, recordingFile!!, sampleRate, 1, 32)
                            tempFile.delete()
                            Log.i("NativeAudioModule", "fileStartRecording: WAV file created successfully (${totalSamples} samples, ${totalSamples.toFloat() / sampleRate}s)")
                        } else {
                            Log.e("NativeAudioModule", "fileStartRecording: Failed to create WAV file - temp file missing")
                        }
                    }
                }
                
                return@AsyncFunction mapOf(
                    "success" to true,
                    "fileUri" to "file://${recordingFile?.absolutePath}",
                    "path" to recordingFile?.absolutePath
                )
                
            } catch (e: Exception) {
                Log.e("NativeAudioModule", "fileStartRecording: Exception occurred", e)
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to e.message
                )
            }
        }
        
        /**
         * Stops the current audio recording
         * 
         * @return Map<String, Any> Result containing success status and file information
         */
        AsyncFunction("fileStopRecording") {
            Log.d("NativeAudioModule", "fileStopRecording: Function called")
            
            if (!isRecording.get()) {
                Log.w("NativeAudioModule", "fileStopRecording: No active recording found")
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "No active recording"
                )
            }
            
            val path = recordingFile?.absolutePath
            Log.i("NativeAudioModule", "fileStopRecording: Stopping recording with output at $path")
            
            stopRecording()
            Log.d("NativeAudioModule", "fileStopRecording: Recording stopped successfully")
            
            if (File(path ?: "").exists()) {
                val fileSize = File(path ?: "").length()
                Log.i("NativeAudioModule", "fileStopRecording: WAV file confirmed (${fileSize} bytes)")
            } else {
                Log.w("NativeAudioModule", "fileStopRecording: File doesn't exist at expected path: $path")
            }
            
            return@AsyncFunction mapOf(
                "success" to true,
                "fileUri" to "file://$path",
                "path" to path
            )
        }
        
        /**
         * Checks if audio recording is currently active
         * 
         * @return Boolean True if recording is in progress
         */
        Function("isFileRecording") {
            isRecording.get()
        }
        
        /**
         * Deletes a recorded audio file
         * 
         * @param filePath String Path to the file to delete
         * @return Boolean True if file was deleted successfully
         */
        Function("deleteRecording") { filePath: String ->
            Log.d("NativeAudioModule", "deleteRecording: Attempting to delete file at path: $filePath")
            
            try {
                val file = File(filePath)
                
                if (!file.exists()) {
                    Log.w("NativeAudioModule", "deleteRecording: File not found at path: $filePath")
                    return@Function false
                }
                
                Log.d("NativeAudioModule", "deleteRecording: File exists (${file.length()} bytes), attempting deletion")
                
                val deleted = file.delete()
                if (deleted) {
                    Log.i("NativeAudioModule", "deleteRecording: File successfully deleted: $filePath")
                } else {
                    Log.e("NativeAudioModule", "deleteRecording: Failed to delete file: $filePath")
                }
                
                deleted
            } catch (e: Exception) {
                Log.e("NativeAudioModule", "deleteRecording: Exception while deleting file: ${e.message}", e)
                false
            }
        }
        
        
        /**
         * Starts real-time streaming of audio data
         * 
         * @param options Optional map containing configuration options like bufferSize
         * @return Map<String, Any> Result containing success status or error
         */
        AsyncFunction("startStreaming") { options: Map<String, Any>? ->
            Log.i("NativeAudioModule", "startStreaming: Starting audio streaming")
            
            val context = appContext.reactContext ?: run {
                Log.e("NativeAudioModule", "startStreaming: Failed - React context not available")
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "Context not available"
                )
            }
            
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) 
                != PackageManager.PERMISSION_GRANTED) {
                Log.e("NativeAudioModule", "startStreaming: Failed - Microphone permission not granted")
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "Microphone permission not granted"
                )
            }
            
            try {
                // Stop any ongoing streaming
                if (isStreaming.get()) {
                    Log.d("NativeAudioModule", "startStreaming: Stopping previous streaming session")
                    stopStreaming()
                }
                
                // Update buffer size if provided in options
                val originalBufferSize = streamBufferSize
                if (options != null && options["bufferSize"] is Int) {
                    val requestedSize = options["bufferSize"] as Int
                    if (requestedSize > 0) {
                        streamBufferSize = requestedSize
                        Log.d("NativeAudioModule", "startStreaming: Updated buffer size from $originalBufferSize to $requestedSize")
                    }
                }
                
                // Calculate minimum viable buffer size for this device
                val minBufferSize = AudioRecord.getMinBufferSize(
                    sampleRate,
                    channelConfig,
                    audioFormat
                )
                
                // Handle error codes
                if (minBufferSize == AudioRecord.ERROR_BAD_VALUE || minBufferSize == AudioRecord.ERROR) {
                    Log.e("NativeAudioModule", "startStreaming: getMinBufferSize failed with code $minBufferSize")
                    return@AsyncFunction mapOf(
                        "success" to false,
                        "error" to "getMinBufferSize failed with code $minBufferSize"
                    )
                }
                
                // Use the larger of the requested size or minimum size
                val bufferSize = maxOf(streamBufferSize, minBufferSize)
                Log.d("NativeAudioModule", "startStreaming: Using buffer size $bufferSize (min: $minBufferSize, requested: $streamBufferSize)")
                
                val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
                val audioSource: Int = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N &&
                    audioManager.getProperty(AudioManager.PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED) == "true") {
                    Log.i("NativeAudioModule", "startStreaming: Using UNPROCESSED audio source (API ${Build.VERSION.SDK_INT})")
                    MediaRecorder.AudioSource.UNPROCESSED
                } else {
                    Log.i("NativeAudioModule", "startStreaming: Using VOICE_RECOGNITION audio source (API ${Build.VERSION.SDK_INT})")
                    MediaRecorder.AudioSource.VOICE_RECOGNITION
                }
                
                Log.d("NativeAudioModule", "startStreaming: Creating AudioRecord with sampleRate=$sampleRate, format=$audioFormat")
                audioRecord = AudioRecord(
                    audioSource,
                    sampleRate,
                    channelConfig,
                    audioFormat,
                    bufferSize
                )
                
                // Explicitly disable processing effects for clean audio
                disableAudioEffects(audioRecord?.audioSessionId ?: 0)
                Log.d("NativeAudioModule", "startStreaming: Audio effects disabled for session ID: ${audioRecord?.audioSessionId}")
                
                val record = audioRecord ?: run {
                    Log.e("NativeAudioModule", "startStreaming: Failed - Could not initialize AudioRecord")
                    return@AsyncFunction mapOf(
                        "success" to false,
                        "error" to "Failed to initialize audio recorder"
                    )
                }
                
                // Check if initialization succeeded
                if (record.state != AudioRecord.STATE_INITIALIZED) {
                    Log.e("NativeAudioModule", "startStreaming: Failed - AudioRecord not properly initialized (state: ${record.state})")
                    return@AsyncFunction mapOf(
                        "success" to false,
                        "error" to "AudioRecord initialization failed with state: ${record.state}"
                    )
                }
                
                record.startRecording()
                isStreaming.set(true)
                Log.i("NativeAudioModule", "startStreaming: Recording started successfully")
                
                // Process audio data in background coroutine
                streamingJob = coroutineScope.launch {
                    val buffer = FloatArray(streamBufferSize)
                    var timestamp: Long = 0
                    var samplesProcessed: Long = 0
                    var lastLogTime = System.currentTimeMillis()
                    
                    Log.d("NativeAudioModule", "startStreaming: Started background streaming process")
                    
                    try {
                        while (isStreaming.get() && isActive) {
                            val readResult = record.read(buffer, 0, streamBufferSize, AudioRecord.READ_BLOCKING)
                            
                            if (readResult > 0) {
                                samplesProcessed += readResult
                                
                                // Create a copy of the buffer with only the valid data
                                val samples = FloatArray(readResult)
                                System.arraycopy(buffer, 0, samples, 0, readResult)
                                
                                // Send data to JavaScript
                                sendEvent("onAudioData", mapOf(
                                    "data" to samples,
                                    "timestamp" to timestamp,
                                    "sampleRate" to sampleRate
                                ))
                                
                                // Update timestamp (convert frames to sample time)
                                timestamp += readResult
                                
                                // Log progress every ~5 seconds to avoid flooding logs
                                val currentTime = System.currentTimeMillis()
                                if (currentTime - lastLogTime > 5000) {
                                    val durationSeconds = samplesProcessed.toFloat() / sampleRate
                                    Log.v("NativeAudioModule", "startStreaming: Streaming in progress - ${String.format("%.2f", durationSeconds)}s processed")
                                    lastLogTime = currentTime
                                }
                            } else if (readResult < 0) {
                                // Error reading audio data
                                Log.w("NativeAudioModule", "startStreaming: Error reading audio data, code: $readResult")
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("NativeAudioModule", "startStreaming: Error in streaming process", e)
                        stopStreaming()
                    } finally {
                        Log.i("NativeAudioModule", "startStreaming: Streaming stopped after processing ${samplesProcessed} samples (${samplesProcessed.toFloat() / sampleRate}s)")
                    }
                }
                
                Log.i("NativeAudioModule", "startStreaming: Streaming setup completed successfully")
                return@AsyncFunction mapOf("success" to true)
                
            } catch (e: Exception) {
                Log.e("NativeAudioModule", "startStreaming: Exception occurred", e)
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to e.message
                )
            }
        }
        
        /**
         * Stops the current audio streaming
         * 
         * @return Map<String, Any> Result containing success status or error
         */
        Function("stopStreaming") {
            Log.i("NativeAudioModule", "stopStreaming: Function called")
            
            if (!isStreaming.get()) {
                Log.w("NativeAudioModule", "stopStreaming: No active streaming to stop")
                return@Function mapOf(
                    "success" to false,
                    "error" to "No active streaming"
                )
            }
            
            stopStreaming()
            Log.i("NativeAudioModule", "stopStreaming: Streaming stopped successfully")
            return@Function mapOf("success" to true)
        }
        
        /**
         * Checks if audio streaming is currently active
         * 
         * @return Boolean True if streaming is in progress
         */
        Function("isStreaming") {
            isStreaming.get()
        }
        
        /**
         * Sets options for audio streaming
         * 
         * @param options Map<String, Any> Options including bufferSize
         * @return Boolean True if options were set successfully
         */
        Function("setStreamingOptions") { options: Map<String, Any> ->
            Log.d("NativeAudioModule", "setStreamingOptions: Called with options $options")
            
            val size = options["bufferSize"] as? Int
            if (size != null && size > 0) {
                val oldSize = streamBufferSize
                streamBufferSize = size
                Log.i("NativeAudioModule", "setStreamingOptions: Updated buffer size from $oldSize to $size samples")
                true
            } else {
                Log.w("NativeAudioModule", "setStreamingOptions: Invalid buffer size provided: $size")
                false
            }
        }

        
        // Audio playback functions (placeholder API for future implementation)
        AsyncFunction("playAudioFile") { filePath: String, options: Map<String, Any>? ->
            mapOf("success" to false, "error" to "Playback not yet implemented on Android")
        }
        
        Function("stopAudioPlayback") {
            mapOf("success" to false, "error" to "Playback not yet implemented on Android")
        }
        
        Function("isPlaying") {
            false
        }
    }

    /**
    * Stops the current streaming and cleans up resources
    */
    private fun stopStreaming() {
        Log.d("NativeAudioModule", "stopStreaming: Stopping streaming and cleaning up resources")
        
        isStreaming.set(false)
        streamingJob?.cancel()
        streamingJob = null
        Log.d("NativeAudioModule", "stopStreaming: Background job cancelled")
        
        audioRecord?.let { recorder ->
            try {
                if (recorder.state == AudioRecord.STATE_INITIALIZED) {
                    recorder.stop()
                    Log.d("NativeAudioModule", "stopStreaming: AudioRecord stopped")
                }
                recorder.release()
                Log.d("NativeAudioModule", "stopStreaming: AudioRecord released")
            } catch (e: Exception) {
                Log.w("NativeAudioModule", "stopStreaming: Error during cleanup: ${e.message}")
                // Ignore errors during cleanup as the streaming has already stopped
            }
        }
        audioRecord = null
        
        Log.d("NativeAudioModule", "stopStreaming: Cleanup complete")
    }
    
    /**
     * Stops the current recording and cleans up resources
     */
    private fun stopRecording() {
        Log.d("NativeAudioModule", "stopRecording: Stopping recording and cleaning up resources")
        
        isRecording.set(false)
        recordingJob?.cancel()
        recordingJob = null
        Log.d("NativeAudioModule", "stopRecording: Background job cancelled")
        
        audioRecord?.let { recorder ->
            try {
                if (recorder.state == AudioRecord.STATE_INITIALIZED) {
                    recorder.stop()
                    Log.d("NativeAudioModule", "stopRecording: AudioRecord stopped")
                }
                recorder.release()
                Log.d("NativeAudioModule", "stopRecording: AudioRecord released")
            } catch (e: Exception) {
                Log.w("NativeAudioModule", "stopRecording: Error during cleanup: ${e.message}")
                // Ignore errors during cleanup as the recording has already stopped
            }
        }
        audioRecord = null
        
        Log.d("NativeAudioModule", "stopRecording: Cleanup complete")
    }
    
    /**
     * Disables audio processing effects that would interfere with clean recording
     * 
     * @param audioSessionId Int The audio session ID to disable effects for
     */
    private fun disableAudioEffects(audioSessionId: Int) {
        if (audioSessionId == 0) {
            Log.d("NativeAudioModule", "disableAudioEffects: Skipping with invalid session ID 0")
            return
        }
        
        Log.d("NativeAudioModule", "disableAudioEffects: Disabling audio effects for session $audioSessionId")
        
        // Android automatically applies these effects which can distort analytical audio
        if (AutomaticGainControl.isAvailable()) {
            val agc = AutomaticGainControl.create(audioSessionId)
            val wasEnabled = agc?.enabled ?: false
            agc?.enabled = false
            Log.d("NativeAudioModule", "disableAudioEffects: Automatic Gain Control was ${if (wasEnabled) "enabled" else "disabled"}, now disabled")
        } else {
            Log.d("NativeAudioModule", "disableAudioEffects: Automatic Gain Control not available on this device")
        }
        
        if (NoiseSuppressor.isAvailable()) {
            val ns = NoiseSuppressor.create(audioSessionId)
            val wasEnabled = ns?.enabled ?: false
            ns?.enabled = false
            Log.d("NativeAudioModule", "disableAudioEffects: Noise Suppressor was ${if (wasEnabled) "enabled" else "disabled"}, now disabled")
        } else {
            Log.d("NativeAudioModule", "disableAudioEffects: Noise Suppressor not available on this device")
        }
        
        if (AcousticEchoCanceler.isAvailable()) {
            val aec = AcousticEchoCanceler.create(audioSessionId)
            val wasEnabled = aec?.enabled ?: false
            aec?.enabled = false
            Log.d("NativeAudioModule", "disableAudioEffects: Acoustic Echo Canceler was ${if (wasEnabled) "enabled" else "disabled"}, now disabled")
        } else {
            Log.d("NativeAudioModule", "disableAudioEffects: Acoustic Echo Canceler not available on this device")
        }
    }
    
    /**
     * Creates a proper WAV file from raw PCM audio data
     * 
     * @param pcmFile File Source file containing raw PCM data
     * @param wavFile File Destination WAV file to create
     * @param sampleRate Int Audio sample rate in Hz
     * @param channels Int Number of audio channels
     * @param bitsPerSample Int Bits per sample (bit depth)
     */
    private fun addWavHeader(
        pcmFile: File, 
        wavFile: File, 
        sampleRate: Int, 
        channels: Int, 
        bitsPerSample: Int
    ) {
        Log.d("NativeAudioModule", "addWavHeader: Converting ${pcmFile.name} to WAV format (${sampleRate}Hz, $channels ch, ${bitsPerSample}-bit)")
        
        val pcmData = pcmFile.readBytes()
        val totalDataLen = pcmData.size
        val totalSize = totalDataLen + 36
        
        Log.d("NativeAudioModule", "addWavHeader: PCM data size: ${totalDataLen} bytes (${totalDataLen / (channels * (bitsPerSample / 8))} samples)")
        
        // Create standard 44-byte WAV header
        val header = ByteBuffer.allocate(44)
        
        // "RIFF" chunk descriptor
        header.put("RIFF".toByteArray())
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(totalSize)
        header.put("WAVE".toByteArray())
        
        // "fmt " sub-chunk
        header.put("fmt ".toByteArray())
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(16)
        header.order(ByteOrder.LITTLE_ENDIAN).putShort(3) // 3 = IEEE float format
        header.order(ByteOrder.LITTLE_ENDIAN).putShort(channels.toShort())
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(sampleRate)
        
        val byteRate = sampleRate * channels * (bitsPerSample / 8)
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(byteRate)
        header.order(ByteOrder.LITTLE_ENDIAN).putShort((channels * (bitsPerSample / 8)).toShort())
        header.order(ByteOrder.LITTLE_ENDIAN).putShort(bitsPerSample.toShort())
        
        // "data" sub-chunk
        header.put("data".toByteArray())
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(totalDataLen)
        
        // Write complete WAV file
        try {
            FileOutputStream(wavFile).use { output ->
                output.write(header.array())
                output.write(pcmData)
            }
            Log.i("NativeAudioModule", "addWavHeader: Successfully created WAV file at ${wavFile.absolutePath} (${wavFile.length()} bytes)")
        } catch (e: Exception) {
            Log.e("NativeAudioModule", "addWavHeader: Failed to write WAV file: ${e.message}", e)
        }
    }
}