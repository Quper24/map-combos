// C:\Quper-projects\map-combos\src\components\Header\Header.jsx
import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { COMBOS_BY_VERSION, VERSIONS } from "../../data";

import "./header.css";

export default function Header({ selectedVersion, onVersionChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false);
  const menuRef = useRef();
  const burgerRef = useRef();
  const versionRef = useRef();

  // Получаем комбо ТОЛЬКО для выбранной версии
  const currentCombos = COMBOS_BY_VERSION[selectedVersion] || [];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsVersionMenuOpen(false);
  };

  const toggleVersionMenu = () => {
    setIsVersionMenuOpen(!isVersionMenuOpen);
    setIsMenuOpen(false);
  };

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsVersionMenuOpen(false);
  };

  const handleVersionChange = (versionId) => {
    onVersionChange(versionId);
    setIsVersionMenuOpen(false);

    // Если мы на странице комбо, перенаправляем на главную
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        burgerRef.current &&
        !burgerRef.current.contains(event.target)
      ) {
        closeAllMenus();
      }
      if (
        isVersionMenuOpen &&
        versionRef.current &&
        !versionRef.current.contains(event.target)
      ) {
        closeAllMenus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, isVersionMenuOpen]);

  // Закрытие меню при нажатии Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeAllMenus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Логотип */}
        <div className="logo">
          <NavLink to="/" onClick={closeAllMenus}>
            <img src="/img/logo.jpg" alt="MAP COMBOS" className="logo-image" />
          </NavLink>
        </div>

        {/* Селектор версий в хедере */}
        <div className="header-version-selector" ref={versionRef}>
          <button
            className="header-version-btn"
            onClick={toggleVersionMenu}
            aria-expanded={isVersionMenuOpen}
            aria-label={`Выбрать версию игры. Текущая: ${selectedVersion}`}>
            <span className="header-version-icon">
              {VERSIONS[selectedVersion]?.icon || "✅"}
            </span>
            <span className="header-version-label">v{selectedVersion}</span>
            <span
              className={`header-version-arrow ${isVersionMenuOpen ? "open" : ""}`}>
              ▼
            </span>
          </button>

          {isVersionMenuOpen && (
            <div className="header-version-dropdown">
              {Object.entries(VERSIONS)
                .sort(([aKey], [bKey]) => bKey.localeCompare(aKey))
                .map(([versionId, versionData]) => (
                  <button
                    key={versionId}
                    onClick={() => handleVersionChange(versionId)}
                    className={`header-version-option ${selectedVersion === versionId ? "active" : ""}`}>
                    <span className="header-version-option-icon">
                      {versionData.icon}
                    </span>
                    <span className="header-version-option-text">
                      {versionData.label}
                      {versionData.status === "current" && (
                        <span className="header-version-badge current">
                          Текущая
                        </span>
                      )}
                      {versionData.status === "upcoming" && (
                        <span className="header-version-badge upcoming">
                          Скоро
                        </span>
                      )}
                    </span>
                    {selectedVersion === versionId && (
                      <span className="header-version-check">✓</span>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Бургер меню */}
        <button
          ref={burgerRef}
          className={`burger-btn ${isMenuOpen ? "active" : ""}`}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={isMenuOpen}
          aria-controls="main-navigation">
          <span className="burger-line"></span>
          <span className="burger-line"></span>
          <span className="burger-line"></span>
        </button>

        {/* Основное меню навигации */}
        <nav
          ref={menuRef}
          id="main-navigation"
          className={`nav ${isMenuOpen ? "open" : ""}`}
          aria-hidden={!isMenuOpen}>
          {/* Показываем ТОЛЬКО комбо для выбранной версии */}
          {currentCombos.map((combo) => (
            <NavLink
              key={combo.id}
              to={`/${combo.id}`}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={closeAllMenus}>
              {combo.title}
            </NavLink>
          ))}
        </nav>

        {/* Оверлей для закрытия меню */}
        {(isMenuOpen || isVersionMenuOpen) && (
          <div className="menu-overlay" onClick={closeAllMenus}></div>
        )}
      </div>
    </header>
  );
}
