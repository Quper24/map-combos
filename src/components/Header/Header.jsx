// src/components/Header/Header.jsx

import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { COMBOS_BY_VERSION, VERSIONS } from "../../data";

import "./header.css";

export default function Header({ selectedVersion, onVersionChange }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);

  const menuRef = useRef();

  const currentCombos = COMBOS_BY_VERSION[selectedVersion] || [];

  const closeMenu = () => {
    setIsOpen(false);
  };


  const handleVersionChange = (versionId) => {
    onVersionChange(versionId);

    if (location.pathname !== "/") {
      navigate("/");
    }
  };


  useEffect(() => {
    const handler = (event) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [isOpen]);


  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, []);



  return (
    <header className="topbar">

      <div className="topbar-inner">

        {/* Логотип */}
        <div className="logo">
          <NavLink to="/">
            <img
              src="/img/logo.jpg"
              alt="MAP COMBOS"
              className="logo-image"
            />
          </NavLink>
        </div>



        {/* Текущая сборка */}
        <div className="current-combo">

          <div className="current-combo-title">
            {location.pathname !== "/"
              ? currentCombos.find(
                  (item) => `/${item.id}` === location.pathname
                )?.title || "Выбор сборки"
              : "Выбор сборки"}
          </div>


          <div className="current-combo-version">
            {VERSIONS[selectedVersion]?.icon}
            {" "}
            ETS2 {selectedVersion}
          </div>

        </div>



        {/* Кнопка меню */}
        <button
          className="select-button"
          onClick={() => setIsOpen(true)}
        >
          Выбрать ☰
        </button>



        {/* Overlay */}
        {isOpen && (
          <div
            className="menu-overlay"
            onClick={closeMenu}
          />
        )}



        {/* Панель */}
        <aside
          ref={menuRef}
          className={`side-menu ${isOpen ? "open" : ""}`}
        >

          <div className="side-menu-header">
            <h2>Выбор сборки</h2>

            <button onClick={closeMenu}>
              ✕
            </button>
          </div>



          {/* Версии */}

          <section className="menu-section">

            <h3>
              Версия игры
            </h3>


            <div className="version-list">

              {Object.entries(VERSIONS)
                .sort(([a],[b]) => b.localeCompare(a))
                .map(([id, version]) => (

                <button
                  key={id}
                  className={
                    selectedVersion === id
                    ? "active"
                    : ""
                  }
                  onClick={() =>
                    handleVersionChange(id)
                  }
                >

                  {version.icon}

                  <span>
                    {version.label}
                  </span>


                  {selectedVersion === id && (
                    <b>✓</b>
                  )}

                </button>

              ))}

            </div>

          </section>




          {/* Сборки */}

          <section className="menu-section">

            <h3>
              Сборки
            </h3>


            <div className="combo-list">

            {currentCombos.map(combo => (

              <NavLink
                key={combo.id}
                to={`/${combo.id}`}
                onClick={closeMenu}
                className={({isActive}) =>
                  isActive ? "active" : ""
                }
              >

                🚛 {combo.title}

              </NavLink>

            ))}

            </div>

          </section>




          {/* Ссылки */}

          <section className="menu-section">

            <h3>
              Полезные ссылки
            </h3>


            <div className="external-links">

              <a href="#">
                ▶ YouTube
              </a>


              <a href="#">
                ✈ Telegram
              </a>


              <a href="#">
                💎 Boosty
              </a>

            </div>

          </section>



        </aside>


      </div>

    </header>
  );
}