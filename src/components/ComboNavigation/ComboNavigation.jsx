import "./comboNavigation.css";

export default function ComboNavigation() {
  const items = [
    {
      id: "links",
      icon: "🔗",
      title: "Ссылки",
    },
    {
      id: "install",
      icon: "⚙️",
      title: "Установка",
    },
    {
      id: "launcher",
      icon: "🚀",
      title: "Лаунчер",
    },
    {
      id: "profile",
      icon: "📥",
      title: "Профиль модов",
    },
    {
      id: "images",
      icon: "🖼️",
      title: "Порядок модов",
    },
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