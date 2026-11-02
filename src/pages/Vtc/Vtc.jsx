import { Link } from 'react-router-dom';
import vtc from '../../../content/vtc.json';
import useCurrentCombos from '../../lib/currentCombos';
import ComboCard from '../../components/ComboCard/ComboCard';
import ExternalLink from '../../components/ui/ExternalLink';
import Icon from '../../components/ui/Icon';
import s from './Vtc.module.css';
export default function Vtc() {
  const currentCombos = useCurrentCombos();
  const serverCombos = currentCombos.filter((combo) => combo.tags?.includes('server'));
  return (
    <div className="container page">
      <section className={s.hero}>
        <div>
          <span className="eyebrow">Quper Simulator / VTC</span>
          <h1>{vtc.tagline}</h1>
          {vtc.description.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
          <div className="actions">
            {vtc.links.map((link, index) => (
              <ExternalLink
                key={link.platform}
                href={link.url}
                className={`button ${index ? 'button-secondary' : ''}`}
              >
                {link.label}
              </ExternalLink>
            ))}
          </div>
        </div>
        <div className={s.logo}>
          <img src="/img/logo.jpg" width="350" height="350" alt="Quper Simulator VTC" />
          <span>Дороги разные. Команда одна.</span>
        </div>
      </section>
      <section className={s.benefits}>
        <h2>Свобода быть за рулём.</h2>
        <div>
          {vtc.benefits.map((text, index) => (
            <article key={text}>
              <span>0{index + 1}</span>
              <Icon name="check" />
              <p>{text}</p>
            </article>
          ))}
        </div>
        <p className={s.closing}>{vtc.closing}</p>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Встречаемся в конвое</span>
            <h2>Наши серверы</h2>
            <p>Играем в ETS2 и ATS. Выбери серверную сборку и подготовься к поездке.</p>
          </div>
          <Link className="text-link" to="/server-guide">
            Как подключиться <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="card-grid">
          {serverCombos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      </section>
      <section className={s.join}>
        <span className="eyebrow">Твой следующий рейс</span>
        <h2>{vtc.headline}</h2>
        <p>Новичок или опытный дальнобойщик — будем рады ехать вместе.</p>
        <div className="actions">
          {vtc.links.map((link) => (
            <ExternalLink key={link.platform} href={link.url}>
              {link.label}
            </ExternalLink>
          ))}
        </div>
      </section>
    </div>
  );
}
