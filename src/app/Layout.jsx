import { useTranslation } from '../i18n/Language';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import site from '../../content/site.json';
import Icon from '../components/ui/Icon';
import ExternalLink from '../components/ui/ExternalLink';
import s from './Layout.module.css';
const navigation = [
  ['/', 'Главная'],
  ['/combos', 'Сборки карт'],
  ['/vtc', 'VTC'],
  ['/mods', 'Моды и плагины'],
  ['/videos', 'Видео'],
];
export default function Layout() {
  const { t, language, setLanguage } = useTranslation();
  const boosty = site.socialLinks.find((link) => link.platform === 'boosty');
  const [open, setOpen] = useState(false);
  const menuToggle = useRef(null);
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash)
      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });
  }, [pathname, hash]);
  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        menuToggle.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);
  return (
    <>
      <a className="skip-link" href="#main">
        {t('К содержимому')}
      </a>
      <header className={s.header}>
        <div className={`container ${s.bar}`}>
          <Link to="/" className={s.brand} onClick={() => setOpen(false)}>
            <img src="/img/logo-96.jpg" width="48" height="48" alt={''} />
            <span>
              QUPER <span className={s.brandSub}>SIMULATOR</span>
            </span>
          </Link>
          <nav
            id="main-navigation"
            className={`${s.navigation} ${open ? s.open : ''}`}
            aria-label={t('Основная навигация')}
          >
            {navigation.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? s.active : '')}
              >
                {t(label)}
              </NavLink>
            ))}
          </nav>
          <div
            className={s.languages}
            role="group"
            aria-label={language === 'ru' ? 'Язык сайта' : 'Site language'}
          >
            <button
              type="button"
              lang="ru"
              aria-label={['RU', 'Русский'].join(' — ')}
              aria-pressed={language === 'ru'}
              onClick={() => setLanguage('ru')}
            >
              RU
            </button>
            <button
              type="button"
              lang="en"
              aria-label="EN — English"
              aria-pressed={language === 'en'}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
          </div>
          {boosty && (
            <ExternalLink className={s.community} href={boosty.url}>
              Boosty
            </ExternalLink>
          )}
          <button
            ref={menuToggle}
            className={s.toggle}
            aria-label={t(open ? 'Закрыть меню' : 'Открыть меню')}
            aria-controls="main-navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className={s.footer}>
        <div className={`container ${s.footerTop}`}>
          <div>
            <Link to="/" className={s.footerBrand}>
              QUPER <span>SIMULATOR</span>
            </Link>
            <p>{t('Весь мир у наших колёс.')}</p>
          </div>
          <nav aria-label={t('Разделы в подвале')}>
            {navigation.slice(1).map(([to, label]) => (
              <Link key={to} to={to}>
                {t(label)}
              </Link>
            ))}
          </nav>
          <div className={s.socials}>
            {site.socialLinks.map((link) => (
              <ExternalLink key={link.platform} href={link.url} className={s.social}>
                {t(link.label)}
              </ExternalLink>
            ))}
          </div>
        </div>
        <div className={`container ${s.footerBottom}`}>
          <span>© {t(new Date().getFullYear())} Quper Simulator</span>
          <span>{t('Для тех, кому всегда мало дорог.')}</span>
          <a href="#main">{t('Наверх ↑')}</a>
        </div>
      </footer>
    </>
  );
}
