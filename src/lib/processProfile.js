export function processProfile(buffer, { mods, signal } = {}) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./profile.worker.js', import.meta.url), { type: 'module' });
    const timeout = setTimeout(
      () => finish(reject, new Error('Время обработки истекло. Попробуй выбрать файл заново.')),
      30000,
    );
    function abort() {
      finish(reject, signal.reason);
    }
    function finish(callback, value) {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
      worker.terminate();
      callback(value);
    }
    worker.onmessage = ({ data }) =>
      data.error ? finish(reject, new Error(data.error)) : finish(resolve, data.text);
    worker.onerror = () =>
      finish(
        reject,
        new Error('Не удалось запустить декодер в браузере. Обнови страницу и попробуй снова.'),
      );
    signal?.addEventListener('abort', abort, { once: true });
    try {
      worker.postMessage({ buffer, mods }, [buffer]);
    } catch (error) {
      finish(reject, error);
    }
  });
}
