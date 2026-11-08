import { useRef, useState } from 'react';
import { useTranslation } from '../../i18n/Language';
import s from './ComboBuilder.module.css';

async function uploadImage(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  try {
    const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  } finally {
    bitmap.close();
  }
  const image = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (!image || image.type !== 'image/webp') throw new Error('WebP unavailable');
  const response = await fetch('/__combo-editor/image', { method: 'POST', body: image });
  if (!response.ok) throw new Error('Image upload failed');
  return (await response.json()).path;
}

export default function EditorImageField({
  initialPath = '',
  name = 'image',
  label = 'Загрузить картинку',
}) {
  const { t } = useTranslation();
  const [path, setPath] = useState(initialPath);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const pathInput = useRef(null);
  async function selectImage(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setStatus('Выбери картинку размером до 10 МБ.');
      return;
    }
    setBusy(true);
    setStatus('Сохраняем картинку…');
    pathInput.current.setCustomValidity(t('Дождись сохранения картинки.'));
    try {
      setPath(await uploadImage(file));
      setStatus('Картинка сохранена. Сохрани запись, чтобы привязать её.');
    } catch {
      setStatus('Не удалось сохранить картинку.');
    } finally {
      pathInput.current?.setCustomValidity('');
      setBusy(false);
    }
  }
  return (
    <div className={s.imageField}>
      <label className={s.field}>
        {t(label)}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={busy}
          onChange={selectImage}
        />
      </label>
      <label className={s.field}>
        {t('Путь к картинке (/img/…)')}
        <input
          name={name}
          ref={pathInput}
          value={path}
          onChange={(event) => setPath(event.target.value)}
        />
      </label>
      {path.startsWith('/img/') && <img src={path} alt="" className={s.thumb} />}
      {status && <small role="status">{t(status)}</small>}
    </div>
  );
}
