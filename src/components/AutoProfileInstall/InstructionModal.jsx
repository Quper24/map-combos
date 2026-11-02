import { useEffect, useRef } from 'react';
import './AutoProfileInstall.css';

export default function InstructionModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialog) return;
      const controls = [...dialog.querySelectorAll('button, a[href], input, [tabindex="0"]')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialog)
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      previous?.focus();
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-window"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-instruction-title"
        tabIndex={-1}
      >
        <button className="modal-close" onClick={onClose} aria-label="Закрыть инструкцию">
          ✕
        </button>

        <h2 className="modal-title" id="profile-instruction-title">
          📖 Инструкция по установке модов
        </h2>

        <div className="modal-body">
          <ol>
            <li>В игре создать либо выбрать профиль для установки модов.</li>
            <li>
              В настройках карьеры отключить синхронизацию с облаком Steam (её можно будет вернуть
              позднее).
            </li>
            <li>Нажать «Продолжить карьеру», запуститься и выйти из игры («Система» → «Выход»).</li>
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
            <li>Нажмите кнопку «Декодировать» – файл будет расшифрован.</li>
            <li>
              Нажмите кнопку «Применить» – в файл будут вставлены новые моды из выбранной
              комбинации.
            </li>
            <li>Нажмите кнопку «Скачать» – сохраните полученный файл.</li>
            <li>
              <strong>Замените</strong> исходный <code>profile.sii</code> в папке профиля на
              скачанный (с заменой).
            </li>
            <li>
              Зайдите в игру, в раздел «Модификации» и убедитесь, что в активных модах нет
              <span className="red-exclamation"> красных восклицательных знаков</span>.
            </li>
            <li>Если есть «красные» моды – исправьте их вручную (подгрузите нужные дополнения).</li>
            <li>
              После успешного запуска при необходимости верните синхронизацию с облаком Steam.
            </li>
          </ol>

          <div className="modal-status">
            🔒 Файл <code>profile.sii</code> передаётся на наш сервер{' '}
            <strong>только для расшифровки</strong>. После обработки он мгновенно удаляется и не
            сохраняется. Замена модов и скачивание готового файла происходят уже в вашем браузере.
          </div>
        </div>
      </div>
    </div>
  );
}
