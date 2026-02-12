// C:\Quper-projects\map-combos\src\App.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home/Home";
import Combo from "./pages/Combo/Combo";
import ServerGuide from "./pages/ServerGuide/ServerGuide"; // Импортируем новую страницу
import Header from "./components/Header/Header";
import "./App.css";

export default function App() {
  const location = useLocation();
  // Страницы, на которых не показываем Header
  const hideHeaderPages = ["/"];
  const shouldShowHeader = !hideHeaderPages.includes(location.pathname);

  // Состояние для выбранной версии
  const [selectedVersion, setSelectedVersion] = useState(() => {
    const saved = localStorage.getItem("mapCombos_selectedVersion");
    return saved || "1.58";
  });

  // Сохраняем версию в localStorage при изменении
  useEffect(() => {
    localStorage.setItem("mapCombos_selectedVersion", selectedVersion);
  }, [selectedVersion]);

  return (
    <>
      {shouldShowHeader && (
        <Header
          selectedVersion={selectedVersion}
          onVersionChange={setSelectedVersion}
        />
      )}
      <Routes>
        <Route
          path="/"
          element={
            <Home
              selectedVersion={selectedVersion}
              onVersionChange={setSelectedVersion}
            />
          }
        />
        <Route path="/:slug" element={<Combo />} />
        {/* Добавляем новый маршрут для инструкции */}
        <Route path="/server-guide" element={<ServerGuide />} />
      </Routes>
    </>
  );
}
