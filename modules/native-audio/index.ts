// Reexport the native module. On web, it will be resolved to NativeAudioModule.web.ts
// and on native platforms to NativeAudioModule.ts
export { default } from './src/NativeAudioModule';
export { default as NativeAudioView } from './src/NativeAudioView';
export * from  './src/NativeAudio.types';
