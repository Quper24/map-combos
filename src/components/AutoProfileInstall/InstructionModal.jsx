import { useTranslation } from '../../i18n/Language';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../ui/Icon';
import s from './InstructionModal.module.css';
export default function InstructionModal({ isOpen, onClose, combo }) {
  const { t } = useTranslation();
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
    dialog?.focus({
      preventScroll: true,
    });
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
      previous?.focus({
        preventScroll: true,
      });
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
              <Icon name="grid" size={16} />
              {t(' Порядок без ручной расстановки')}
            </span>
            <h2 className={s.title} id="profile-instruction-title">
              {t('Автоматическая расстановка модов')}
            </h2>
            <p id="profile-instruction-intro">
              {t(
                'Инструмент меняет список активных модов и их порядок в профиле. Сами файлы модов нужно скачать и установить заранее.',
              )}
            </p>
          </div>
          <button
            className={s.close}
            type="button"
            onClick={onClose}
            aria-label={t('Закрыть инструкцию')}
          >
            <Icon name="close" size={21} />
          </button>
        </header>

        <div
          className={s.body}
          tabIndex={0}
          role="region"
          aria-label={t('Шаги автоматической расстановки')}
        >
          <div className={s.combo}>
            <span>{t('Выбранная сборка')}</span>
            <strong>{t(combo.title)}</strong>
            <span>
              {t(game)} · {combo.version_game}
            </span>
          </div>
          <section className={s.phase}>
            <h3>{t('Подготовка в игре')}</h3>
            <ol className={s.steps}>
              <li>
                <strong>{t('Подготовь нужный профиль')}</strong>
                <p>
                  {t(
                    'Выбери или создай профиль. В его настройках временно отключи Steam Cloud. Нажми «Продолжить карьеру», сохрани игру и полностью выйди из неё.',
                  )}
                </p>
              </li>
              <li>
                <strong>{t('Найди файл profile.sii')}</strong>
                <p>{t('В проводнике открой папку:')}</p>
                <code className={s.path}>
                  {t('Документы\\')}
                  {t(game)}\profiles
                </code>
                <p>
                  {t('Внутри найди папку выбранного профиля и файл ')}
                  <code>profile.sii</code>
                  {t(
                    '. Если профилей несколько, дата изменения поможет найти тот, из которого ты только что вышел.',
                  )}
                </p>
              </li>
              <li>
                <strong>{t('Сделай резервную копию')}</strong>
                <p>
                  {t(
                    'Скопируй всю папку этого профиля в другое место. До замены файла оставь игру закрытой.',
                  )}
                </p>
              </li>
            </ol>
          </section>

          <section className={s.phase}>
            <h3>{t('Расстановка на сайте')}</h3>
            <ol className={s.steps} start={4}>
              <li>
                <strong>{t('Выбери файл профиля')}</strong>
                <p>
                  {t('Нажми «Выбрать файл» и укажи ')}
                  <code>profile.sii</code>
                  {t('. Максимальный размер файла — 300 КБ.')}
                </p>
              </li>
              <li>
                <strong>{t('Примени порядок этой сборки')}</strong>
                {combo.mods && (
                  <p>
                    {t('Если нужны')}{' '}
                    {t(
                      combo.tags.includes('server') ? 'опциональные моды' : 'моды вместе с картами',
                    )}
                    {t(', перед обработкой отметь «')}
                    {t(optionalModsLabel)}
                    {t('». Эти файлы тоже должны быть установлены.')}
                  </p>
                )}
                <p>
                  {t(
                    'Нажми «Расставить и скачать». Браузер расшифрует профиль, заменит порядок модов и начнёт скачивание. Во время обработки оставь страницу открытой.',
                  )}
                </p>
              </li>
              <li>
                <strong>{t('Скачай результат')}</strong>
                <p>
                  {t('Дождись окончания скачивания. Итоговый файл должен называться')}{' '}
                  <code>profile.sii</code>
                  {t('. Если браузер добавил к имени «(1)», убери эту приписку.')}
                </p>
              </li>
            </ol>
          </section>

          <section className={s.phase}>
            <h3>{t('Возвращение в игру')}</h3>
            <ol className={s.steps} start={7}>
              <li>
                <strong>{t('Замени исходный файл')}</strong>
                <p>
                  {t('При закрытой игре перенеси скачанный ')}
                  <code>profile.sii</code>
                  {t(
                    ' в ту же папку профиля и подтверди замену. Сайт не заменяет файл на компьютере автоматически.',
                  )}
                </p>
              </li>
              <li>
                <strong>{t('Проверь моды и загрузи карьеру')}</strong>
                <p>
                  {t(
                    'Запусти игру и открой «Модификации». Убедись, что у активных модов нет красных восклицательных знаков. Если игра сообщает об отсутствующих модах, установи нужные файлы и проверь их версии по сборке.',
                  )}
                </p>
                <p>
                  {t(
                    'После успешной загрузки карьеры при необходимости включи Steam Cloud обратно. Если нужно вернуть прежний профиль, восстанови резервную копию при закрытой игре.',
                  )}
                </p>
              </li>
            </ol>
          </section>

          <aside className={s.processing}>
            <strong>{t('Как обрабатывается файл')}</strong>
            <p>
              {t('Расшифровка ')}
              <code>profile.sii</code>
              {t(
                ' и замена списка модов выполняются локально в твоём браузере. Файл профиля не отправляется на сервер. Сайт загружает только декодер и готовый список модов выбранной сборки. Полученный файл нужно заменить вручную.',
              )}
            </p>
          </aside>
        </div>
        <footer className={s.footer}>
          <span>{t('Перед началом сохрани резервную копию профиля.')}</span>
          <button type="button" className="button" onClick={onClose}>
            {t('К расстановке модов ')}
            <Icon name="arrow" size={17} />
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
