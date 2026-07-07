import React from 'react';
import './AutoProfileInstall.css'; // стили добавим в этот файл

export default function InstructionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Закрытие по клику на фон (overlay)
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
              В настройке карьеры отключить синхронизацию с облаком Steam
              (её можно будет вернуть позднее).
            </li>
            <li>
              Нажать «Продолжить карьеру», запуститься и нажать
              «Система» → «Выход».
            </li>
            <li>
              В проводнике перейти в папку:
              <ul>
                <li>
                  <code>Документы/Euro Truck Simulator 2/profiles</code> или
                </li>
                <li>
                  <code>Документы/American Truck Simulator/profiles</code>
                </li>
              </ul>
              Отсортировать папки по дате изменения (открыть самую новую).
              Загрузить файл <code>profile.sii</code>.
            </li>
            
            <li>Нажать «Применить».</li>
            <li>Проверить «Статус».</li>
            <li>
              Переименовать скачанный файл в <code>profile.sii</code>
              (при необходимости).
            </li>
            <li>
              Вставить его с заменой в папку, откуда загружали на сайт
              файл <code>profile.sii</code>.
            </li>
            <li>Зайти в игру, в раздел «Модификации».</li>
            <li>
              Проверить, чтобы в активных модификациях (колонка справа)
              не было модов с <span className="red-exclamation">красным
              восклицательным знаком</span>.
            </li>
            <li>
              Если всё в порядке (красных модов нет) — можно запускать игру.
            </li>
            <li>
              При наличии «красных» модов справа — исправить вручную.
            </li>
            <li>
              <strong>Не забудьте вернуть синхронизацию профиля с облаком Steam. (Если это необходимо)</strong>
            </li>
          </ol>

          <div className="modal-status">
              Ваш профиль не загружается ни на какой сервер, все изменения
              выполняются в вашем браузере. Но они не изменяют выбранный
              вами профиль, а лишь предлагают скачать изменённую версию.
          </div>
        </div>
      </div>
    </div>
  );
}