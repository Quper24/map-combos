import { useEffect, useState } from 'react';
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
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  return (
    <>
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <header className={s.header}>
        <div className={`container ${s.bar}`}>
          <Link
            to="/"
            className={s.brand}
            onClick={() => setOpen(false)}
            aria-label="Quper Simulator — главная"
          >
            <img src="/img/logo.jpg" width="48" height="48" alt="" />
            <span>
              QUPER<span className={s.brandSub}>SIMULATOR</span>
            </span>
          </Link>
          <nav
            id="main-navigation"
            className={`${s.navigation} ${open ? s.open : ''}`}
            aria-label="Основная навигация"
          >
            {navigation.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? s.active : '')}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <ExternalLink className={s.community} href="https://t.me/QuperSimulator">
            Наш Telegram
          </ExternalLink>
          <button
            className={s.toggle}
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-controls="main-navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className={s.footer}>
        <div className={`container ${s.footerTop}`}>
          <div>
            <Link to="/" className={s.footerBrand}>
              QUPER <span>SIMULATOR</span>
            </Link>
            <p>Весь мир у наших колёс.</p>
          </div>
          <nav aria-label="Разделы в подвале">
            {navigation.slice(1).map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
          </nav>
          <div className={s.socials}>
            {site.socialLinks.map((link) => (
              <ExternalLink key={link.platform} href={link.url} className={s.social}>
                {link.label}
              </ExternalLink>
            ))}
          </div>
        </div>
        <div className={`container ${s.footerBottom}`}>
          <span>© {new Date().getFullYear()} Quper Simulator</span>
          <span>Для тех, кому всегда мало дорог.</span>
          <a href="#main">Наверх ↑</a>
        </div>
      </footer>
    </>
  );
}
