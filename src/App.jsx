import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home/Home";
import Combo from "./pages/Combo/Combo";
import Header from "./components/Header/Header";
import "./App.css";

export default function App() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <>
      {!isHomePage && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:slug" element={<Combo />} />
      </Routes>
    </>
  );
}
