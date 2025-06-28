NativeAudio API Reference

## Overview

The `NativeAudio` is a high-quality audio recording, playback and streaming module for iOS (Android and Web comming soon). It provides two approaches:

- **File-based recording**  
   Records a complete WAV file for analysis after recording completes.
- **Real-time streaming**  
   Continuously provides audio buffer data for immediate analysis.

## Audio Quality

High-quality WAV recording settings optimized for audio analysis:

- **48 kHz sample rate**
- **24-bit depth**
- **Linear PCM format**: Uncompressed to avoid artifacts

## API Reference

### Permission Management

#### `requestMicrophonePermission()`

- **Description**: Requests microphone permission from the user
- **Parameters**: _None_
- **Returns**: `Promise<boolean>` – `true` if granted, `false` if denied
- **Notes**: Handles iOS version differences in permission APIs

#### `getAvailableAudioSessionModes()`

- **Description**: Returns available audio session modes (for debugging)
- **Parameters**: _None_
- **Returns**: `string[]` – Array of mode identifiers
- **Notes**: Useful to check supported recording modes on each device

### File Recording Functions

#### `fileStartRecording(fileName: string)`

- **Description**: Starts recording audio to a WAV file
- **Parameters**:
    - `fileName`: Name of the output file (".wav" added if missing)
- **Returns**:
    - `success`: `boolean` – Recording start status
    - `fileUri`: `string` – URI to the recording file
    - `path`: `string` – File system path
    - `error`: `string` – Error description (on failure)
- **Notes**: Uses measurement mode when available for raw, unprocessed audio

#### `fileStopRecording()`

- **Description**: Stops current file recording and releases resources
- **Parameters**: _None_
- **Returns**:
    - `success`: `boolean`
    - `fileUri`: `string`
    - `path`: `string`
    - `error`: `string`
- **Side effects**:
    - Sets recorder to `nil`
    - Deactivates audio session

#### `isFileRecording()`

- **Description**: Checks if file recording is in progress
- **Parameters**: _None_
- **Returns**: `boolean`

#### `deleteRecording(filePath: string)`

- **Description**: Deletes a recorded audio file
- **Parameters**:
    - `filePath`: Full path to the file
- **Returns**: `boolean` – `true` if deleted, `false` on error
- **Notes**: Useful for cleanup after analysis

#### `getRecordingData(filePath: string)`

- **Description**: Retrieves raw data from a recorded file as base64 string
- **Parameters**:
    - `filePath`: Full path to the recording file
- **Returns**:
    - `success`: `boolean`
    - `data`: `string` - Base64 encoded audio data (when success is true)
    - `error`: `string` - Error description (when success is false)
- **Notes**: Useful for processing or transmitting recorded audio data in JavaScript

### Streaming Functions

#### `startStreaming(options?: { bufferSize?: number })`

- **Description**: Starts real-time audio streaming
- **Parameters**:
    - `options.bufferSize`: Buffer size in frames (optional)
- **Returns**:
    - `success`: `boolean`
    - `error`: `string`
- **Emits**:
    - `onAudioData` event with:
        - `data`: `number[]` – Audio samples
        - `timestamp`: `number` – Sample time
        - `sampleRate`: `number` – Hz
- **Notes**: Uses `AVAudioEngine` for live buffers

#### `stopStreaming()`

- **Description**: Stops audio streaming and cleans up
- **Parameters**: _None_
- **Returns**:
    - `success`: `boolean`
    - `error`: `string`
- **Side effects**: Releases audio resources

#### `isStreaming()`

- **Description**: Checks if streaming is active
- **Parameters**: _None_
- **Returns**: `boolean`

#### `setStreamingOptions(options: { bufferSize: number })`

- **Description**: Updates streaming configuration
- **Parameters**:
    - `options.bufferSize`: New buffer size in frames
- **Returns**: `boolean`
- **Notes**: Balances responsiveness (lower) vs. efficiency (higher)

### Audio Playback Functions

#### `playAudioFile(filePath: string, options?: { volume?: number })`

- **Description**: Plays an audio file with high fidelity
- **Parameters**:
    - `filePath`: System path to audio file
    - `options.volume`: `0.0–1.0` (default `1.0`)
- **Returns**:
    - `success`: `boolean`
    - `error`: `string`
- **Notes**: Optimized for precision playback of test signals

#### `stopAudioPlayback()`

- **Description**: Stops playback and releases resources
- **Parameters**: _None_
- **Returns**:
    - `success`: `boolean`
    - `error`: `string`

#### `isPlaying()`

- **Description**: Checks if audio playback is active
- **Parameters**: _None_
- **Returns**: `boolean`
