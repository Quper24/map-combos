import "./comboNavigation.css";

export default function ComboNavigation() {
  const items = [
    {
      id: "install",
      icon: "⚙️",
      title: "Инструкция",
    },
    {
      id: "launcher",
      icon: "🚀",
      title: "DQ Лаунчер",
    },
    {
      id: "profile",
      icon: "📥",
      title: "Авторасстановка модификаций",
    }
  ];


  const scrollToSection = (id) => {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };


  return (
    <nav className="combo-navigation">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => scrollToSection(item.id)}
          className="combo-nav-button">

          <span>{item.icon}</span>
          {item.title}

        </button>
      ))}
    </nav>
  );
}