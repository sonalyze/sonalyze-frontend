package expo.modules.nativeaudio

import android.Manifest
import android.content.pm.PackageManager
import android.media.*
import android.os.Process
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

class NativeAudioModule : Module() {
    // Audio configuration constants
    private val sampleRate = 48000 // 48kHz sample rate
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_FLOAT // Equivalent to 32-bit float (highest quality)
    private val bufferSize = 4096 // Default buffer size
    
    // Recording state
    private var audioRecord: AudioRecord? = null
    private var recordingFile: File? = null
    private var isRecording = AtomicBoolean(false)
    private var recordingJob: Job? = null
    private val coroutineScope = CoroutineScope(Dispatchers.IO)
    
    // Playback state
    private var audioTrack: AudioTrack? = null
    private var isPlaying = AtomicBoolean(false)
    private var playbackJob: Job? = null
    
    // Streaming state
    private var isStreaming = AtomicBoolean(false)
    private var streamingJob: Job? = null
    private var streamBufferSize = bufferSize
    
    override fun definition() = ModuleDefinition {
        Name("NativeAudio")
        
        Events("onAudioData")
        
        // Permission management
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
            
            // We can't immediately know the result, so we check if permission was granted in practice
            val granted = ActivityCompat.checkSelfPermission(
                activity, 
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED
            
            promise.resolve(granted)
        }
        
        Function("getAvailableAudioSessionModes") { -> 
            // Android doesn't have the concept of audio session modes like iOS,
            // but we return some equivalent concepts for consistency
            listOf("default", "voiceRecognition", "measurement")
        }
        
        // File-based recording functions
        AsyncFunction("fileStartRecording") { fileName: String -> 
            val context = appContext.reactContext ?: return@AsyncFunction mapOf(
                "success" to false,
                "error" to "Context not available"
            )
            
            // Check permission
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
                
                // Calculate buffer size based on audio parameters
                val minBufferSize = AudioRecord.getMinBufferSize(
                    sampleRate, 
                    channelConfig, 
                    audioFormat
                )
                
                // Create AudioRecord instance
                audioRecord = AudioRecord(
                    MediaRecorder.AudioSource.VOICE_RECOGNITION, // This source has minimal processing
                    sampleRate,
                    channelConfig,
                    audioFormat,
                    minBufferSize * 2 // Double the minimum for safety
                )
                
                // Disable audio effects if available
                disableAudioEffects(audioRecord?.audioSessionId ?: 0)
                
                // Create output file
                val filesDir = context.filesDir
                val audioDir = File(filesDir, "audio")
                if (!audioDir.exists()) {
                    audioDir.mkdir()
                }
                
                val wavFileName = if (fileName.endsWith(".wav")) fileName else "$fileName.wav"
                recordingFile = File(audioDir, wavFileName)
                
                // Start recording
                val record = audioRecord ?: return@AsyncFunction mapOf(
                    "success" to false,
                    "error" to "Failed to initialize audio recorder"
                )
                
                record.startRecording()
                isRecording.set(true)
                
                // Start a coroutine to read audio data
                recordingJob = coroutineScope.launch {
                    // Create output stream for raw PCM data (we'll add WAV header later)
                    val tempFile = File("${recordingFile?.absolutePath}.pcm")
                    val outputStream = FileOutputStream(tempFile)
                    val buffer = FloatArray(bufferSize)
                    
                    try {
                        while (isRecording.get() && isActive) {
                            val readResult = record.read(buffer, 0, bufferSize, AudioRecord.READ_BLOCKING)
                            if (readResult > 0) {
                                // Convert float array to bytes
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
                        
                        // When done recording, convert to WAV format
                        if (recordingFile != null && tempFile.exists()) {
                            addWavHeader(tempFile, recordingFile!!, sampleRate, 1, 32)
                            tempFile.delete() // Delete the temporary PCM file
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
        
        Function("isFileRecording") {
            isRecording.get()
        }
        
        Function("deleteRecording") { filePath: String ->
            try {
                val file = File(filePath)
                if (file.exists()) {
                    file.delete()
                    true
                } else {
                    false
                }
            } catch (e: Exception) {
                false
            }
        }
        
        // Streaming functions - we'll implement these later
        // For now, adding stubs similar to iOS implementation
        AsyncFunction("startStreaming") { options: Map<String, Any>? ->
            // Streaming implementation will go here
            mapOf("success" to false, "error" to "Not implemented yet")
        }
        
        Function("stopStreaming") {
            mapOf("success" to false, "error" to "Not implemented yet")
        }
        
        Function("isStreaming") {
            false
        }
        
        Function("setStreamingOptions") { options: Map<String, Any> ->
            if (options.containsKey("bufferSize")) {
                val size = options["bufferSize"] as? Int
                if (size != null && size > 0) {
                    streamBufferSize = size
                    true
                } else {
                    false
                }
            } else {
                false
            }
        }
        
        // Audio playback functions - also stubs for now
        AsyncFunction("playAudioFile") { filePath: String, options: Map<String, Any>? ->
            mapOf("success" to false, "error" to "Not implemented yet")
        }
        
        Function("stopAudioPlayback") {
            mapOf("success" to false, "error" to "Not implemented yet")
        }
        
        Function("isPlaying") {
            false
        }
    }
    
    // Helper methods
    
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
                // Ignore errors during cleanup
            }
        }
        audioRecord = null
    }
    
    /**
     * Disables audio effects that might interfere with clean recording
     */
    private fun disableAudioEffects(audioSessionId: Int) {
        if (audioSessionId == 0) return
        
        // Disable Automatic Gain Control if available
        if (AutomaticGainControl.isAvailable()) {
            val agc = AutomaticGainControl.create(audioSessionId)
            agc?.enabled = false
            // Don't release, we need it to stay disabled
        }
        
        // Disable Noise Suppressor if available
        if (NoiseSuppressor.isAvailable()) {
            val ns = NoiseSuppressor.create(audioSessionId)
            ns?.enabled = false
        }
        
        // Disable Acoustic Echo Canceler if available
        if (AcousticEchoCanceler.isAvailable()) {
            val aec = AcousticEchoCanceler.create(audioSessionId)
            aec?.enabled = false
        }
    }
    
    /**
     * Adds a WAV header to a raw PCM file
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
        val totalSize = totalDataLen + 36  // 36 = size of header minus 8 bytes
        
        val header = ByteBuffer.allocate(44) // WAV header is 44 bytes
        
        // RIFF header
        header.put("RIFF".toByteArray())
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(totalSize)
        header.put("WAVE".toByteArray())
        
        // Format chunk
        header.put("fmt ".toByteArray())
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(16) // Format chunk size (16 for PCM)
        header.order(ByteOrder.LITTLE_ENDIAN).putShort(3) // Audio format (3 = IEEE Float)
        header.order(ByteOrder.LITTLE_ENDIAN).putShort(channels.toShort()) // Channels
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(sampleRate) // Sample rate
        
        val byteRate = sampleRate * channels * (bitsPerSample / 8)
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(byteRate) // Byte rate
        header.order(ByteOrder.LITTLE_ENDIAN).putShort((channels * (bitsPerSample / 8)).toShort()) // Block align
        header.order(ByteOrder.LITTLE_ENDIAN).putShort(bitsPerSample.toShort()) // Bits per sample
        
        // Data chunk
        header.put("data".toByteArray())
        header.order(ByteOrder.LITTLE_ENDIAN).putInt(totalDataLen) // Data size
        
        // Write header + data to WAV file
        FileOutputStream(wavFile).use { output ->
            output.write(header.array())
            output.write(pcmData)
        }
    }

    // Clean up resources when the module is destroyed
    override fun onDestroy() {
        super.onDestroy()
        stopRecording()
        coroutineScope.cancel()
    }
}