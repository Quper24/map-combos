import { useId, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/Language';
import ExternalLink from '../../components/ui/ExternalLink';
import AutoProfileInstall from '../../components/AutoProfileInstall/AutoProfileInstall';
import { builderCatalogs } from '../../data/builderCatalogs';
import {
  addToCombo,
  entryBadge,
  entryTypeLabels,
  isSelectable,
  removeFromCombo,
  resolveCombo,
  serializeModOrder,
} from '../../lib/comboBuilder';
import {
  comboBuilderPath,
  readSharedSelection,
  restoreSharedSelection,
} from '../../lib/comboShare';
import { catalogKey } from '../../lib/presetCombos';
import { download, fileImage, orderImage, previewSize } from './downloads';
import ShareCombo from './ShareCombo';
import s from './ComboBuilder.module.css';

export default function ComboBuilder() {
  const { t } = useTranslation();
  const { search, hash } = useLocation();
  const navigate = useNavigate();
  const releaseParam = new URLSearchParams(search).get('release');
  const requestedRelease = builderCatalogs.find((catalog) => catalogKey(catalog) === releaseParam);
  const release = requestedRelease || builderCatalogs[0];
  const shared = readSharedSelection(hash);
  const initial =
    shared && requestedRelease
      ? restoreSharedSelection(requestedRelease, shared)
      : { selection: [], missing: 0 };
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow">ETS2 / ATS · 1.62+</span>
        <h1>{t('Конструктор сборок')}</h1>
        <p>
          {t(
            'Выбери карты или возьми готовый пресет. Фиксы, коннекторы и порядок файлов подберутся автоматически.',
          )}
        </p>
        {import.meta.env.DEV && import.meta.env.MODE === 'editor' && (
          <Link className="text-link" to="/combos/builder/editor">
            {t('Редактор каталога')}
          </Link>
        )}
      </div>
      {shared && !requestedRelease && (
        <p role="alert" className={s.reason}>
          {t('Версия каталога из ссылки недоступна.')}
        </p>
      )}
      {initial.missing > 0 && (
        <p role="alert" className={s.reason}>
          {t('Позиций из ссылки больше нет в выборе — ')}
          {initial.missing}
        </p>
      )}
      {release ? (
        <>
          <label className={s.field}>
            {t('Версия игры')}
            <select
              value={catalogKey(release)}
              onChange={(event) =>
                navigate(
                  `${comboBuilderPath}?${new URLSearchParams({ release: event.target.value })}`,
                  { replace: true },
                )
              }
            >
              {builderCatalogs.map((item) => (
                <option key={catalogKey(item)} value={catalogKey(item)}>
                  {item.game.toUpperCase()} · {item.version}
                </option>
              ))}
            </select>
          </label>
          <Builder
            key={`${catalogKey(release)}:${hash}`}
            catalog={release}
            initialSelection={initial.selection}
            share
          />
        </>
      ) : (
        <div className="empty-state">
          <h2>{t('Каталог для конструктора готовится')}</h2>
          <Link className="button button-secondary" to="/combos">
            {t('Открыть готовые сборки')}
          </Link>
        </div>
      )}
    </div>
  );
}

