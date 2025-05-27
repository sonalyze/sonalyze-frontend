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
        
        Events("onAudioData")
        
        /**
         * Requests microphone permission from the user
         * 
         * @return Promise<Boolean> True if permission is granted, false otherwise
         */
        AsyncFunction("requestMicrophonePermission") { promise: Promise ->
            val activity = appContext.currentActivity ?: run {
                promise.resolve(false)
                return@AsyncFunction
            }
            
            if (ActivityCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) 
                == PackageManager.PERMISSION_GRANTED) {
                promise.resolve(true)
                return@AsyncFunction
            }
            
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
            val activity = appContext.currentActivity
            if (activity == null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                Log.w("NativeAudioModule", "Recording started while app may be in background. " +
                    "Android 9+ restricts microphone access in background.")
            }

            val context = appContext.reactContext ?: return@AsyncFunction mapOf(
                "success" to false,
                "error" to "Context not available"
            )
            
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) 
                != PackageManager.PERMISSION_GRANTED) {
                return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "Microphone permission not granted"
                )
            }
            
            try {
                // Stop any ongoing recording
                if (isRecording.get()) {
                    stopRecording()
                }
                
                // Calculate minimum viable buffer size for this device
                val minBufferSize = AudioRecord.getMinBufferSize(
                    sampleRate, 
                    channelConfig, 
                    audioFormat
                )
                
                val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
                val audioSource = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N &&
                    audioManager.getProperty(AudioManager.PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED) == "true") {
                    MediaRecorder.AudioSource.UNPROCESSED // Truly raw audio (API 24+)
                } else {
                    MediaRecorder.AudioSource.VOICE_RECOGNITION // Less processed audio
                }
                
                audioRecord = AudioRecord(
                    audioSource,
                    sampleRate,
                    channelConfig,
                    audioFormat,
                    minBufferSize * 2
                )
                
                // Explicitly disable processing effects for clean audio
                disableAudioEffects(audioRecord?.audioSessionId ?: 0)
                
                // Set up output file
                val filesDir = context.filesDir
                val audioDir = File(filesDir, "audio")
                if (!audioDir.exists()) {
                    audioDir.mkdir()
                }
                
                val wavFileName = if (fileName.endsWith(".wav")) fileName else "$fileName.wav"
                recordingFile = File(audioDir, wavFileName)
                
                val record = audioRecord ?: return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "Failed to initialize audio recorder"
                )
                
                record.startRecording()
                isRecording.set(true)
                
                // Process audio data in background coroutine
                recordingJob = coroutineScope.launch {
                    // We record to PCM first then convert to WAV when done
                    val tempFile = File("${recordingFile?.absolutePath}.pcm")
                    val outputStream = FileOutputStream(tempFile)
                    val buffer = FloatArray(bufferSize)
                    
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
                            }
                        }
                    } finally {
                        outputStream.close()
                        
                        // Convert raw PCM to WAV format with proper header
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
         * Stops the current audio recording
         * 
         * @return Map<String, Any> Result containing success status and file information
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
            try {
                val file = File(filePath)
                file.exists() && file.delete()
            } catch (e: Exception) {
                false
            }
        }
        
        // Streaming functions (placeholder API for future implementation)
        AsyncFunction("startStreaming") { options: Map<String, Any>? ->
            mapOf("success" to false, "error" to "Streaming not yet implemented on Android")
        }
        
        Function("stopStreaming") {
            mapOf("success" to false, "error" to "Streaming not yet implemented on Android")
        }
        
        Function("isStreaming") {
            false
        }
        
        /**
         * Sets options for audio streaming
         * 
         * @param options Map<String, Any> Options including bufferSize
         * @return Boolean True if options were set successfully
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
     * Stops the current recording and cleans up resources
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
                // Ignore errors during cleanup as the recording has already stopped
            }
        }
        audioRecord = null
    }
    
    /**
     * Disables audio processing effects that would interfere with clean recording
     * 
     * @param audioSessionId Int The audio session ID to disable effects for
     */
    private fun disableAudioEffects(audioSessionId: Int) {
        if (audioSessionId == 0) return
        
        // Android automatically applies these effects which can distort analytical audio
        if (AutomaticGainControl.isAvailable()) {
            AutomaticGainControl.create(audioSessionId)?.enabled = false
        }
        
        if (NoiseSuppressor.isAvailable()) {
            NoiseSuppressor.create(audioSessionId)?.enabled = false
        }
        
        if (AcousticEchoCanceler.isAvailable()) {
            AcousticEchoCanceler.create(audioSessionId)?.enabled = false
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
        val pcmData = pcmFile.readBytes()
        val totalDataLen = pcmData.size
        val totalSize = totalDataLen + 36
        
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
        FileOutputStream(wavFile).use { output ->
            output.write(header.array())
            output.write(pcmData)
        }
    }

    /**
     * Clean up resources when module is destroyed
     */
    override fun onDestroy() {
        super.onDestroy()
        stopRecording()
        coroutineScope.cancel()
    }
}