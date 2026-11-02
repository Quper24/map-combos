import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../ui/Icon';
import s from './InstructionModal.module.css';

export default function InstructionModal({ isOpen, onClose, combo }) {
  const dialogRef = useRef(null);
  const game = combo.tags.includes('ats') ? 'American Truck Simulator' : 'Euro Truck Simulator 2';
  const optionalModsLabel = combo.tags.includes('server')
    ? 'Основные + опциональные'
    : 'Карты + Моды';
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    dialog?.focus({ preventScroll: true });
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
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
      document.body.style.overflow = previousOverflow;
      previous?.focus({ preventScroll: true });
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className={s.overlay} onClick={handleOverlayClick}>
      <div
        className={s.window}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-instruction-title"
        aria-describedby="profile-instruction-intro"
        tabIndex={-1}
      >
        <header className={s.header}>
          <div>
            <span className={s.eyebrow}>
              <Icon name="grid" size={16} /> Порядок без ручной расстановки
            </span>
            <h2 className={s.title} id="profile-instruction-title">
              Автоматическая расстановка модов
            </h2>
            <p id="profile-instruction-intro">
              Инструмент меняет список активных модов и их порядок в профиле. Сами файлы модов нужно
              скачать и установить заранее.
            </p>
          </div>
          <button
            className={s.close}
            type="button"
            onClick={onClose}
            aria-label="Закрыть инструкцию"
          >
            <Icon name="close" size={21} />
          </button>
        </header>

        <div
          className={s.body}
          tabIndex={0}
          role="region"
          aria-label="Шаги автоматической расстановки"
        >
          <div className={s.combo}>
            <span>Выбранная сборка</span>
            <strong>{combo.title}</strong>
            <span>
              {game} · {combo.version_game}
            </span>
          </div>
          <section className={s.phase}>
            <h3>Подготовка в игре</h3>
            <ol className={s.steps}>
              <li>
                <strong>Подготовь нужный профиль</strong>
                <p>
                  Выбери или создай профиль. В его настройках временно отключи Steam Cloud. Нажми
                  «Продолжить карьеру», сохрани игру и полностью выйди из неё.
                </p>
              </li>
              <li>
                <strong>Найди файл profile.sii</strong>
                <p>В проводнике открой папку:</p>
                <code className={s.path}>Документы\{game}\profiles</code>
                <p>
                  Внутри найди папку выбранного профиля и файл <code>profile.sii</code>. Если
                  профилей несколько, дата изменения поможет найти тот, из которого ты только что
                  вышел.
                </p>
              </li>
              <li>
                <strong>Сделай резервную копию</strong>
                <p>
                  Скопируй всю папку этого профиля в другое место. До замены файла оставь игру
                  закрытой.
                </p>
              </li>
            </ol>
          </section>

          <section className={s.phase}>
            <h3>Расстановка на сайте</h3>
            <ol className={s.steps} start={4}>
              <li>
                <strong>Выбери и расшифруй файл</strong>
                <p>
                  Нажми «Выбрать», укажи <code>profile.sii</code> и нажми «Декодировать». Дождись
                  статуса «Декодирован». Максимальный размер файла — 300 КБ.
                </p>
              </li>
              <li>
                <strong>Примени порядок этой сборки</strong>
                {combo.mods && (
                  <p>
                    Если нужны{' '}
                    {combo.tags.includes('server') ? 'опциональные моды' : 'моды вместе с картами'},
                    перед применением отметь «{optionalModsLabel}». Эти файлы тоже должны быть
                    установлены.
                  </p>
                )}
                <p>Нажми «Применить» и дождись статуса «Готово!».</p>
              </li>
              <li>
                <strong>Скачай результат</strong>
                <p>
                  Нажми «Скачать». Итоговый файл должен называться <code>profile.sii</code>. Если
                  браузер добавил к имени «(1)», убери эту приписку.
                </p>
              </li>
            </ol>
          </section>

          <section className={s.phase}>
            <h3>Возвращение в игру</h3>
            <ol className={s.steps} start={7}>
              <li>
                <strong>Замени исходный файл</strong>
                <p>
                  При закрытой игре перенеси скачанный <code>profile.sii</code> в ту же папку
                  профиля и подтверди замену. Сайт не заменяет файл на компьютере автоматически.
                </p>
              </li>
              <li>
                <strong>Проверь моды и загрузи карьеру</strong>
                <p>
                  Запусти игру и открой «Модификации». Убедись, что у активных модов нет красных
                  восклицательных знаков. Если игра сообщает об отсутствующих модах, установи нужные
                  файлы и проверь их версии по сборке.
                </p>
                <p>
                  После успешной загрузки карьеры при необходимости включи Steam Cloud обратно. Если
                  нужно вернуть прежний профиль, восстанови резервную копию при закрытой игре.
                </p>
              </li>
            </ol>
          </section>

          <aside className={s.processing}>
            <strong>Как обрабатывается файл</strong>
            <p>
              Для расшифровки <code>profile.sii</code> отправляется на сервер Quper Simulator.
              Список модов меняется в браузере, затем ты скачиваешь результат и заменяешь файл
              вручную.
            </p>
          </aside>
        </div>
        <footer className={s.footer}>
          <span>Перед началом сохрани резервную копию профиля.</span>
          <button type="button" className="button" onClick={onClose}>
            К расстановке модов <Icon name="arrow" size={17} />
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