export function Builder({ catalog, initialSelection = [], share = false }) {
  const { t } = useTranslation();
  const [presetId, setPresetId] = useState('');
  const preset = catalog.presets.find(({ id }) => id === presetId);
  const [selection, setSelection] = useState(initialSelection);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const descriptionGroup = useId();
  const result = useMemo(() => resolveCombo(catalog, selection), [catalog, selection]);
  const byId = new Map(catalog.entries.map((entry) => [entry.id, entry]));
  const groups = new Map();
  for (const entry of catalog.entries.filter(isSelectable)) {
    if (filter === 'enabled' && !result.active.has(entry.id)) continue;
    if ((filter === 'map' || filter === 'mod') && entry.type !== filter) continue;
    const name = `${entry.title} ${t(entry.title)} ${entry.family || ''} ${entry.variant || ''} ${entry.id}`;
    if (!name.toLowerCase().includes(query.trim().toLowerCase())) continue;
    const key = entry.family ? `family:${entry.family}` : entry.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  const conflictText = ({ entries, reason }) => {
    const names = entries.map((id) => t(byId.get(id).title)).join(' + ');
    return `${t('Несовместимые позиции')} — ${names}${reason ? ` · ${t(reason)}` : ''}`;
  };
  const isPreset =
    preset &&
    selection.length === preset.selection.length &&
    preset.selection.every((id) => selection.includes(id));
  const orderTitle = isPreset ? preset.title : 'Своя сборка';
  return (
    <>
      <div className={s.toolbar}>
        <label className={s.field}>
          {t('Готовая сборка')}
          <select
            value={presetId}
            onChange={(event) => {
              const id = event.target.value;
              setPresetId(id);
              setSelection(catalog.presets.find((item) => item.id === id)?.selection || []);
            }}
          >
            <option value="">{t('Своя сборка')}</option>
            {catalog.presets
              .filter((item) => !item.tags?.includes('server'))
              .map(({ id, title }) => (
                <option key={id} value={id}>
                  {t(title)}
                </option>
              ))}
          </select>
        </label>
        {preset?.boosty && (
          <ExternalLink className="button button-boosty" href={preset.boosty}>
            {t(isPreset ? 'Сборка на Boosty' : 'Исходная сборка на Boosty')}
          </ExternalLink>
        )}
        {isPreset && preset.profile && (
          <ExternalLink className="button button-secondary" href={preset.profile}>
            {t('Готовый профиль')}
          </ExternalLink>
        )}
        <label className={s.field}>
          {t('Поиск карт и модов')}
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className={s.field}>
          {t('Показать в списке')}
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">{t('Все карты и моды')}</option>
            <option value="map">{t('Только карты')}</option>
            <option value="mod">{t('Только моды')}</option>
            <option value="enabled">{t('Подключённые')}</option>
          </select>
        </label>
      </div>
      <div className={s.columns}>
        <section aria-label={t('Доступные карты и моды')}>
          <h2>{t('Доступные карты и моды')}</h2>
          <div
            className={s.cards}
            tabIndex={0}
            role="group"
            aria-label={t('Доступные карты и моды')}
          >
            {!groups.size && <p>{t('По этому запросу моды не найдены.')}</p>}
            {[...groups].map(([key, items]) => (
              <article className={s.card} key={key}>
                <h3>
                  {t(items[0].family || items[0].title)}
                  {!items[0].family && <EntryBadge entry={items[0]} />}
                </h3>
                {items.map((entry) => {
                  const enabled = result.active.has(entry.id);
                  const candidate = enabled ? null : addToCombo(catalog, selection, entry.id);
                  return (
                    <div key={entry.id} className={s.variant}>
                      {entry.image && (
                        <img className={s.thumb} src={entry.image} alt="" loading="lazy" />
                      )}
                      {entry.variant && <strong>{t(entry.variant)}</strong>}
                      {entry.variant && <EntryBadge entry={entry} />}
                      {entry.version && <small className={s.modVersion}>{entry.version}</small>}
                      {entry.paid && <span className={s.paid}>{t('Платная')}</span>}
                      {entry.link && (
                        <ExternalLink className="text-link" href={entry.link}>
                          {t('Скачать')}
                        </ExternalLink>
                      )}
                      {enabled ? (
                        <RemoveEntryButton
                          entry={entry}
                          removal={removeFromCombo(catalog, selection, entry.id, result.active)}
                          byId={byId}
                          onRemove={setSelection}
                          className="chip"
                        />
                      ) : (
                        <button
                          type="button"
                          className="chip"
                          disabled={candidate.conflicts.length > 0}
                          onClick={() => setSelection(candidate.selection)}
                        >
                          {t('Выбрать')}
                        </button>
                      )}
                      {candidate?.conflicts.map((rule) => (
                        <p className={s.reason} key={rule.entries.join('/')}>
                          {conflictText(rule)}
                        </p>
                      ))}
                      {entry.description && (
                        <details className={s.entryDescription} name={descriptionGroup}>
                          <summary>{t('Описание')}</summary>
                          <p className={s.description}>{t(entry.description)}</p>
                        </details>
                      )}
                    </div>
                  );
                })}
              </article>
            ))}
          </div>
        </section>
        <section aria-label={t('Порядок загрузки')}>
          <h2>{t('Порядок загрузки')}</h2>
          {result.conflicts.map((rule) => (
            <p className={s.reason} role="alert" key={rule.entries.join('/')}>
              {conflictText(rule)}
            </p>
          ))}
          {result.files.length ? (
            <>
              <p role="status">
                {t(isPreset ? 'Готовая сборка' : 'Своя сборка')} · {t('Файлов — ')}
                {result.files.length}
              </p>
              {share && selection.length > 0 && !result.conflicts.length && (
                <ShareCombo catalog={catalog} selection={selection} />
              )}
              {result.dlcs.length > 0 && (
                <p>
                  {t('Требуемые DLC')} · {result.dlcs.join(', ')}
                </p>
              )}
              <OrderList result={result} byId={byId} />
              {!result.conflicts.length && (
                <OrderDownloads catalog={catalog} files={result.files} title={orderTitle}>
                  <h3>{t('Автоматическая расстановка')}</h3>
                  <OrderProfileInstall catalog={catalog} files={result.files} title={orderTitle} />
                </OrderDownloads>
              )}
            </>
          ) : (
            <p>{t('Выбери карты, чтобы увидеть порядок.')}</p>
          )}
        </section>
      </div>
    </>
  );
}

export function EntryBadge({ entry }) {
  const badge = entryBadge(entry);
  return badge ? (
    <span className={badge === 'NEW' ? s.newBadge : s.updateBadge}>{badge}</span>
  ) : null;
}

function RemoveEntryButton({
  entry,
  removal,
  byId,
  onRemove,
  className = 'button button-secondary',
}) {
  const { t } = useTranslation();
  const hintId = useId();
  const label = t(entry.type === 'map' ? 'Отключить карту' : 'Отключить мод');
  const affected = removal.alsoDisabled.map((id) => t(byId.get(id).title)).join(', ');
  return (
    <span className={s.removeControl}>
      <button
        type="button"
        className={className}
        aria-label={`${label} — ${t(entry.title)}`}
        aria-describedby={affected ? hintId : undefined}
        onClick={() => onRemove(removal.selection)}
      >
        {label}
        {affected && (
          <span className={s.removeWarning} aria-hidden="true">
            !
          </span>
        )}
      </button>
      {affected && (
        <span id={hintId} className={s.removeHint}>
          {t(removal.alsoDisabled.length === 1 ? 'Также отключится' : 'Также отключатся')} ·{' '}
          {affected}
        </span>
      )}
    </span>
  );
}

export function OrderList({
  result: { files, manual, reasons },
  byId,
  showLinks = true,
  compact = false,
  removals,
  onRemove,
}) {
  const { t } = useTranslation();
  const topFile = new Map(files.map((file) => [file.entry.id, file.key]));
  return (
    <ol className={s.order}>
      {[...files].reverse().map((file) => {
        const because = !manual.has(file.entry.id) && reasons.get(file.entry.id);
        const image = fileImage(file);
        const link = file.link || file.entry.link;
        const removal =
          topFile.get(file.entry.id) === file.key ? removals?.get(file.entry.id) : undefined;
        return (
          <li key={file.key}>
            <div className={s.orderRow}>
              {image && <img className={s.thumb} src={image} alt="" loading="lazy" />}
              <div className={s.orderTitle}>
                <strong>{file.name}</strong>
                <EntryBadge entry={file.entry} />
                {!compact && (
                  <>
                    <code>{file.filename || file.key}</code>
                    <small>
                      {t(entryTypeLabels[file.entry.type])} · {t(file.entry.title)}
                    </small>
                    {because?.length > 0 && (
                      <small>
                        {t('Нужно для ')}
                        {because.map((id) => t(byId.get(id).title)).join(' + ')}
                      </small>
                    )}
                    {file.entry.autoWithMaps && !because?.length && (
                      <small>{t('Подключается при выборе любой карты')}</small>
                    )}
                  </>
                )}
              </div>
              {(removal || (showLinks && link)) && (
                <div className={s.orderActions}>
                  {showLinks && link && (
                    <ExternalLink className="button" href={link}>
                      {t('Скачать')}
                    </ExternalLink>
                  )}
                  {removal && (
                    <RemoveEntryButton
                      entry={file.entry}
                      removal={removal}
                      byId={byId}
                      onRemove={onRemove}
                    />
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDownloads({ catalog, files, title, children }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const modBlock = serializeModOrder(files);
  const prefix = catalogKey(catalog);
  const count = Math.ceil(files.length / previewSize);
  async function saveImage(part) {
    setBusy(true);
    setFailed(false);
    try {
      const offset = part * previewSize;
      const page = [...files].reverse().slice(offset, offset + previewSize);
      const blob = await orderImage(
        page,
        offset,
        `${t(title)} · ${catalog.game.toUpperCase()} ${catalog.version} · ${part + 1}/${count}`,
      );
      download(blob, `${prefix}-order-${part + 1}.png`);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={s.downloads}>
      <div className={s.actions}>
        <button
          className="button button-secondary"
          onClick={() =>
            download(
              new Blob([modBlock], { type: 'text/plain;charset=utf-8' }),
              `${prefix}-active-mods.txt`,
            )
          }
        >
          {t('Скачать список')}
        </button>
        {Array.from({ length: count }, (_, part) => (
          <button
            key={part}
            className="button button-secondary"
            disabled={busy}
            onClick={() => saveImage(part)}
          >
            {t('Скачать PNG')}
            {count > 1 && ` ${part + 1}/${count}`}
          </button>
        ))}
      </div>
      {failed && <p role="alert">{t('Не удалось создать картинку порядка.')}</p>}
      {children}
    </div>
  );
}

export function OrderProfileInstall({ catalog, files, title }) {
  const { t } = useTranslation();
  return (
    <>
      <p>{t('Авторасстановка полностью заменит список активных модов в скачанном профиле.')}</p>
      <AutoProfileInstall
        combo={{
          id: catalogKey(catalog),
          tags: [catalog.game],
          title,
          version_game: catalog.version,
        }}
        modBlock={serializeModOrder(files)}
      />
    </>
  );
}
