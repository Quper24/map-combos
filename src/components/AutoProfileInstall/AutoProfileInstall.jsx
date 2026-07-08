import React, { useState, useRef } from 'react';
import InstructionModal from './InstructionModal';
import './AutoProfileInstall.css';

export default function AutoProfileInstall({ combo }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Состояния процесса
  const [status, setStatus] = useState('idle'); // idle | uploaded | decoding | decoded | applying | done | error
  const [decodedText, setDecodedText] = useState('');
  const [updatedText, setUpdatedText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Базовый URL вашего API (используем тот же, что и для /players)
  const API_BASE = 'https://api.qupersimulator.ru';

  // Обработчик выбора файла
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setStatus('uploaded');
      // Сбрасываем старые данные
      setDecodedText('');
      setUpdatedText('');
      setErrorMsg('');
    } else {
      setSelectedFile(null);
      setStatus('idle');
    }
  };

  // Декодирование на сервере
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

  // Замена модов (локально, на клиенте)
  const handleApply = async () => {
    if (!decodedText) {
      alert('Сначала декодируйте файл');
      return;
    }
    setStatus('applying');
    setErrorMsg('');

    try {
      // Загружаем файл модов для данного combo.id из папки public/profiles/
      const modsResponse = await fetch(`/profiles/${combo.id}.txt`);
      if (!modsResponse.ok) {
        throw new Error(`Файл модов для combo.id "${combo.id}" не найден (404)`);
      }
      const newModsBlock = await modsResponse.text();

      // Выполняем замену блока active_mods
      const updated = replaceActiveMods(decodedText, newModsBlock);
      setUpdatedText(updated);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  // Функция замены блока active_mods (клиентская)
  function replaceActiveMods(originalText, newModsBlock) {
    // Разбиваем текст на строки
    const lines = originalText.split('\n');
    let startIndex = -1;
    let endIndex = -1;

    // Ищем строку, содержащую "active_mods:" (может быть с пробелами в начале)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('active_mods:')) {
        startIndex = i;
        break;
      }
    }
    if (startIndex === -1) {
      throw new Error('Строка "active_mods:" не найдена в файле');
    }

    // Определяем конец блока (первая строка после блока, которая не начинается с "active_mods[")
    for (let i = startIndex + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('active_mods[')) {
        continue; // это часть блока
      } else {
        endIndex = i; // первая строка после блока
        break;
      }
    }
    // Если дошли до конца файла, то endIndex = длина массива
    if (endIndex === -1) {
      endIndex = lines.length;
    }

    // Собираем итоговый текст: часть до блока + новый блок + часть после
    const before = lines.slice(0, startIndex).join('\n');
    const after = lines.slice(endIndex).join('\n');

    // Вставляем новый блок (он уже содержит все строки с active_mods: и active_mods[0..N])
    return before + '\n' + newModsBlock + '\n' + after;
  }

  // Скачивание готового файла
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

  // Отображение текста статуса
  const renderStatus = () => {
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
      <button
        className="auto-profile-instruction"
        onClick={() => setIsModalOpen(true)}
      >
        Инструкция
      </button>

      <div className="auto-profile-content">
        <p>1. Загрузите файл profile.sii</p>

        <input
          type="file"
          accept=".sii"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
          id="file-input"
        />

        <button
          className="auto-profile-button"
          onClick={() => fileInputRef.current?.click()}
        >
          {selectedFile ? selectedFile.name : 'Выбрать файл'}
        </button>

        <p>2. Нажмите кнопку "Декодировать"</p>
        <button
          className="auto-profile-install-button"
          onClick={handleDecode}
          disabled={status === 'decoding' || !selectedFile}
        >
          {status === 'decoding' ? 'Декодирование...' : 'Декодировать'}
        </button>

        <p>3. Нажмите кнопку "Применить"</p>
        <button
          className="auto-profile-install-button"
          onClick={handleApply}
          disabled={status !== 'decoded'} // только после успешного декодирования
        >
          Применить
        </button>

        <p>4. Нажмите кнопку "Скачать"</p>
        <button
          className="auto-profile-install-button"
          onClick={handleDownload}
          disabled={status !== 'done'} // только после применения
        >
          Скачать
        </button>

        <div className="status" style={{ marginTop: '15px', fontWeight: 'bold' }}>
          <span>Статус: {renderStatus()}</span>
        </div>

        {/* Отладочная информация (можно убрать) */}
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#555' }}>
          combo.id: {combo.id}
        </div>
      </div>

      <InstructionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}