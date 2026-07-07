import React, { useState, useRef } from 'react';
import InstructionModal from './InstructionModal';
import './AutoProfileInstall.css';

export default function AutoProfileInstall({ combo }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleApply = () => {
    if (!selectedFile) {
      alert('Пожалуйста, выберите файл profile.sii');
      return;
    }
    console.log('Выбранный файл:', selectedFile.name);
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
        <p>Загрузите файл profile.sii</p>

        {/* Скрытый input для выбора файла */}
        <input
          type="file"
          accept=".sii"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
          id="file-input"
        />

        {/* Кастомная кнопка, открывающая диалог выбора */}
        <button
          className="auto-profile-button"
          onClick={() => fileInputRef.current?.click()}
        >
          {selectedFile ? selectedFile.name : 'Выбрать файл'}
        </button>

        <p>И нажмите кнопку "Применить"</p>
        <button
          className="auto-profile-install-button"
          onClick={handleApply}
        >
          Применить
        </button>
      </div>

      <p>{combo.id}</p>

      <InstructionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}