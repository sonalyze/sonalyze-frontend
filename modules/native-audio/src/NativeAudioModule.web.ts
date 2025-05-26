import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './NativeAudio.types';

type NativeAudioModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class NativeAudioModule extends NativeModule<NativeAudioModuleEvents> {

  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
};

export default registerWebModule(NativeAudioModule, 'NativeAudioModule');
