import { Link, useParams } from 'react-router-dom';
import { getAllCombos } from '../../data';
import site from '../../../content/site.json';
import ComboContent from '../../components/ComboContent/ComboContent';
import { ImageBlock } from '../../components/ImageBlock/ImageBlock';
import { tagUtils } from '../../utils/tags';
import s from './Combo.module.css';
export default function Combo() {
  const { slug } = useParams();
  const combo = getAllCombos().find((item) => item.id === slug);
  if (!combo)
    return (
      <div className="container page empty-state">
        <h1>Сборка не найдена</h1>
        <p>Проверь адрес или найди сборку в каталоге.</p>
        <Link className="button" to="/combos">
          Все сборки
        </Link>
      </div>
    );
  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Хлебные крошки">
        <Link to="/">Главная</Link>
        <span>/</span>
        <Link to={`/combos?version=${combo.version_game}`}>Сборки {combo.version_game}</Link>
        <span>/</span>
        <span>{combo.title}</span>
      </nav>
      <header className={s.heading}>
        <div className={s.tags}>
          {combo.tags.map((tag) => (
            <span
              key={tag}
              className={`badge ${tag === 'boosty' ? 'badge-boosty' : 'badge-green'}`}
            >
              {tagUtils.getLabel(tag)}
            </span>
          ))}
          {combo.version_game !== site.currentGameVersion && (
            <span className="badge">Архивная версия</span>
          )}
        </div>
        <h1>{combo.title}</h1>
        <div className={s.meta}>
          <span>
            Версия игры <b>{combo.version_game}</b>
          </span>
          <span>
            Версия сборки <b>{combo.version}</b>
          </span>
          {combo.date && (
            <span>
              Обновлено <b>{combo.date}</b>
            </span>
          )}
        </div>
      </header>
      {combo.version_game !== site.currentGameVersion && (
        <aside className={s.archive}>
          Это сборка для версии игры {combo.version_game}.{' '}
          <Link to="/combos">Перейти к актуальным сборкам →</Link>
        </aside>
      )}
      <div className={s.layout}>
        <div>
          <ComboContent combo={combo} />
        </div>
        <section className={s.order} id="map-order">
          <span className="eyebrow">Менеджер модификаций</span>
          <h2>Порядок карт и модов</h2>
          <p>
            Расставь модификации в том же порядке, сверху вниз. Изображение можно открыть в полном
            размере.
          </p>
          <ImageBlock
            top={combo.image_top}
            center={combo.image_center}
            bottom={combo.image_bottom}
          />
        </section>
      </div>
    </div>
  );
}
