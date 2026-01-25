import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Combo from "./pages/Combo";
import Header from "./components/Header";

import "./App.css";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:slug" element={<Combo />} />
      </Routes>
    </>
  );
}
