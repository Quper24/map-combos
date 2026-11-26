import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { builderCatalogs } from '../../data/builderCatalogs';
import site from '../../../content/site.json';
import { useTranslation } from '../../i18n/Language';
import {
  canAutoWithMaps,
  catalogDate,
  compareSharedOrder,
  entryTypeLabels,
  entriesByLoadOrder,
  ensureShareIndexes,
  isFixOrConnector,
  isSelectable,
  mergeModOrders,
  moveMod,
  readGameLogVersions,
  parseModOrder,
  reconcilePresetSelections,
  replaceEntryFiles,
  resolveCombo,
  suggestModVersion,
  validateCatalog,
} from '../../lib/comboBuilder';
import { processProfile } from '../../lib/processProfile';
import { MAX_PROFILE_SIZE } from '../../lib/profileMods';
import { Builder } from './ComboBuilder';
import PresetContent from './PresetContent';
import { builderDraftKey, readBuilderDrafts, restoreProjectPresets } from '../../lib/builderDraft';
import {
  attachPresetFiles,
  catalogKey,
  combinedPresetPairs,
  presetFileName,
  presetTags,
} from '../../lib/presetCombos';
import { preparePresetRelease } from '../../lib/presetReleases';
import { tagUtils } from '../../utils/tags';
import EditorImageField from './EditorImageField';
import { download, fileImage } from './downloads';
import s from './ComboBuilder.module.css';

const blank = { game: 'ats', version: '1.62', entries: [], order: [], conflicts: [], presets: [] };

function getForm(event) {
  event.preventDefault();
  return new FormData(event.currentTarget);
}

const valueOf = (form, key) => form.get(key)?.trim() || undefined;
const replace = (list, key, item) =>
  list.some((existing) => existing[key] === item[key])
    ? list.map((existing) => (existing[key] === item[key] ? item : existing))
    : [...list, item];

