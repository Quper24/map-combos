// Header.jsx с анимацией закрытия по клику вне меню
import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { combos } from "../../data/combos";

import "./header.css";

export default function Header() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef();
  const burgerRef = useRef();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        burgerRef.current &&
        !burgerRef.current.contains(event.target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Закрытие меню при нажатии Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isMenuOpen) {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="logo">
          <NavLink to="/" onClick={closeMenu}>
            <img src="/img/logo.jpg" alt="MAP COMBOS" className="logo-image" />
          </NavLink>
        </div>

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

        <nav
          ref={menuRef}
          id="main-navigation"
          className={`nav ${isMenuOpen ? "open" : ""}`}
          aria-hidden={!isMenuOpen}>
          {combos.map((combo) => (
            <NavLink
              key={combo.id}
              to={`/${combo.id}`}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={closeMenu}>
              {combo.title}
            </NavLink>
          ))}
        </nav>

        {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
      </div>
    </header>
  );
}
