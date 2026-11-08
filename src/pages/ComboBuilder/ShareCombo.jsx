import { useState } from 'react';
import { useTranslation } from '../../i18n/Language';
import { comboSharePath } from '../../lib/comboShare';
import s from './ComboBuilder.module.css';

export default function ShareCombo({ catalog, selection }) {
  const { t } = useTranslation();
  const [shared, setShared] = useState(null);
  const path = comboSharePath(catalog, selection);
  const current = shared?.path === path ? shared : null;

  async function share() {
    const url = new URL(path, window.location.origin);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    const snapshot = { path, url: url.href, local, copied: false };
    setShared(snapshot);
    try {
      await navigator.clipboard.writeText(url.href);
      setShared((value) => (value === snapshot ? { ...value, copied: true } : value));
    } catch {
      // The input remains available for copying manually.
    }
  }

  return (
    <div className={s.shareCombo}>
      <button type="button" className="button button-secondary" onClick={share}>
        {t('Поделиться сборкой')}
      </button>
      {current && (
        <>
          <label className={s.field}>
            {t('Ссылка на сборку')}
            <input
              type="url"
              readOnly
              value={current.url}
              onFocus={(event) => event.target.select()}
            />
          </label>
          <p role="status">
            {t(current.copied ? 'Ссылка скопирована.' : 'Скопируй ссылку из поля выше.')}
          </p>
          {current.local && (
            <p>{t('Для друга скопируй ссылку с публичного сайта после выкладки каталога.')}</p>
          )}
        </>
      )}
    </div>
  );
}
