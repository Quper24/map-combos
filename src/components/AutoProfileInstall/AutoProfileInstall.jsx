import { useTranslation } from '../../i18n/Language';
import { useState, useRef, useEffect } from 'react';
import InstructionModal from './InstructionModal';
import Icon from '../ui/Icon';
import { MAX_PROFILE_SIZE } from '../../lib/profileMods.js';
import { processProfile } from '../../lib/processProfile.js';
import './AutoProfileInstall.css';
export default function AutoProfileInstall({ combo, modBlock }) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [includeMods, setIncludeMods] = useState(false);
  const fileInputRef = useRef(null);
  const operation = useRef(null);
  const busy = status === 'processing';
  const cancel = () => {
    operation.current?.controller.abort();
    operation.current = null;
  };
  useEffect(() => {
    cancel();
    setSelectedFile(null);
    setIncludeMods(false);
    setStatus('idle');
    setErrorMsg('');
    return cancel;
  }, [combo.id, combo.version_game, modBlock]);
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    cancel();
    setSelectedFile(null);
    setErrorMsg('');
    if (file.name.toLowerCase() !== 'profile.sii' || !file.size || file.size > MAX_PROFILE_SIZE) {
      setErrorMsg('Выбери непустой profile.sii размером до 300 КБ.');
      setStatus('error');
      return;
    }
    setSelectedFile(file);
    setStatus('selected');
  };
  const handleProcess = async () => {
    if (!selectedFile || operation.current) return;
    const task = {
      controller: new AbortController(),
    };
    operation.current = task;
    setStatus('processing');
    setErrorMsg('');
    try {
      let mods = modBlock;
      if (mods === undefined) {
        const response = await fetch(
          `/profiles/${combo.version_game}/${combo.id}${combo.mods && includeMods ? 'm' : ''}.txt`,
          { signal: task.controller.signal },
        );
        if (!response.ok)
          throw new Error('Не удалось загрузить список модов сборки. Попробуй ещё раз.');
        mods = await response.text();
      }
      const buffer = await selectedFile.arrayBuffer();
      if (operation.current !== task) return;
      const text = await processProfile(buffer, { mods, signal: task.controller.signal });
      if (operation.current !== task) return;
      const url = URL.createObjectURL(
        new Blob([text], {
          type: 'text/plain;charset=utf-8',
        }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'profile.sii';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('done');
    } catch (error) {
      if (operation.current === task && error.name !== 'AbortError') {
        setErrorMsg(error.message);
        setStatus('error');
      }
    } finally {
      if (operation.current === task) operation.current = null;
    }
  };
  const statusText = {
    idle: 'Выбери profile.sii',
    selected: 'Файл выбран. Можно расставить моды.',
    processing: 'Обрабатывается в твоём браузере…',
    done: 'Готово! Файл передан браузеру для скачивания.',
    error: `Ошибка: ${errorMsg}`,
  }[status];
  const statusClass =
    status === 'error'
      ? 'status-error'
      : status === 'done'
        ? 'status-done'
        : busy
          ? 'status-loading'
          : 'status-idle';
  return (
    <div className="auto-profile-install">
      <div className="profile-instruction-callout">
        <div className="profile-instruction-copy">
          <span className="profile-instruction-label">{t('Важно перед выбором профиля')}</span>
          <strong>{t('Сначала прочитай инструкцию')}</strong>
          <p>
            {t(
              'Сохрани резервную копию profile.sii и ознакомься с порядком действий перед изменением профиля.',
            )}
          </p>
        </div>
        <button
          className="auto-profile-instruction"
          onClick={() => setIsModalOpen(true)}
          aria-haspopup="dialog"
        >
          {t('Прочитать инструкцию ')}
          <Icon name="arrow" size={18} />
        </button>
      </div>
      <div className="auto-profile-content">
        <div className="toolbar">
          <div className="toolbar-item">
            <span className="toolbar-label">{t('1. Файл')}</span>
            <input
              type="file"
              accept=".sii"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{
                display: 'none',
              }}
            />
            <button
              className="toolbar-btn file-btn"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              {t(
                selectedFile
                  ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(0)} КБ)`
                  : 'Выбрать файл',
              )}
            </button>
          </div>
          <div className="toolbar-item">
            <span className="toolbar-label">{t('2. Расстановка и скачивание')}</span>
            <div className="apply-block">
              <button
                className="toolbar-btn action-btn"
                onClick={handleProcess}
                disabled={!selectedFile || busy}
              >
                {t(busy ? 'Обрабатывается…' : 'Расставить и скачать')}
              </button>
              {combo.mods && (
                <label className="mods-checkbox">
                  <input
                    type="checkbox"
                    checked={includeMods}
                    disabled={busy}
                    onChange={(event) => {
                      setIncludeMods(event.target.checked);
                      setStatus(selectedFile ? 'selected' : 'idle');
                      setErrorMsg('');
                    }}
                  />
                  <span>
                    {t(combo.tags.includes('server') ? 'Основные + опциональные' : 'Карты + Моды')}
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>
        <div role="status" aria-live="polite" className={`status ${statusClass}`}>
          {t('Статус: ')}
          {t(statusText)}
        </div>
        <p className="profile-local-note">
          {t('Файл обрабатывается только в твоём браузере и не отправляется на сервер.')}
        </p>
      </div>
      <InstructionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} combo={combo} />
    </div>
  );
}
