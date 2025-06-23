/* This test screeen wont work from this location. 
    Copy it into the screens folder of the aal-frontend app to test it. */

	import React, { useState, useEffect, FC } from 'react';
	import { View, Text, TouchableOpacity } from 'react-native';
	import { TextInput } from 'react-native';
	import NativeAudio from '..';
	
	type AudioTestScreenProps = {};
	
	const AudioTestScreen: FC<AudioTestScreenProps> = (
		props: AudioTestScreenProps
	) => {
		const [hasPermission, setHasPermission] = useState<boolean | null>(null);
		const [isRecording, setIsRecording] = useState<boolean>(false);
		const [recordedFile, setRecordedFile] = useState<string | null>(null);
		const [isPlaying, setIsPlaying] = useState<boolean>(false);
		const [error, setError] = useState<string | null>(null);
		const [calibrationInput, setCalibrationInput] = useState<string>('1.0');
	
	
		// Request microphone permission when component mounts
		useEffect(() => {
			const requestPermission = async (): Promise<void> => {
				try {
					const granted = await NativeAudio.requestMicrophonePermission();
					setHasPermission(granted);
				} catch (err) {
					setError('Failed to request permission: ' + err);
					console.error(err);
				}
			};
	
			requestPermission();
		}, []);
	
		// Start recording to a file
		const startRecording = async (): Promise<void> => {
			try {
				setError(null);
				const fileName = `recording-${Date.now()}.wav`;
				const calibrationFactor = parseFloat(calibrationInput) || 1.0;
				const result = await NativeAudio.fileStartRecording(fileName, calibrationFactor);
				if (result.success) {
					setIsRecording(true);
					console.log(`Recording started: ${fileName}`);
				} else {
					setError(`Failed to start recording: ${result.error}`);
				}
			} catch (err) {
				setError('Error starting recording: ' + err);
				console.error(err);
			}
		};
	
		// Stop recording and get the file path
		const stopRecording = async (): Promise<void> => {
			try {
				const result = await NativeAudio.fileStopRecording();
				setIsRecording(false);
	
				if (result.success && result.path) {
					setRecordedFile(result.path);
					console.log(`Recording saved: ${result.path}`);
				} else if (!result.success) {
					setError(`Failed to stop recording: ${result.error}`);
				}
			} catch (err) {
				setError('Error stopping recording: ' + err);
				console.error(err);
			}
		};
	
		// Play the recorded audio file
		const playRecording = async (): Promise<void> => {
			if (!recordedFile) return;
	
			try {
				const result = await NativeAudio.playAudioFile(recordedFile, {
					volume: 1.0,
				});
	
				if (result.success) {
					setIsPlaying(true);
				} else {
					setError(`Failed to play recording: ${result.error}`);
				}
			} catch (err) {
				setError('Error playing recording: ' + err);
				console.error(err);
			}
		};
	
		// Stop playback
		const stopPlayback = (): void => {
			try {
				const result = NativeAudio.stopAudioPlayback();
				if (result.success) {
					setIsPlaying(false);
				} else {
					setError(`Failed to stop playback: ${result.error}`);
				}
			} catch (err) {
				setError('Error stopping playback: ' + err);
				console.error(err);
			}
		};
	
		// Update recording and playback state
		useEffect(() => {
			const checkStatus = (): void => {
				// Check if recording state changed externally
				const recordingStatus = NativeAudio.isFileRecording();
				if (recordingStatus !== isRecording) {
					setIsRecording(recordingStatus);
				}
	
				// Check if playback state changed externally
				const playbackStatus = NativeAudio.isPlaying();
				if (playbackStatus !== isPlaying) {
					setIsPlaying(playbackStatus);
				}
			};
	
			const interval = setInterval(checkStatus, 500);
			return () => clearInterval(interval);
		}, [isRecording, isPlaying]);
	
		return (
			<View className="flex-1 p-5 bg-gray-100">
				<Text className="text-2xl font-bold mb-5 text-center">
					Audio Testing
				</Text>
	
				{/* Permission status */}
				<View className="mb-5 p-4 bg-white rounded-lg shadow">
					<Text className="text-lg font-bold mb-2.5">
						Microphone Permission
					</Text>
					<Text>
						{hasPermission === null
							? 'Checking...'
							: hasPermission
								? 'Granted'
								: 'Denied'}
					</Text>
					{hasPermission === false && (
						<TouchableOpacity
							className="mt-2 bg-blue-500 py-2 px-4 rounded-md"
							onPress={() =>
								NativeAudio.requestMicrophonePermission()
							}
						>
							<Text className="text-white text-center">
								Request Permission
							</Text>
						</TouchableOpacity>
					)}
				</View>
	
				{/* Recording controls */}
				{hasPermission && (
					<View className="mb-5 p-4 bg-white rounded-lg shadow">
						<Text className="text-lg font-bold mb-2.5">Recording</Text>
	
						{/* Eingabefeld für Kalibrierwert */}
						<View className="mb-4">
							<Text className="font-medium mb-1">Calibration Factor</Text>
							<TextInput
								className="bg-gray-100 border border-gray-300 rounded-md p-2"
								keyboardType="numeric"
								value={calibrationInput}
								onChangeText={setCalibrationInput}
								placeholder="z. B. 0.91"
							/>
						</View>
	
						<View className="flex-row justify-around mb-2.5">
							<TouchableOpacity
								className={`py-2 px-4 rounded-md ${isRecording ? 'bg-gray-300' : 'bg-green-500'}`}
								onPress={startRecording}
								disabled={isRecording}
							>
								<Text className="text-white">Start Recording</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className={`py-2 px-4 rounded-md ${!isRecording ? 'bg-gray-300' : 'bg-red-500'}`}
								onPress={stopRecording}
								disabled={!isRecording}
							>
								<Text className="text-white">Stop Recording</Text>
							</TouchableOpacity>
						</View>
						<Text>
							Status: {isRecording ? 'Recording...' : 'Not recording'}
						</Text>
					</View>
				)}
	
				{/* Playback controls */}
				{recordedFile && (
					<View className="mb-5 p-4 bg-white rounded-lg shadow">
						<Text className="text-lg font-bold mb-2.5">Playback</Text>
						<Text
							className="mb-2.5 text-xs"
							numberOfLines={1}
							ellipsizeMode="middle"
						>
							File: {recordedFile}
						</Text>
						<View className="flex-row justify-around mb-2.5">
							<TouchableOpacity
								className={`py-2 px-4 rounded-md ${isPlaying ? 'bg-gray-300' : 'bg-blue-500'}`}
								onPress={playRecording}
								disabled={isPlaying}
							>
								<Text className="text-white">Play</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className={`py-2 px-4 rounded-md ${!isPlaying ? 'bg-gray-300' : 'bg-orange-500'}`}
								onPress={stopPlayback}
								disabled={!isPlaying}
							>
								<Text className="text-white">Stop</Text>
							</TouchableOpacity>
						</View>
						<Text>
							Status: {isPlaying ? 'Playing...' : 'Not playing'}
						</Text>
					</View>
				)}
	
				{/* Error display */}
				{error && (
					<View className="p-2.5 bg-red-50 rounded border border-red-300">
						<Text className="text-red-600">{error}</Text>
					</View>
				)}
			</View>
		);
	};
	
	export default AudioTestScreen;