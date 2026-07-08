import React, { useState, useRef } from 'react';
import InstructionModal from './InstructionModal';
import './AutoProfileInstall.css';

export default function AutoProfileInstall({ combo }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState('idle');
  const [decodedText, setDecodedText] = useState('');
  const [updatedText, setUpdatedText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const API_BASE = 'https://api.qupersimulator.ru';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setStatus('uploaded');
      setDecodedText('');
      setUpdatedText('');
      setErrorMsg('');
    } else {
      setSelectedFile(null);
      setStatus('idle');
    }
  };

  const handleDecode = async () => {
    if (!selectedFile) {
      alert('Пожалуйста, выберите файл profile.sii');
      return;
    }
    setStatus('decoding');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE}/api/decode`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка декодирования');
      }

      setDecodedText(data.decodedText);
      setStatus('decoded');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const handleApply = async () => {
    if (!decodedText) {
      alert('Сначала декодируйте файл');
      return;
    }
    setStatus('applying');
    setErrorMsg('');

    try {
      const modsResponse = await fetch(`/profiles/${combo.id}.txt`);
      if (!modsResponse.ok) {
        throw new Error(`Файл модов для combo.id "${combo.id}" не найден (404)`);
      }
      const newModsBlock = await modsResponse.text();

      const updated = replaceActiveMods(decodedText, newModsBlock);
      setUpdatedText(updated);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  function replaceActiveMods(originalText, newModsBlock) {
    const lines = originalText.split('\n');
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('active_mods:')) {
        startIndex = i;
        break;
      }
    }
    if (startIndex === -1) {
      throw new Error('Строка "active_mods:" не найдена в файле');
    }

    for (let i = startIndex + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('active_mods[')) {
        continue;
      } else {
        endIndex = i;
        break;
      }
    }
    if (endIndex === -1) {
      endIndex = lines.length;
    }

    const before = lines.slice(0, startIndex).join('\n');
    const after = lines.slice(endIndex).join('\n');

    return before + '\n' + newModsBlock + '\n' + after;
  }

  const handleDownload = () => {
    if (!updatedText) return;
    const blob = new Blob([updatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profile.sii';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Определяем класс для статуса
  const getStatusClass = () => {
    if (status === 'error') return 'status-error';
    if (status === 'done') return 'status-done';
    if (status === 'decoding' || status === 'applying') return 'status-loading';
    return 'status-idle';
  };

  const renderStatusText = () => {
    switch (status) {
      case 'idle': return 'Ожидание файла';
      case 'uploaded': return 'Файл загружен';
      case 'decoding': return 'Декодируется...';
      case 'decoded': return 'Декодирован';
      case 'applying': return 'Применяется...';
      case 'done': return 'Готово!';
      case 'error': return `❌ Ошибка: ${errorMsg}`;
      default: return '';
    }
  };

  return (
    <div className="auto-profile-install">
      <button className="auto-profile-instruction" onClick={() => setIsModalOpen(true)}>
        Инструкция
      </button>

      <div className="auto-profile-content">
        {/* Шаг 1 */}
        <div className="step">
          <p>1. Загрузите файл profile.sii</p>
          <input
            type="file"
            accept=".sii"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
            id="file-input"
          />
          <button className="auto-profile-button" onClick={() => fileInputRef.current?.click()}>
            {selectedFile ? selectedFile.name : 'Выбрать файл'}
          </button>
        </div>

        {/* Шаг 2 */}
        <div className="step">
          <p>2. Нажмите кнопку "Декодировать"</p>
          <button
            className="auto-profile-install-button"
            onClick={handleDecode}
            disabled={status === 'decoding' || !selectedFile}
          >
            {status === 'decoding' ? 'Декодирование...' : 'Декодировать'}
          </button>
        </div>

        {/* Шаг 3 */}
        <div className="step">
          <p>3. Нажмите кнопку "Применить"</p>
          <button
            className="auto-profile-install-button"
            onClick={handleApply}
            disabled={status !== 'decoded'}
          >
            Применить
          </button>
        </div>

        {/* Шаг 4 */}
        <div className="step">
          <p>4. Нажмите кнопку "Скачать"</p>
          <button
            className="auto-profile-install-button"
            onClick={handleDownload}
            disabled={status !== 'done'}
          >
            Скачать
          </button>
        </div>

        {/* Статус */}
        <div className={`status ${getStatusClass()}`}>
          <span>Статус: {renderStatusText()}</span>
        </div>

        {/* combo.id (отладочный) */}
        <div className="combo-id">combo.id: {combo.id}</div>
      </div>

      <InstructionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}