function downloadJson(data, name) {
  download(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' }), name);
}

function Field({ label, ...props }) {
  const { t } = useTranslation();
  return (
    <label className={s.field}>
      {t(label)}
      <input {...props} />
    </label>
  );
}

function Choices({
  label,
  name,
  items,
  selected = [],
  onChecked,
  disabled = false,
  showSelectedFilter = false,
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [onlySelected, setOnlySelected] = useState(false);
  const [changes, setChanges] = useState({});
  const isSelected = (id) => changes[id] ?? selected.includes(id);
  const selectedCount = showSelectedFilter ? items.filter(({ id }) => isSelected(id)).length : 0;
  return (
    <fieldset className={s.choices} disabled={disabled}>
      <legend>{t(label)}</legend>
      <div className={s.choiceFilters}>
        <Field
          label="Фильтр списка"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {showSelectedFilter && (
          <label className={s.choiceFilterToggle}>
            <input
              type="checkbox"
              checked={onlySelected}
              onChange={(event) => {
                setOnlySelected(event.target.checked);
                if (event.target.checked) setQuery('');
              }}
            />
            <span>{t('Только отмеченные')} · {selectedCount}</span>
          </label>
        )}
      </div>
      {onlySelected && !selectedCount && <p>{t('Нет отмеченных зависимостей.')}</p>}
      <div className={s.choiceList}>
        {items.map(({ id, title }) => (
          <label
            key={id}
            hidden={
              (onlySelected && !isSelected(id)) ||
              !`${title} ${id}`.toLowerCase().includes(query.trim().toLowerCase())
            }
          >
            <input
              type="checkbox"
              name={name}
              value={id}
              defaultChecked={selected.includes(id)}
              onChange={(event) => {
                const { checked } = event.target;
                if (showSelectedFilter) setChanges((current) => ({ ...current, [id]: checked }));
                onChecked?.(id, checked);
              }}
            />{' '}
            {t(title)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function ComboEditor() {
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState(() => {
    const saved = readBuilderDrafts();
    return {
      ...saved,
      catalogs: saved.catalogs.map((item) => restoreProjectPresets(item, builderCatalogs)),
    };
  });
  const catalog =
    drafts.catalogs.find((item) => catalogKey(item) === drafts.active) ||
    builderCatalogs.find((item) => catalogKey(item) === catalogKey(blank)) ||
    blank;
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(null);
  const [logVersions, setLogVersions] = useState(null);
  const [updateVersions, setUpdateVersions] = useState(false);
  const [revision, setRevision] = useState(0);
  const [openedPresetId, setOpenedPresetId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [entryRequest, setEntryRequest] = useState({ id: '', files: [], key: 0 });
  const unassigned = unassignedFiles(catalog);
  const pendingReviews = catalog.entries.filter((entry) => entry.versionReview);
  function editImportedFiles(id, files) {
    setEntryRequest(({ key }) => ({ id, files, key: key + 1 }));
    requestAnimationFrame(() => document.getElementById('combo-entry-editor')?.focus());
  }
  function commit(next, successNotice = 'Черновик сохранён в этом браузере.') {
    next = ensureShareIndexes(next);
    try {
      validateCatalog(next, true);
    } catch (error) {
      setNotice(error.message);
      return false;
    }
    const active = catalogKey(next);
    const updated = {
      active,
      catalogs: [...drafts.catalogs.filter((item) => catalogKey(item) !== active), next],
    };
    setDrafts(updated);
    try {
      localStorage.setItem(builderDraftKey, JSON.stringify(updated));
      setNotice(successNotice);
    } catch {
      setNotice('Хранилище браузера недоступно. Скачай черновик JSON.');
    }
    return true;
  }
  function openRelease(next, presetId = '') {
    if (!commit(restoreProjectPresets(next, builderCatalogs))) return;
    setPending(null);
    setLogVersions(null);
    setUpdateVersions(false);
    setEntryRequest({ id: '', files: [], key: 0 });
    setShowPreview(false);
    setOpenedPresetId(presetId);
    setRevision((number) => number + 1);
  }
  async function loadOrder(file) {
    setPending(null);
    setUpdateVersions(false);
    const isProfile = file.name.toLowerCase().endsWith('.sii');
    if (isProfile && (!file.size || file.size > MAX_PROFILE_SIZE))
      throw new Error('Выбери непустой profile.sii размером до 300 КБ.');
    const source = isProfile ? await processProfile(await file.arrayBuffer()) : await file.text();
    const files = parseModOrder(source);
    if (!files.length) throw new Error('The template contains no files');
    setPending(files);
  }
  async function loadGameLog(file) {
    setLogVersions(null);
    setUpdateVersions(false);
    const versions = await readGameLogVersions(file);
    if (![...versions.values()].some(Boolean))
      throw new Error('В журнале не найдены версии загруженных модов.');
    setLogVersions(versions);
    setNotice('');
  }
  async function readInput(event, handler, maxSize = 5 * 1024 * 1024) {
    const files = Array.from(event.currentTarget.files);
    event.currentTarget.value = '';
    if (!files.length) return;
    setBusy(true);
    try {
      if (files.some((file) => file.size > maxSize)) throw new Error('File exceeds 5 MB');
      await handler(files);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function openCatalog(files) {
    const records = await Promise.all(files.map(async (file) => JSON.parse(await file.text())));
    const shared = records.filter((record) => !Object.hasOwn(record ?? {}, 'preset'));
    if (shared.length > 1) throw new Error('Выбери один общий каталог и файлы его сборок.');
    const base = validateCatalog(ensureShareIndexes(shared.length ? shared[0] : catalog), true);
    const presetFiles = records.filter((record) => Object.hasOwn(record ?? {}, 'preset'));
    const importedIds = new Set(presetFiles.map((file) => file.preset?.id));
    const [next] = attachPresetFiles(
      [{ ...base, presets: base.presets.filter(({ id }) => !importedIds.has(id)) }],
      presetFiles,
    );
    openRelease(next);
  }
  function applyImport(preferImported) {
    const { order } = mergeModOrders(catalog.order, pending || [], preferImported);
    const nextOrder = order.map((file) => {
      const logVersion = logVersions?.get(file.key);
      return logVersion ? { ...file, logVersion } : file;
    });
    const entries = updateVersions
      ? catalog.entries.map((entry) => {
          const version = versionUpdates.get(entry.id);
          return version
            ? {
                ...entry,
                version,
                updatedAt: entry.version ? catalogDate() : entry.updatedAt,
                versionReview: { from: entry.version },
              }
            : entry;
        })
      : catalog.entries;
    if (commit({ ...catalog, order: nextOrder, entries })) {
      setPending(null);
      setLogVersions(null);
      setUpdateVersions(false);
    }
  }
  function exportCatalog(publish) {
    try {
      const data = publish
        ? {
            ...catalog,
            entries: catalog.entries.map((entry) => ({ ...entry, versionReview: undefined })),
            presets: [],
          }
        : catalog;
      validateCatalog(data, !publish, { linkPresets: publish ? catalog.presets : data.presets });
      downloadJson(data, `${catalogKey(catalog)}${publish ? '' : '-draft'}.json`);
    } catch (error) {
      setNotice(error.message);
    }
  }
  function exportPreset(draft) {
    try {
      const { preset, needsVersion } = preparePresetRelease(catalog, draft, draft.updatedAt);
      const presets = replace(catalog.presets, 'id', preset);
      validateCatalog({ ...catalog, presets: [preset] }, false, { linkPresets: presets });
      const next = { ...catalog, presets };
      if (
        !commit(
          next,
          needsVersion
            ? 'Состав или версии модов изменились. Укажи новый номер версии сборки, чтобы добавить выпуск.'
            : 'JSON сборки выгружен.',
        )
      )
        return;
      downloadJson(
        { game: catalog.game, version: catalog.version, preset },
        presetFileName(catalog, preset),
      );
    } catch (error) {
      setNotice(error.message);
    }
  }
  const imported = pending && mergeModOrders(catalog.order, pending);
  const logMatches = (imported?.order || catalog.order).filter(({ key }) => logVersions?.get(key));
  const versionUpdates = new Map();
  if (pending || logVersions) {
    const importedByKey = new Map((pending || []).map((file) => [file.key, file]));
    for (const file of logMatches) {
      importedByKey.set(file.key, { ...file, logVersion: logVersions.get(file.key) });
    }
    for (const entry of catalog.entries) {
      const files = entry.files.map((key) => importedByKey.get(key)).filter(Boolean);
      const version = suggestModVersion(files);
      if (version && version !== entry.version) versionUpdates.set(entry.id, version);
    }
  }
  const displayOrder = imported ? [...imported.order].reverse() : [];
  const incomingOrder = imported?.orderConflict
    ? mergeModOrders(catalog.order, pending, true).order.slice().reverse()
    : [];
  const orderChanges = imported?.orderConflict ? compareSharedOrder(catalog.order, pending) : [];
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow">ETS2 / ATS</span>
        <h1>{t('Редактор каталога')}</h1>
        <p>
          {t(
            'Сначала выбери игру и версию, затем импортируй профиль. Черновики каталогов сохраняются отдельно.',
          )}
        </p>
        <Link className="text-link" to="/combos/builder">
          {t('Конструктор сборок')}
        </Link>
      </div>
      <div className={s.editorGrid} key={revision}>
        <section className={s.panel}>
          <h2>{t('Каталог')}</h2>
          <form
            className={s.toolbar}
            key={`${catalog.game}-${catalog.version}`}
            onSubmit={(event) => {
              const form = getForm(event);
              if (busy) return;
              const release = {
                ...blank,
                game: form.get('game'),
                version: valueOf(form, 'version'),
              };
              const key = catalogKey(release);
              if (key === catalogKey(catalog) && drafts.active) return;
              const existing = [...drafts.catalogs, ...builderCatalogs].find(
                (item) => catalogKey(item) === key,
              );
              openRelease(existing || release);
            }}
          >
            <label className={s.field}>
              {t('Игра')}
              <select name="game" defaultValue={catalog.game}>
                <option value="ets2">ETS2</option>
                <option value="ats">ATS</option>
              </select>
            </label>
            <Field
              label="Версия игры"
              name="version"
              defaultValue={catalog.version}
              required
              pattern={String.raw`1\.\d+`}
            />
            <button className="button button-secondary" disabled={busy}>
              {t('Открыть каталог')}
            </button>
          </form>
          <div className={s.toolbar}>
            <Field
              label="Открыть сохранённый JSON"
              type="file"
              accept=".json"
              multiple
              disabled={busy}
              onChange={(event) => readInput(event, openCatalog)}
            />
            <button className="button button-secondary" onClick={() => exportCatalog(false)}>
              {t('Скачать черновик JSON')}
            </button>
            <button className="button" onClick={() => exportCatalog(true)}>
              {t('Выгрузить общий каталог')}
            </button>
          </div>
          <p>
            {t(
              'Для публикации выгрузи общий каталог и JSON каждой готовой сборки. Их можно открыть вместе.',
            )}
          </p>
        </section>
        <section className={s.panel}>
          <h2>{t('Импорт порядка')}</h2>
          <p>
            <strong>
              {t('Импорт в каталог')} · {catalog.game.toUpperCase()} {catalog.version}
            </strong>
          </p>
          <p>
            {t(
              'Выбери profile.sii или TXT с active_mods. Игра берётся из открытого каталога. Редактор покажет порядок перед импортом.',
            )}
          </p>
          <div className={s.toolbar}>
            <Field
              label="Загрузить шаблон"
              type="file"
              accept=".txt,.sii"
              disabled={busy}
              onChange={(event) => readInput(event, ([file]) => loadOrder(file))}
            />
            <Field
              label="Загрузить game.log.txt"
              type="file"
              accept=".txt,.log"
              disabled={busy}
              onChange={(event) => readInput(event, ([file]) => loadGameLog(file), Infinity)}
            />
          </div>
          {(pending || logVersions) && (
            <div className={s.importPreview}>
              {logVersions && (
                <p role="status">
                  {t('Файлов с версией из журнала — ')}
                  {logMatches.length}
                  {!logMatches.length && (
                    <> · {t('Загрузи профиль из той же игры и с теми же модами.')}</>
                  )}
                </p>
              )}
              {versionUpdates.size > 0 && (
                <>
                  <label>
                    <input
                      type="checkbox"
                      checked={updateVersions}
                      onChange={(event) => setUpdateVersions(event.target.checked)}
                    />{' '}
                    {t('Обновить версии существующих записей')}
                  </label>
                  <ul>
                    {catalog.entries
                      .filter(({ id }) => versionUpdates.has(id))
                      .map((entry) => (
                        <li key={entry.id}>
                          {t(entry.title)} · {entry.version || t('Версия неизвестна')} →{' '}
                          {versionUpdates.get(entry.id)}
                        </li>
                      ))}
                  </ul>
                </>
              )}
              {pending && (
                <p>
                  {t(
                    catalog.order.length
                      ? 'Всего файлов после объединения — '
                      : 'Файлов в загруженном профиле — ',
                  )}
                  {displayOrder.length}
                </p>
              )}
              {imported?.orderConflict && (
                <>
                  <p className={s.reason}>
                    {t('Общие файлы идут в разном порядке. Выбери, какой порядок сохранить.')}
                  </p>
                  <details>
                    <summary>
                      {t('Файлы с изменившимся порядком')} · {orderChanges.length}
                    </summary>
                    <p>{t('Позиции считаются сверху вниз только среди общих файлов.')}</p>
                    <ul className={s.importList}>
                      {orderChanges.map(({ key, name, catalogPosition, profilePosition }) => (
                        <li key={key}>
                          {name} · <code>{key}</code> · {t('В каталоге')} {catalogPosition} →{' '}
                          {t('В профиле')} {profilePosition}
                        </li>
                      ))}
                    </ul>
                  </details>
                </>
              )}
              {pending && (
                <ol className={s.importList}>
                  {displayOrder.map((file) => (
                    <li key={file.key}>{file.name}</li>
                  ))}
                </ol>
              )}
              {incomingOrder.length > 0 && (
                <details>
                  <summary>{t('Предпросмотр порядка из файла')}</summary>
                  <ol className={s.importList}>
                    {incomingOrder.map((file) => (
                      <li key={file.key}>{file.name}</li>
                    ))}
                  </ol>
                </details>
              )}
              <div className={s.actions}>
                <button
                  className="button"
                  disabled={busy || (!pending && !logMatches.length)}
                  onClick={() => applyImport(false)}
                >
                  {t(
                    !pending
                      ? 'Импортировать версии из журнала'
                      : !catalog.order.length
                        ? 'Импортировать порядок'
                        : imported.orderConflict
                          ? 'Сохранить текущий порядок'
                          : 'Объединить списки',
                  )}
                </button>
                {imported?.orderConflict && (
                  <button className="button" disabled={busy} onClick={() => applyImport(true)}>
                    {t('Применить порядок из файла')}
                  </button>
                )}
                <button
                  className="button button-secondary"
                  disabled={busy}
                  onClick={() => {
                    setPending(null);
                    setLogVersions(null);
                    setUpdateVersions(false);
                  }}
                >
                  {t('Отмена')}
                </button>
              </div>
            </div>
          )}
        </section>
        {unassigned.length > 0 && (
          <ImportedFiles
            files={unassigned}
            entries={catalog.entries}
            onEdit={editImportedFiles}
            busy={busy}
            onRemoveAll={() => {
              const keys = new Set(unassigned.map(({ key }) => key));
              const order = catalog.order.filter(({ key }) => !keys.has(key));
              if (
                commit({ ...catalog, order }) &&
                entryRequest.files.some((key) => keys.has(key))
              ) {
                setEntryRequest(({ id, key }) => ({ id, files: [], key: key + 1 }));
              }
            }}
          />
        )}
        {pendingReviews.length > 0 && (
          <section className={s.panel}>
            <h2>
              {t('Проверить после обновления')} · {pendingReviews.length}
            </h2>
            <ul className={s.importList}>
              {pendingReviews.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => editImportedFiles(entry.id, [])}
                  >
                    {t(entry.title)} · {entry.versionReview.from || t('Версия неизвестна')} →{' '}
                    {entry.version || t('Версия неизвестна')}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <EntryEditor
          key={entryRequest.key}
          catalog={catalog}
          commit={commit}
          request={entryRequest}
          unassigned={unassigned}
          onError={setNotice}
        />
        <OrderEditor catalog={catalog} commit={commit} />
        <RulesEditor catalog={catalog} commit={commit} />
        <PresetEditor
          catalog={catalog}
          commit={commit}
          onExport={exportPreset}
          initialId={openedPresetId}
          busy={busy}
          drafts={drafts.catalogs}
          onOpenProject={(project) => {
            const backup = drafts.catalogs.find(
              (item) => catalogKey(item) === catalogKey(project.catalog),
            );
            if (backup) downloadJson(backup, `${catalogKey(backup)}-draft.json`);
            openRelease(project.catalog, project.preset.id);
          }}
        />
        <section className={s.panel}>
          <h2>{t('Предпросмотр конструктора')}</h2>
          <button className="button button-secondary" onClick={() => setShowPreview(!showPreview)}>
            {t(showPreview ? 'Скрыть предпросмотр' : 'Открыть предпросмотр')}
          </button>
          {showPreview && <Builder key={JSON.stringify(catalog)} catalog={catalog} />}
        </section>
        {notice && (
          <p className={s.notice} role="status">
            {t(notice)}
          </p>
        )}
      </div>
    </div>
  );
}

function unassignedFiles(catalog) {
  const assigned = new Set(catalog.entries.flatMap((entry) => entry.files));
  return catalog.order.filter(({ key }) => !assigned.has(key)).reverse();
}

function ImportedFiles({ files, entries, onEdit, busy, onRemoveAll }) {
  const { t } = useTranslation();
  const [id, setId] = useState('');
  const [missing, setMissing] = useState(false);
  return (
    <section className={s.panel}>
      <h2>
        {t('Файлы без привязки')} · {files.length}
      </h2>
      <p>{t('Отметь все части одной карты или мода, затем открой их как одну запись.')}</p>
      <form
        onSubmit={(event) => {
          const keys = getForm(event).getAll('imported');
          setMissing(!keys.length);
          if (keys.length) onEdit(id, keys);
        }}
      >
        <Choices
          label="Файлы из общего порядка"
          name="imported"
          items={files.map(({ key, name }) => ({ id: key, title: name }))}
        />
        <div className={s.toolbar}>
          <EntityPicker items={entries} id={id} setId={setId} />
          <button className="button">
            {t(id ? 'Привязать к записи' : 'Заполнить новую запись')}
          </button>
          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={() => {
              if (window.confirm(t('Удалить все файлы без привязки из черновика?'))) onRemoveAll();
            }}
          >
            {t('Удалить все файлы без привязки')}
          </button>
        </div>
        {missing && (
          <p className={s.reason} role="alert">
            {t('Отметь хотя бы один файл.')}
          </p>
        )}
      </form>
    </section>
  );
}

function readFileFields(form, key, prefix = '') {
  return {
    key,
    name: form.get(`${prefix}name`),
    filename: valueOf(form, `${prefix}filename`),
    link: valueOf(form, `${prefix}link`),
    image: valueOf(form, `${prefix}image`),
  };
}

function FileFields({ file, prefix = '' }) {
  return (
    <>
      <Field
        label="Имя в менеджере модов"
        name={`${prefix}name`}
        defaultValue={file?.name}
        required
      />
      <Field
        label="Имя файла с расширением"
        name={`${prefix}filename`}
        defaultValue={file?.filename}
      />
      <Field label="Ссылка на файл" type="url" name={`${prefix}link`} defaultValue={file?.link} />
      <EditorImageField
        name={`${prefix}image`}
        initialPath={file?.image}
        label="Загрузить картинку файла"
      />
    </>
  );
}

function OrderEditor({ catalog, commit }) {
  const { t } = useTranslation();
  const [fileKey, setFileKey] = useState(null);
  const [anchor, setAnchor] = useState('');
  const [query, setQuery] = useState('');
  const dragging = useRef(null);
  const { order } = catalog;
  const owners = new Map(
    catalog.entries.flatMap((entry) => entry.files.map((key) => [key, entry.title])),
  );
  const rows = [...order].reverse();
  const file = order.find(({ key }) => key === fileKey);
  const move = (key, target, above) =>
    commit({ ...catalog, order: moveMod(order, key, target, above) });
  return (
    <section className={s.panel}>
      <h2>{t('Общий порядок файлов')}</h2>
      <p>
        {t(
          'Это шаблон расположения всех файлов. Сборка берёт из него нужные строки в том же порядке. Верх списка соответствует наивысшему приоритету.',
        )}
      </p>
      <details>
        <summary>{t('Что означают поля файла')}</summary>
        <dl>
          <dt>{t('Ключ файла в профиле')}</dt>
          <dd>
            {t(
              'Идентификатор перед знаком | в profile.sii. При импорте заполняется автоматически.',
            )}
          </dd>
          <dt>{t('Имя в менеджере модов')}</dt>
          <dd>{t('Название после знака | в profile.sii. Оно видно в списке и на PNG.')}</dd>
          <dt>{t('Имя файла с расширением')}</dt>
          <dd>{t('Необязательное имя для подсказки игроку, например map.scs.')}</dd>
          <dt>{t('Ссылка на файл')}</dt>
          <dd>
            {t(
              'Необязательная отдельная ссылка. По умолчанию файл использует общую ссылку карты или мода.',
            )}
          </dd>
          <dt>{t('Загрузить картинку файла')}</dt>
          <dd>
            {t(
              'Выбери картинку для этой строки порядка. Редактор сохранит её и заполнит путь сам.',
            )}
          </dd>
          <dt>{t('Путь к картинке (/img/…)')}</dt>
          <dd>
            {t(
              'Внутренний адрес картинки на сайте. Его можно указать вручную для уже добавленного изображения.',
            )}
          </dd>
        </dl>
      </details>
      <div className={s.toolbar}>
        <Field
          label="Поиск файлов"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="button button-secondary" onClick={() => setFileKey('')}>
          {t('Добавить файл вручную')}
        </button>
      </div>
      {rows.length > 0 && (
        <ol className={s.editOrder}>
          {rows.map((item, index) => (
            <li
              key={item.key}
              hidden={
                !`${item.name} ${item.key} ${item.filename || ''}`
                  .toLowerCase()
                  .includes(query.trim().toLowerCase())
              }
              draggable
              onDragStart={(event) => {
                dragging.current = item.key;
                event.dataTransfer.setData('text/plain', item.key);
                event.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => {
                dragging.current = null;
              }}
              onDragOver={(event) => {
                if (dragging.current) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const bounds = event.currentTarget.getBoundingClientRect();
                if (dragging.current)
                  move(dragging.current, item.key, event.clientY < bounds.top + bounds.height / 2);
              }}
            >
              <button
                type="button"
                className="chip"
                onClick={() => {
                  setFileKey(item.key);
                  setAnchor('');
                }}
                aria-pressed={fileKey === item.key}
              >
                {index + 1}. {item.name}
              </button>
              <small>{owners.get(item.key) || t('Без привязки')}</small>
            </li>
          ))}
        </ol>
      )}
      {file && order.length > 1 && (
        <div className={s.toolbar}>
          <label className={s.field}>
            {t('Соседний файл')}
            <select value={anchor} onChange={(event) => setAnchor(event.target.value)}>
              <option value="">{t('Выбрать файл')}</option>
              {rows
                .filter((item) => item.key !== fileKey)
                .map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name} · {item.key}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="button button-secondary"
            disabled={!anchor}
            onClick={() => move(fileKey, anchor, true)}
          >
            {t('Поставить выше')}
          </button>
          <button
            className="button button-secondary"
            disabled={!anchor}
            onClick={() => move(fileKey, anchor, false)}
          >
            {t('Поставить ниже')}
          </button>
        </div>
      )}
      {fileKey !== null && (
        <form
          className={s.form}
          key={file?.key || 'new'}
          onSubmit={(event) => {
            const form = getForm(event);
            const key = file?.key || valueOf(form, 'key');
            const next = { ...file, ...readFileFields(form, key) };
            if (
              commit({
                ...catalog,
                order: file ? replace(order, 'key', next) : [...order, next],
              })
            )
              setFileKey(key);
          }}
        >
          <Field
            label="Ключ файла в профиле"
            name="key"
            defaultValue={file?.key}
            readOnly={Boolean(file)}
            required
          />
          <FileFields file={file} />
          <div className={s.actions}>
            <button className="button">{t('Сохранить файл')}</button>
            {file && !owners.has(file.key) && (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  if (commit({ ...catalog, order: order.filter(({ key }) => key !== fileKey) })) {
                    setFileKey(null);
                    setAnchor('');
                  }
                }}
              >
                {t('Удалить файл')}
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

const filePrefix = (key) => `part:${key}:`;

function EntryFiles({ order, selected }) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(() => new Set(selected));
  const [visited, setVisited] = useState(() => new Set(selected));

  function toggle(key, included) {
    setChecked((current) => {
      const next = new Set(current);
      if (included) next.add(key);
      else next.delete(key);
      return next;
    });
    if (included) setVisited((current) => new Set([...current, key]));
  }

  return (
    <>
      <Choices
        label="Файлы позиции"
        name="files"
        selected={selected}
        items={order.map(({ key, name }) => ({ id: key, title: name }))}
        onChecked={toggle}
      />
      {visited.size > 0 && (
        <div className={s.entryFiles}>
          {checked.size > 0 && (
            <>
              <h3>{t('Картинки и настройки отдельных файлов')}</h3>
              <p>
                {t(
                  'Картинка каждого файла попадёт в свою строку PNG. Чтобы использовать одну общую ссылку, оставь ссылки на файлы пустыми.',
                )}
              </p>
            </>
          )}
          <div className={s.fileParts}>
            {order
              .filter(({ key }) => visited.has(key))
              .map((file) => (
                <fieldset
                  className={s.filePart}
                  key={file.key}
                  hidden={!checked.has(file.key)}
                  disabled={!checked.has(file.key)}
                >
                  <legend>{file.name}</legend>
                  <FileFields file={file} prefix={filePrefix(file.key)} />
                </fieldset>
              ))}
          </div>
        </div>
      )}
    </>
  );
}

function EntryActivationFields({ entry, dependencies }) {
  const { t } = useTranslation();
  const [type, setType] = useState(entry?.type || 'map');
  const [auto, setAuto] = useState(Boolean(entry?.autoWithMaps));
  const autoAvailable = canAutoWithMaps(type);
  const autoEnabled = autoAvailable && auto;
  return (
    <>
      <label className={s.field}>
        {t('Тип')}
        <select name="type" value={type} onChange={(event) => setType(event.target.value)}>
          {Object.entries(entryTypeLabels).map(([id, label]) => (
            <option key={id} value={id}>
              {t(label)}
            </option>
          ))}
        </select>
      </label>
      {autoAvailable && (
        <label>
          <input
            type="checkbox"
            name="autoWithMaps"
            checked={auto}
            onChange={(event) => setAuto(event.target.checked)}
          />{' '}
          {t('Подключать при выборе любой карты')}
        </label>
      )}
      {autoEnabled && (
        <p className={s.entryFiles}>{t('Этот режим заменяет список обязательных зависимостей.')}</p>
      )}
      {type === 'resource' && (
        <p className={s.entryFiles}>
          {t('Добавь этот пакет в зависимости каждой карты, которой он нужен.')}
        </p>
      )}
      <Choices
        label={
          type === 'resource'
            ? 'Что требуется самому пакету'
            : 'Обязательные зависимости (все перечисленные)'
        }
        name="requires"
        showSelectedFilter
        selected={entry?.requires}
        items={dependencies}
        disabled={autoEnabled}
      />
      {isFixOrConnector(type) && (
        <Choices
          label="Альтернативные зависимости (достаточно одной)"
          name="requiresAny"
          showSelectedFilter
          selected={entry?.requiresAny}
          items={dependencies}
          disabled={autoEnabled}
        />
      )}
      {isFixOrConnector(type) && (
        <Choices
          label="Заменяет фиксы"
          name="replaces"
          selected={entry?.replaces}
          items={dependencies.filter((item) => isFixOrConnector(item.type))}
        />
      )}
      <Choices
        label="Отключать при подключении любой из этих карт"
        name="disabledByMaps"
        selected={entry?.disabledByMaps}
        items={dependencies.filter((item) => item.type === 'map')}
      />
    </>
  );
}

function EntryEditor({ catalog, commit, request, unassigned, onError }) {
  const { t } = useTranslation();
  const [id, setId] = useState(request.id);
  const [seedFiles, setSeedFiles] = useState(request.files);
  const [formRevision, setFormRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const entry = catalog.entries.find((item) => item.id === id);
  const byKey = new Map(catalog.order.map((file) => [file.key, file]));
  const search = query.trim().toLowerCase();
  const orderedEntries = entriesByLoadOrder(catalog);
  const editorEntries = orderedEntries
    .map((item) => {
      const missingImage = item.files.length
        ? item.files.some((key) => !fileImage({ ...byKey.get(key), entry: item }))
        : !item.image;
      const notes = [];
      if (missingImage) notes.push(t('Нет картинки'));
      if (!item.link) notes.push(t('Нет общей ссылки на скачивание'));
      return { ...item, notes };
    })
    .filter(
      (item) =>
        item.id === id ||
        ((!typeFilter || item.type === typeFilter) &&
          (!incompleteOnly || item.notes.length > 0) &&
          [item.title, t(item.title), item.id, ...item.files].some((value) =>
            value.toLowerCase().includes(search),
          )),
    );
  const suggested = catalog.order.find(({ key }) => key === seedFiles[0]);
  const suggestedId = suggested?.key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suggestedVersion = suggestModVersion(
    [...(entry?.files || []), ...seedFiles].map((key) => byKey.get(key)).filter(Boolean),
  );
  const owned = new Set(
    catalog.entries.filter((item) => item.id !== id).flatMap((item) => item.files),
  );
  return (
    <section className={s.panel}>
      <h2 id="combo-entry-editor" tabIndex={-1}>
        {t('Карты, моды, фиксы и коннекторы')}
      </h2>
      <div className={s.entryFilters}>
        <Field
          label="Фильтр списка"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className={s.field}>
          {t('Фильтр по типу')}
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="">{t('Все типы')}</option>
            {Object.entries(entryTypeLabels).map(([type, label]) => (
              <option key={type} value={type}>
                {t(label)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <input
          type="checkbox"
          checked={incompleteOnly}
          onChange={(event) => setIncompleteOnly(event.target.checked)}
        />{' '}
        {t('Только записи без картинки или ссылки')}
      </label>
      <EntityPicker
        items={editorEntries}
        id={id}
        setId={(next) => {
          setId(next);
          setSeedFiles([]);
        }}
      />
      <form
        className={s.form}
        key={`${id}:${entry?.version ?? ''}:${formRevision}`}
        onSubmit={(event) => {
          const form = getForm(event);
          const replacements = new Map();
          for (const key of entry?.files || []) {
            const newKey = valueOf(form, `replace:${key}`);
            if (newKey) replacements.set(key, newKey);
          }
          const files = form.getAll('files');
          const fileKeys = new Set(files);
          const order = catalog.order.map((file) =>
            fileKeys.has(file.key)
              ? { ...file, ...readFileFields(form, file.key, filePrefix(file.key)) }
              : file,
          );
          let fileChanges;
          try {
            fileChanges = replaceEntryFiles(order, files, replacements);
          } catch (error) {
            onError(error.message);
            return;
          }
          const addedAt = valueOf(form, 'addedAt') || (!entry ? catalogDate() : undefined);
          const modVersion = valueOf(form, 'modVersion');
          const reviewed = event.nativeEvent.submitter?.value === 'reviewed';
          const type = form.get('type');
          const alternatives = form.getAll('requiresAny');
          const replacementsForFix = form.getAll('replaces');
          const disabledByMaps = form.getAll('disabledByMaps');
          const markUpdate =
            entry &&
            (replacements.size ||
              event.nativeEvent.submitter?.value === 'update' ||
              (entry.version && modVersion && entry.version !== modVersion));
          const next = {
            id: entry?.id || valueOf(form, 'id'),
            title: valueOf(form, 'title'),
            type,
            autoWithMaps: form.has('autoWithMaps') || undefined,
            link: valueOf(form, 'link'),
            image: valueOf(form, 'image'),
            description: valueOf(form, 'description'),
            version: modVersion,
            versionReview: reviewed ? undefined : entry?.versionReview,
            addedAt,
            updatedAt: markUpdate ? catalogDate() : valueOf(form, 'updatedAt'),
            paid: form.has('paid'),
            family: type === 'map' ? valueOf(form, 'family') : undefined,
            variant: type === 'map' ? valueOf(form, 'variant') : undefined,
            freeReplacement: type === 'map' && form.has('paid')
              ? valueOf(form, 'freeReplacement')
              : undefined,
            files: fileChanges.files,
            requires: form.getAll('requires'),
            requiresAny: alternatives.length ? alternatives : undefined,
            replaces: replacementsForFix.length ? replacementsForFix : undefined,
            disabledByMaps: disabledByMaps.length ? disabledByMaps : undefined,
            dlcs: (valueOf(form, 'dlcs') || '')
              .split(',')
              .map((dlc) => dlc.trim())
              .filter(Boolean),
          };
          const entries = entry ? replace(catalog.entries, 'id', next) : [...catalog.entries, next];
          const presets = reconcilePresetSelections(catalog.presets, next);
          if (commit({ ...catalog, entries, presets, order: fileChanges.order })) {
            setId(next.id);
            setSeedFiles([]);
            setFormRevision((number) => number + 1);
          }
        }}
      >
        <Field
          label="Идентификатор (a-z, 0-9, дефис)"
          name="id"
          defaultValue={entry?.id || suggestedId}
          readOnly={Boolean(entry)}
          required
        />
        <Field
          label="Название"
          name="title"
          defaultValue={entry?.title || suggested?.name}
          required
        />
        <EntryActivationFields
          entry={entry}
          dependencies={orderedEntries.filter((item) => item.id !== id && item.type !== 'server')}
        />
        <Field
          label="Общая ссылка на скачивание"
          name="link"
          type="url"
          defaultValue={entry?.link}
        />
        <Field
          label="Версия мода"
          name="modVersion"
          defaultValue={entry?.version ?? suggestedVersion}
          placeholder={
            seedFiles.length && !suggestedVersion ? t('Версия не распознана') : undefined
          }
        />
        <Field
          label="Дата добавления"
          name="addedAt"
          type="date"
          defaultValue={entry ? entry.addedAt : catalogDate()}
        />
        <Field
          label="Дата обновления"
          name="updatedAt"
          type="date"
          defaultValue={entry?.updatedAt}
        />
        <label className={s.field}>
          {t('Описание мода')}
          <textarea name="description" rows={3} defaultValue={entry?.description} />
        </label>
        <EditorImageField initialPath={entry?.image} label="Загрузить обложку для карточки" />
        <Field label="Семейство карты" name="family" defaultValue={entry?.family} />
        <Field label="Вариант карты" name="variant" defaultValue={entry?.variant} />
        <Field
          label="Требуемые DLC через запятую"
          name="dlcs"
          defaultValue={entry?.dlcs?.join(', ')}
        />
        <label>
          <input type="checkbox" name="paid" defaultChecked={entry?.paid} /> {t('Платная')}
        </label>
        {entry?.type === 'map' && entry.family && (
          <label className={s.field}>
            {t('Бесплатная замена')}
            <select name="freeReplacement" defaultValue={entry.freeReplacement || ''}>
              <option value="">{t('Без замены')}</option>
              {catalog.entries
                .filter((item) => item.id !== entry.id && item.type === 'map' &&
                  item.family === entry.family && !item.paid)
                .map((item) => <option key={item.id} value={item.id}>{t(item.title)}</option>)}
            </select>
          </label>
        )}
        <EntryFiles
          selected={[...(entry?.files || []), ...seedFiles]}
          order={[...catalog.order].reverse().filter(({ key }) => !owned.has(key))}
        />
        {entry?.files.length > 0 && unassigned.length > 0 && (
          <details className={s.replacement}>
            <summary>{t('Заменить файлы новой версией')}</summary>
            <p>
              {t(
                'Выбери замену из непривязанных файлов. Новый файл займёт место старого в порядке загрузки.',
              )}
            </p>
            {entry.files.map((key) => (
              <label className={s.field} key={key}>
                {byKey.get(key).name}
                <select name={`replace:${key}`} defaultValue="">
                  <option value="">{t('Оставить текущий файл')}</option>
                  {unassigned.map((file) => (
                    <option key={file.key} value={file.key}>
                      {file.name} · {file.key}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </details>
        )}
        <div className={s.actions}>
          <button className="button">{t('Сохранить позицию')}</button>
          {entry?.versionReview && (
            <>
              <button
                type="button"
                className="button button-secondary"
                onClick={() =>
                  commit({
                    ...catalog,
                    entries: replace(catalog.entries, 'id', { ...entry, versionReview: undefined }),
                  })
                }
              >
                {t('Данные актуальны')}
              </button>
              <button type="submit" className="button button-secondary" value="reviewed">
                {t('Сохранить и отметить проверенным')}
              </button>
            </>
          )}
          {entry && (
            <button className="button button-secondary" value="update">
              {t('Сохранить как обновление')}
            </button>
          )}
          {entry && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                if (
                  commit({ ...catalog, entries: catalog.entries.filter((item) => item.id !== id) })
                )
                  setId('');
              }}
            >
              {t('Удалить позицию')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function EntityPicker({ items, id, setId }) {
  const { t } = useTranslation();
  return (
    <label className={s.field}>
      {t('Что редактировать')}
      <select value={id} onChange={(event) => setId(event.target.value)}>
        <option value="">{t('Новая запись')}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title} · {item.id}
            {item.notes?.length > 0 && ` · ${item.notes.join(' · ')}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function RulesEditor({ catalog, commit }) {
  const { t } = useTranslation();
  const { entries, conflicts } = catalog;
  const [index, setIndex] = useState(-1);
  const rule = conflicts[index];
  const name = (id) => entries.find((entry) => entry.id === id)?.title;
  return (
    <section className={s.panel}>
      <h2>{t('Конфликты')}</h2>
      <EntityPicker
        items={conflicts.map((item, position) => ({
          id: String(position),
          title: item.entries.map(name).join(' + '),
        }))}
        id={rule ? String(index) : ''}
        setId={(id) => setIndex(id === '' ? -1 : Number(id))}
      />
      <form
        className={s.form}
        key={index}
        onSubmit={(event) => {
          const form = getForm(event);
          const next = {
            entries: [form.get('first'), form.get('second')],
            reason: valueOf(form, 'reason'),
          };
          if (
            commit({
              ...catalog,
              conflicts: rule
                ? conflicts.map((item, position) => (position === index ? next : item))
                : [...conflicts, next],
            })
          ) {
            setIndex(rule ? index : conflicts.length);
          }
        }}
      >
        {['first', 'second'].map((field, position) => (
          <label className={s.field} key={field}>
            {t(position ? 'Вторая позиция' : 'Первая позиция')}
            <select name={field} defaultValue={rule?.entries[position] || ''} required>
              <option value="">{t('Выбрать позицию')}</option>
              {entries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title}
                </option>
              ))}
            </select>
          </label>
        ))}
        <Field label="Причина конфликта" name="reason" defaultValue={rule?.reason} />
        <div className={s.actions}>
          <button className="button">{t('Сохранить конфликт')}</button>
          {rule && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                if (
                  commit({
                    ...catalog,
                    conflicts: conflicts.filter((_, position) => position !== index),
                  })
                )
                  setIndex(-1);
              }}
            >
              {t('Удалить конфликт')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function PresetEditor({ catalog, commit, onExport, initialId, onOpenProject, busy, drafts }) {
  const { t } = useTranslation();
  const [id, setId] = useState(initialId);
  const [creatingServer, setCreatingServer] = useState(false);
  const preset = catalog.presets.find((item) => item.id === id);
  const server = creatingServer || preset?.tags?.includes('server');
  const release = builderCatalogs.find((item) => catalogKey(item) === catalogKey(catalog));
  const projectPresets = release
    ? release.presets
        .filter((item) => !catalog.presets.some((draft) => draft.id === item.id))
        .map((item) => ({
          catalog: release,
          preset: item,
          id: `${catalogKey(release)}:${item.id}`,
          title: `${item.title} · ${release.game.toUpperCase()} ${release.version}`,
        }))
    : [];
  const project = projectPresets.find((item) => item.id === id);
  const officialPairs = combinedPresetPairs(catalog).filter(
    ({ preset: pair }) => !resolveCombo(catalog, pair.selection).conflicts.length,
  );
  return (
    <section className={s.panel}>
      <h2>{t('Готовые сборки')}</h2>
      <p>
        {t(
          'Локальный каталог показывает сборку из JSON, если файл уже добавлен в проект. Изменения черновика можно проверить в предпросмотре ниже.',
        )}
      </p>
      <Link className="text-link" to={`/combos?version=${catalog.version}`}>
        {t('Открыть готовые сборки')}
      </Link>
      <div className={s.toolbar}>
        <EntityPicker
          items={[...catalog.presets, ...projectPresets]}
          id={id}
          setId={(next) => {
            setId(next);
            setCreatingServer(false);
          }}
        />
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            const root = `server-${catalog.game}-${catalog.version.replace('.', '-')}`;
            let next = root;
            let suffix = 2;
            while (catalog.presets.some((item) => item.id === next)) next = `${root}-${suffix++}`;
            setId(next);
            setCreatingServer(true);
          }}
        >
          {t('Добавить серверную сборку')}
        </button>
      </div>
      {project ? (
        <button
          type="button"
          className="button button-secondary"
          disabled={busy}
          onClick={() => onOpenProject(project)}
        >
          {t(
            drafts.some((item) => catalogKey(item) === catalogKey(project.catalog))
              ? 'Скачать копию черновика и заменить его каталогом из проекта'
              : 'Открыть сборку из проекта',
          )}
        </button>
      ) : (
        <form
          className={s.form}
          key={id}
          onSubmit={(event) => {
            const exporting = event.nativeEvent.submitter?.value === 'export';
            const form = getForm(event);
            const tags = form.getAll('tags');
            const optionalSelection = form.getAll('optionalSelection');
            if (tags.includes('server') && form.get('serverProfilesResolved') === 'no') {
              setNotice('Сначала сопоставь все файлы профилей с общим каталогом.');
              return;
            }
            const next = {
              id: preset?.id || valueOf(form, 'id'),
              title: valueOf(form, 'title'),
              fileSlug: valueOf(form, 'fileSlug'),
              version: valueOf(form, 'version'),
              boosty: valueOf(form, 'boosty'),
              profile: valueOf(form, 'profile'),
              cloud: valueOf(form, 'cloud'),
              company: valueOf(form, 'company'),
              video: valueOf(form, 'video'),
              image: valueOf(form, 'image'),
              tags,
              updatedAt: catalogDate(),
              selection: [...new Set([...form.getAll('selection'), ...optionalSelection])],
              optionalSelection: tags.includes('server') ? optionalSelection : undefined,
              releases: preset?.releases,
            };
            if (exporting) {
              onExport(next);
              return;
            }
            const presets = preset
              ? replace(catalog.presets, 'id', next)
              : [...catalog.presets, next];
            if (commit({ ...catalog, presets })) setId(next.id);
          }}
        >
          <Field
            label="Идентификатор (a-z, 0-9, дефис)"
            name="id"
            defaultValue={preset?.id || (creatingServer ? id : undefined)}
            readOnly={Boolean(preset)}
            required
          />
          <Field label="Название" name="title" defaultValue={preset?.title} required />
          <Field
            label="Короткое имя файла сборки"
            name="fileSlug"
            defaultValue={preset?.fileSlug}
            placeholder="quper-map"
            pattern="[a-z0-9]+(?:\x2D[a-z0-9]+)*"
          />
          <Field label="Игра" value={catalog.game.toUpperCase()} readOnly />
          <Field label="Версия игры" value={catalog.version} readOnly />
          <Field
            label="Версия сборки"
            name="version"
            defaultValue={preset?.version}
            placeholder="1.2"
          />
          <Field
            label="Ссылка на пост Boosty"
            name="boosty"
            type="url"
            defaultValue={preset?.boosty}
          />
          <Field
            label="Ссылка на готовый профиль"
            name="profile"
            type="url"
            defaultValue={preset?.profile}
          />
          {server && (
            <>
              <Field
                label="Ссылка на облако с комплектом"
                name="cloud"
                type="url"
                defaultValue={preset?.cloud}
              />
              <Field
                label="Ссылка на комплект ВТК компании"
                name="company"
                type="url"
                defaultValue={preset?.company}
              />
            </>
          )}
          <Field
            label="Ссылка на видеообзор"
            name="video"
            type="url"
            defaultValue={preset?.video}
          />
          <EditorImageField initialPath={preset?.image} label="Загрузить обложку для карточки" />
          <fieldset className={s.choices}>
            <legend>{t('Теги сборки')}</legend>
            <div className={s.choiceList}>
              {presetTags.map((tag) => (
                <label key={tag}>
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag}
                    defaultChecked={tag === 'server' ? server : preset?.tags?.includes(tag)}
                  />{' '}
                  {t(tagUtils.getLabel(tag))}
                </label>
              ))}
            </div>
          </fieldset>
          <PresetSelection
            catalog={catalog}
            initialSelection={preset?.selection}
            initialOptionalSelection={preset?.optionalSelection}
            server={server}
          />
          <div className={s.actions}>
            <button className="button">{t('Сохранить сборку')}</button>
            {preset && (
              <button type="submit" value="export" className="button button-secondary">
                {t('Выгрузить сборку JSON')}
              </button>
            )}
            {preset && (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  if (
                    commit({
                      ...catalog,
                      presets: catalog.presets.filter((item) => item.id !== id),
                    })
                  )
                    setId('');
                }}
              >
                {t('Удалить сборку')}
              </button>
            )}
          </div>
        </form>
      )}
      {preset && (
        <p>
          {t('Файл сборки')} · <code>{presetFileName(catalog, preset)}</code>
        </p>
      )}
      {officialPairs.length > 0 && (
        <details>
          <summary>{t('Короткие ссылки на официальные сборки карт и модов')}</summary>
          {officialPairs.map(({ mapPreset, modPreset, preset: pair }) => {
            const url = new URL(`/${pair.slug}`, `${site.domain}/`).href;
            return (
              <div className={s.officialPairLink} key={pair.id}>
                <Field label={`${mapPreset.title} + ${modPreset.title}`} value={url} readOnly />
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={(event) => {
                    const input = event.currentTarget.parentElement?.querySelector('input');
                    input?.select();
                    navigator.clipboard?.writeText(url).then(
                      () => setNotice('Короткая ссылка скопирована.'),
                      () => {},
                    );
                  }}
                >
                  {t('Скопировать ссылку')}
                </button>
              </div>
            );
          })}
        </details>
      )}
      {preset && (
        <details>
          <summary>{t('Предпросмотр страницы сборки')}</summary>
          <PresetContent key={preset.id} catalog={catalog} preset={preset} share={false} />
        </details>
      )}
    </section>
  );
}

function PresetSelection({
  catalog,
  initialSelection = [],
  initialOptionalSelection = [],
  server,
}) {
  return server ? (
    <ServerPresetSelection
      catalog={catalog}
      initialSelection={initialSelection}
      initialOptionalSelection={initialOptionalSelection}
    />
  ) : (
    <StandardPresetSelection catalog={catalog} initialSelection={initialSelection} />
  );
}

function StandardPresetSelection({ catalog, initialSelection = [] }) {
  const { t } = useTranslation();
  const [selection, setSelection] = useState(initialSelection);
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const selectable = entriesByLoadOrder(catalog).filter(isSelectable);
  const selected = new Set(selection);
  const filter = query.trim().toLowerCase();
  const matches = selectable.filter(({ id, title }) =>
    `${title} ${t(title)} ${id}`.toLowerCase().includes(filter),
  );

  async function loadProfile(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (!file) return;
    setProfile(null);
    setError('');
    setBusy(true);
    try {
      if (!file.name.toLowerCase().endsWith('.sii') || !file.size || file.size > MAX_PROFILE_SIZE)
        throw new Error('Выбери непустой profile.sii размером до 300 КБ.');
      const files = parseModOrder(await processProfile(await file.arrayBuffer()));
      const keys = new Set(files.map(({ key }) => key));
      const next = selectable
        .filter((entry) => entry.files.some((key) => keys.has(key)))
        .map(({ id }) => id);
      const result = resolveCombo(catalog, next);
      const resolvedKeys = new Set(result.files.map(({ key }) => key));
      setProfile({
        selection: next,
        missing: files.filter(({ key }) => !resolvedKeys.has(key)),
        extra: result.files.filter(({ key }) => !keys.has(key)),
      });
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset className={s.choices}>
      <legend>{t('Состав сборки')}</legend>
      <div className={s.toolbar}>
        <Field
          label="Загрузить profile.sii для состава сборки"
          type="file"
          accept=".sii"
          disabled={busy}
          onChange={loadProfile}
        />
        <Field
          label="Поиск карт и модов"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {error && <p role="alert">{t(error)}</p>}
      {profile && (
        <div className={s.importPreview}>
          <p role="status">
            {t('Найдено карт и модов — ')}
            {profile.selection.length}
          </p>
          {[
            ['Файлы профиля вне итоговой сборки', profile.missing],
            ['Дополнительные файлы в итоговой сборке', profile.extra],
          ].map(
            ([label, files]) =>
              files.length > 0 && (
                <details key={label}>
                  <summary>
                    {t(label)} · {files.length}
                  </summary>
                  <ul className={s.importList}>
                    {files.map(({ key, name }) => (
                      <li key={key}>
                        {name} · {key}
                      </li>
                    ))}
                  </ul>
                </details>
              ),
          )}
          <div className={s.actions}>
            <button
              type="button"
              className="button"
              disabled={!profile.selection.length}
              onClick={() => {
                setSelection(profile.selection);
                setQuery('');
                setProfile(null);
              }}
            >
              {t('Заменить выбор составом из профиля')}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setProfile(null)}
            >
              {t('Отмена')}
            </button>
          </div>
        </div>
      )}
      {selection.map((id) => (
        <input key={id} type="hidden" name="selection" value={id} />
      ))}
      <div className={s.presetSelectionColumns}>
        {[
          ['Доступные карты и моды', false, selectable.length - selected.size],
          ['Выбранные карты и моды', true, selected.size],
        ].map(([label, checked, count]) => (
          <fieldset key={label} className={s.choices}>
            <legend>
              {t(label)} · {count}
            </legend>
            <div className={s.choiceList}>
              {matches
                .filter(({ id }) => selected.has(id) === checked)
                .map(({ id, title }) => (
                  <label key={id}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelection((ids) =>
                          checked ? ids.filter((item) => item !== id) : [...ids, id],
                        )
                      }
                    />{' '}
                    {t(title)}
                  </label>
                ))}
            </div>
          </fieldset>
        ))}
      </div>
    </fieldset>
  );
}

function ServerPresetSelection({ catalog, initialSelection = [], initialOptionalSelection = [] }) {
  const { t } = useTranslation();
  const selectable = entriesByLoadOrder(catalog);
  const selectableIds = new Set(selectable.map(({ id }) => id));
  const [required, setRequired] = useState(
    initialSelection.filter(
      (id) => selectableIds.has(id) && !initialOptionalSelection.includes(id),
    ),
  );
  const [optional, setOptional] = useState(
    initialOptionalSelection.filter((id) => selectableIds.has(id)),
  );
  const [coreKeys, setCoreKeys] = useState(null);
  const [coreUnmatched, setCoreUnmatched] = useState([]);
  const [fullReport, setFullReport] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const byFile = new Map(
    catalog.entries.flatMap((entry) => entry.files.map((key) => [key, entry])),
  );
  const coreIssues = fullReport?.missingRequired || [];
  const unresolved = [...coreUnmatched, ...(fullReport?.unmatched || []), ...coreIssues].filter(
    (value, index, values) => values.indexOf(value) === index,
  );

  async function readModSet(file) {
    const isProfile = file.name.toLowerCase().endsWith('.sii');
    if (isProfile && (!file.size || file.size > MAX_PROFILE_SIZE))
      throw new Error('Выбери непустой profile.sii размером до 300 КБ.');
    if (!isProfile && !file.name.toLowerCase().endsWith('.txt'))
      throw new Error('Выбери profile.sii или TXT со списком active_mods.');
    const source = isProfile ? await processProfile(await file.arrayBuffer()) : await file.text();
    const files = parseModOrder(source);
    if (!files.length) throw new Error('В файле не найден список active_mods.');
    const keys = new Set(files.map(({ key }) => key));
    const ids = selectable
      .filter((entry) => entry.files.some((key) => keys.has(key)))
      .map(({ id }) => id);
    return {
      files,
      keys,
      ids,
      unmatched: files.filter(({ key }) => !byFile.has(key)),
    };
  }

  async function loadCore(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const imported = await readModSet(file);
      setCoreKeys(imported.keys);
      setCoreUnmatched(imported.unmatched);
      setRequired(imported.ids);
      setOptional([]);
      setFullReport({
        unmatched: imported.unmatched,
        missingRequired: [],
      });
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadFull(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      if (!coreKeys) throw new Error('Сначала загрузи список обязательных модов.');
      const imported = await readModSet(file);
      const missingRequired = [...coreKeys].filter((key) => !imported.keys.has(key));
      setOptional(imported.ids.filter((id) => !required.includes(id)));
      setFullReport({
        unmatched: imported.unmatched,
        missingRequired,
      });
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  function setEntryKind(id, kind, enabled) {
    const target = kind === 'required' ? setRequired : setOptional;
    const other = kind === 'required' ? setOptional : setRequired;
    target((ids) => (enabled ? [...new Set([...ids, id])] : ids.filter((item) => item !== id)));
    if (enabled) other((ids) => ids.filter((item) => item !== id));
  }

  const visible = selectable.filter((entry) =>
    `${entry.title} ${entry.id}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <fieldset className={s.choices}>
      <legend>{t('Состав серверной сборки')}</legend>
      <p>
        {t(
          'Сначала загрузи профиль с обязательными модами, затем полный профиль сервера. Опциональными станут моды из полного профиля сверх обязательных.',
        )}
      </p>
      <p>
        {t(
          'В серверную сборку можно включать записи любого типа из общего каталога. Тип «Серверный мод» предназначен только для серверных сборок; совпадающие записи используют общие данные каталога.',
        )}
      </p>
      <div className={s.toolbar}>
        <Field
          label="Загрузить обязательный состав"
          type="file"
          accept=".sii,.txt"
          disabled={busy}
          onChange={loadCore}
        />
        <Field
          label="Загрузить полный состав сервера"
          type="file"
          accept=".sii,.txt"
          disabled={busy || !coreKeys}
          onChange={loadFull}
        />
      </div>
      {error && <p role="alert">{t(error)}</p>}
      {coreKeys && (
        <p role="status">
          {t('Обязательных файлов в профиле — ')} {coreKeys.size}
          {fullReport && ` · ${t('Опциональных модов — ')} ${optional.length}`}
        </p>
      )}
      {unresolved.length > 0 && (
        <div role="alert">
          {fullReport?.missingRequired?.length > 0 && (
            <p>{t('В полном профиле отсутствуют обязательные файлы:')}</p>
          )}
          {(coreUnmatched.length > 0 || fullReport?.unmatched?.length > 0) && (
            <p>
              {t(
                'Добавь неизвестные файлы в каталог как серверные моды или привяжи их к существующим модам, затем загрузи профили снова:',
              )}
            </p>
          )}
          <ul className={s.importList}>
            {unresolved.map((file, index) => (
              <li key={`${file.key || file}-${index}`}>
                {file.name ? `${file.name} · ${file.key}` : file}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Field
        label="Фильтр списка"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className={s.serverSelectionList}>
        {visible.map((entry) => (
          <div className={s.serverSelectionRow} key={entry.id}>
            <strong>{t(entry.title)}</strong>
            <label>
              <input
                type="checkbox"
                checked={required.includes(entry.id)}
                onChange={(event) => setEntryKind(entry.id, 'required', event.target.checked)}
              />{' '}
              {t('Обязательная позиция')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={optional.includes(entry.id)}
                onChange={(event) => setEntryKind(entry.id, 'optional', event.target.checked)}
              />{' '}
              {t('Опциональная позиция')}
            </label>
          </div>
        ))}
      </div>
      {required.map((id) => (
        <input key={`required-${id}`} type="hidden" name="selection" value={id} />
      ))}
      {optional.map((id) => (
        <input key={`optional-${id}`} type="hidden" name="optionalSelection" value={id} />
      ))}
      <input type="hidden" name="serverProfilesResolved" value={unresolved.length ? 'no' : 'yes'} />
    </fieldset>
  );
}
