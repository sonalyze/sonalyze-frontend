import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './NativeAudio.types';

type NativeAudioModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class NativeAudioModule extends NativeModule<NativeAudioModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(NativeAudioModule, 'NativeAudioModule');
