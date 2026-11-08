import { useId, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n/Language';
import {
  BeforeLaunchDetails,
  ComboDisclosure,
  LauncherDetails,
} from '../../components/ComboContent/ComboGuides';
import ExternalLink from '../../components/ui/ExternalLink';
import Video from '../../components/Video/Video';
import { addToCombo, isSelectable, removeFromCombo, resolveCombo } from '../../lib/comboBuilder';
import { youtubeVideoId } from '../../lib/content';
import { EntryBadge, OrderDownloads, OrderList } from './ComboBuilder';
import s from './ComboBuilder.module.css';
import page from '../Combo/Combo.module.css';

export default function PresetContent({ catalog, preset }) {
  const { t } = useTranslation();
  const heading = useId();
  const accordion = `combo-info-${heading}`;
  const [selection, setSelection] = useState(preset.selection);
  const result = useMemo(() => resolveCombo(catalog, selection), [catalog, selection]);
  const byId = new Map(catalog.entries.map((entry) => [entry.id, entry]));
  const server = preset.tags?.includes('server');
  const original =
    selection.length === preset.selection.length &&
    preset.selection.every((id) => selection.includes(id));
  const removals = server
    ? undefined
    : new Map([...result.manual].map((id) => [id, removeFromCombo(catalog, selection, id)]));

  return (
    <div className={page.layout}>
      <aside aria-label={t('Информация о сборке')}>
        <h2>{t('Информация о сборке')}</h2>
        <div className={s.toolbar}>
          {original && preset.profile && (
            <ExternalLink href={preset.profile}>{t('Готовый профиль')}</ExternalLink>
          )}
          {preset.boosty && (
            <ExternalLink className="button button-boosty" href={preset.boosty}>
              {t(original ? 'Сборка на Boosty' : 'Исходная сборка на Boosty')}
            </ExternalLink>
          )}
          {!original && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setSelection(preset.selection)}
            >
              {t('Вернуть исходную сборку')}
            </button>
          )}
        </div>
        {preset.video && (
          <ComboDisclosure name={accordion} title="Видеообзор сборки">
            <PresetVideo url={preset.video} title={preset.title} />
          </ComboDisclosure>
        )}
        <ComboDisclosure name={accordion} title="Перед запуском">
          <BeforeLaunchDetails game={catalog.game} dlcs={result.dlcs} />
        </ComboDisclosure>
        <ComboDisclosure name={accordion} title="DQ Лаунчер">
          <LauncherDetails />
        </ComboDisclosure>
        {!server && (
          <ComboDisclosure name={accordion} title="Список модов">
            <InactiveMods
              catalog={catalog}
              selection={selection}
              active={result.active}
              byId={byId}
              onChange={setSelection}
            />
          </ComboDisclosure>
        )}
      </aside>
      <section className={`${page.order} ${s.presetOrder}`} tabIndex={0} aria-labelledby={heading}>
        <span className="eyebrow">{t('Менеджер модификаций')}</span>
        <h2 id={heading}>{t('Порядок карт и модов')}</h2>
        <p role="status">
          {t(original ? 'Готовая сборка' : 'Своя сборка')} · {t('Файлов — ')}
          {result.files.length}
        </p>
        <ConflictList rules={result.conflicts} byId={byId} announce />
        {result.files.length ? (
          <OrderList
            result={result}
            byId={byId}
            showLinks={!server}
            compact
            removals={removals}
            onRemove={setSelection}
          />
        ) : (
          <p>{t('Выбери карты, чтобы увидеть порядок.')}</p>
        )}
        {!server && result.files.length > 0 && !result.conflicts.length && (
          <OrderDownloads
            catalog={catalog}
            files={result.files}
            title={original ? preset.title : 'Своя сборка'}
          />
        )}
      </section>
    </div>
  );
}

function PresetVideo({ url, title }) {
  const { t } = useTranslation();
  const youtube = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(
    new URL(url).hostname,
  );
  const videoId = youtube ? youtubeVideoId(url) : null;
  return /^[\w-]{11}$/.test(videoId || '') ? (
    <Video videoId={videoId} title={t(title)} platforms={{ youtube: url }} />
  ) : (
    <ExternalLink href={url}>{t('Смотреть видео')}</ExternalLink>
  );
}

function ConflictList({ rules, byId, announce }) {
  const { t } = useTranslation();
  return rules.map(({ entries, reason }) => (
    <p key={entries.join('/')} role={announce ? 'alert' : undefined} className={s.reason}>
      {t('Несовместимые позиции')} — {entries.map((id) => t(byId.get(id).title)).join(' + ')}
      {reason && ` · ${t(reason)}`}
    </p>
  ));
}

function InactiveMods({ catalog, selection, active, byId, onChange }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const inactive = catalog.entries.filter((entry) => isSelectable(entry) && !active.has(entry.id));
  const matches = inactive.filter((entry) =>
    `${entry.title} ${t(entry.title)} ${entry.family || ''} ${entry.variant || ''}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <label className={s.field}>
        {t('Поиск карт и модов')}
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {matches.length ? (
        <ul className={s.inactiveMods}>
          {matches.map((entry) => {
            const candidate = addToCombo(catalog, selection, entry.id);
            return (
              <li key={entry.id}>
                <div className={s.inactiveRow}>
                  {entry.image && (
                    <img className={s.thumb} src={entry.image} alt="" loading="lazy" />
                  )}
                  <strong>
                    {t(entry.title)}
                    <EntryBadge entry={entry} />
                  </strong>
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={candidate.conflicts.length > 0}
                    aria-label={`${t('Подключить')} — ${t(entry.title)}`}
                    onClick={() => onChange(candidate.selection)}
                  >
                    {t('Подключить')}
                  </button>
                </div>
                <ConflictList rules={candidate.conflicts} byId={byId} />
              </li>
            );
          })}
        </ul>
      ) : (
        <p>
          {t(
            inactive.length
              ? 'По этому запросу моды не найдены.'
              : 'Все доступные карты и моды уже подключены.',
          )}
        </p>
      )}
    </>
  );
}
