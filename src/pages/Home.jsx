import { combos } from "../data/combos";
import ComboCard from "../components/ComboCard";

export default function Home() {
  return (
    <div className="container">
      <header className="home-header">
        <h1>MAP COMBOS</h1>
        <p className="home-subtitle">Сборки карт для Euro Truck Simulator 2</p>
      </header>

      <div className="combos-grid">
        {combos.map((combo) => (
          <ComboCard key={combo.id} combo={combo} />
        ))}
      </div>

      <div className="home-info">
        <div className="notice">
          <strong>ℹ️ Информация:</strong> Все сборки проверены и обновляются
          регулярно. Для работы требуются все DLC карт.
        </div>
      </div>
    </div>
  );
}
