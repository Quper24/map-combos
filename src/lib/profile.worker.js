import { init, decode } from '../vendor/sii-decode/decoder.js';
import { replaceActiveMods } from './profileMods.js';

self.onmessage = async ({ data }) => {
  try {
    await init();
    const text = decode(new Uint8Array(data.buffer));
    self.postMessage({ text: data.mods === undefined ? text : replaceActiveMods(text, data.mods) });
  } catch (error) {
    self.postMessage({
      error: `Не удалось обработать профиль. Проверь, что выбран исправный profile.sii. ${error.message || error}`,
    });
  }
};
