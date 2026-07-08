import React from 'react';
import './AutoProfileInstall.css';

export default function InstructionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-window">
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2 className="modal-title">📖 Инструкция по установке модов</h2>

        <div className="modal-body">
          <ol>
            <li>
              В игре создать либо выбрать профиль для установки модов.
            </li>
            <li>
              В настройках карьеры отключить синхронизацию с облаком Steam
              (её можно будет вернуть позднее).
            </li>
            <li>
              Нажать «Продолжить карьеру», запуститься и выйти из игры
              («Система» → «Выход»).
            </li>
            <li>
              В проводнике перейти в папку профиля:
              <ul>
                <li>
                  <code>Документы/Euro Truck Simulator 2/profiles</code> или
                </li>
                <li>
                  <code>Документы/American Truck Simulator/profiles</code>
                </li>
              </ul>
              Открыть самую свежую папку (по дате изменения) и найти файл <code>profile.sii</code>.
            </li>
            <li>
              На сайте нажмите кнопку «Выбрать файл» и загрузите этот <code>profile.sii</code>.
            </li>
            <li>
              Нажмите кнопку «Декодировать» – файл будет расшифрован.
            </li>
            <li>
              Нажмите кнопку «Применить» – в файл будут вставлены новые моды из выбранной комбинации.
            </li>
            <li>
              Нажмите кнопку «Скачать» – сохраните полученный файл.
            </li>
            <li>
              <strong>Замените</strong> исходный <code>profile.sii</code> в папке профиля на скачанный (с заменой).
            </li>
            <li>
              Зайдите в игру, в раздел «Модификации» и убедитесь, что в активных модах нет
              <span className="red-exclamation"> красных восклицательных знаков</span>.
            </li>
            <li>
              Если есть «красные» моды – исправьте их вручную (подгрузите нужные дополнения).
            </li>
            <li>
              После успешного запуска при необходимости верните синхронизацию с облаком Steam.
            </li>
          </ol>

          <div className="modal-status">
            ✅ Все операции с вашим файлом выполняются локально в браузере –
            ваш профиль не передаётся на сторонние серверы.
          </div>
        </div>
      </div>
    </div>
  );
}