import { NavLink, useLocation } from "react-router-dom";
import { combos } from "../data/combos";

export default function Header() {
  const location = useLocation();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="logo">
          <NavLink
            to="/"
            style={{
              fontWeight: "bold",
              fontSize: "16px",
              letterSpacing: "0.5px",
            }}>
            ГЛАВНАЯ
          </NavLink>
        </div>

        <nav className="nav">
          {combos.map((combo) => {
            const isActive = location.pathname === `/${combo.id}`;
            return (
              <NavLink
                key={combo.id}
                to={`/${combo.id}`}
                className={({ isActive }) => (isActive ? "active" : "")}
                style={({ isActive }) => ({
                  fontWeight: isActive ? "600" : "400",
                  border: isActive
                    ? "1px solid rgba(77, 163, 255, 0.5)"
                    : "1px solid transparent",
                })}>
                {combo.title}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
