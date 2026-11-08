import { useTranslation } from '../../i18n/Language';
import { Link, useParams } from 'react-router-dom';
import { getAllCombos } from '../../data';
import { currentComboVersion, editorDraftCombos } from '../../data/builderCatalogs';
import ComboContent from '../../components/ComboContent/ComboContent';
import { ImageBlock } from '../../components/ImageBlock/ImageBlock';
import { tagUtils } from '../../utils/tags';
import PresetContent from '../ComboBuilder/PresetContent';
import s from './Combo.module.css';
export default function Combo() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const combo =
    editorDraftCombos().find((item) => item.id === slug) ||
    getAllCombos().find((item) => item.id === slug);
  if (!combo)
    return (
      <div className="container page empty-state">
        <h1>{t('Сборка не найдена')}</h1>
        <p>{t('Проверь адрес или найди сборку в каталоге.')}</p>
        <Link className="button" to="/combos">
          {t('Все сборки')}
        </Link>
      </div>
    );
  const archived = !combo.draft && combo.version_game !== currentComboVersion;
  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label={t('Хлебные крошки')}>
        <Link to="/">{t('Главная')}</Link>
        <span>/</span>
        <Link to={`/combos?version=${combo.version_game}`}>
          {t('Сборки ')}
          {combo.version_game}
        </Link>
        <span>/</span>
        <span>{t(combo.title)}</span>
      </nav>
      <header className={s.heading}>
        <div className={s.tags}>
          {combo.tags.map((tag) => (
            <span
              key={tag}
              className={`badge ${tag === 'boosty' ? 'badge-boosty' : 'badge-green'}`}
            >
              {t(tagUtils.getLabel(tag))}
            </span>
          ))}
          {combo.draft && <span className="badge">{t('Черновик')}</span>}
          {archived && <span className="badge">{t('Архивная версия')}</span>}
        </div>
        <h1>{t(combo.title)}</h1>
        <div className={s.meta}>
          <span>
            {t('Версия игры ')}
            <b>{combo.version_game}</b>
          </span>
          {combo.version && (
            <span>
              {t('Версия сборки ')}
              <b>{combo.version}</b>
            </span>
          )}
          {combo.date && (
            <span>
              {t('Обновлено ')}
              <b>{combo.date}</b>
            </span>
          )}
        </div>
      </header>
      {archived && (
        <aside className={s.archive}>
          {t('Это сборка для версии игры ')}
          {combo.version_game}. <Link to="/combos">{t('Перейти к актуальным сборкам →')}</Link>
        </aside>
      )}
      {combo.builder ? (
        <PresetContent {...combo.builder} share={!combo.draft} />
      ) : (
        <div className={s.layout}>
          <div>
            <ComboContent combo={combo} />
          </div>
          <section
            className={s.order}
            id="map-order"
            tabIndex={0}
            aria-labelledby="map-order-heading"
          >
            <span className="eyebrow">{t('Менеджер модификаций')}</span>
            <h2 id="map-order-heading">{t('Порядок карт и модов')}</h2>
            <p>
              {t(
                'Расставь модификации в том же порядке, сверху вниз. Изображение можно открыть в полном размере.',
              )}
            </p>
            <ImageBlock
              top={combo.image_top}
              center={combo.image_center}
              bottom={combo.image_bottom}
            />
          </section>
        </div>
      )}
    </div>
  );
}
