import React, { useState, useRef } from "react";
import InstructionModal from "./InstructionModal";
import "./AutoProfileInstall.css";

export default function AutoProfileInstall({ combo }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [decodedText, setDecodedText] = useState("");
  const [updatedText, setUpdatedText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [includeMods, setIncludeMods] = useState(false);

  const API_BASE = "https://api.qupersimulator.ru";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 300 * 1024) {
        alert("Файл слишком большой. Максимальный размер 300 КБ.");
        e.target.value = "";
        setSelectedFile(null);
        setStatus("idle");
        return;
      }
      setSelectedFile(file);
      setStatus("uploaded");
      setDecodedText("");
      setUpdatedText("");
      setErrorMsg("");
    } else {
      setSelectedFile(null);
      setStatus("idle");
    }
  };

  const handleDecode = async () => {
    if (!selectedFile) {
      alert("Пожалуйста, выберите файл profile.sii");
      return;
    }
    setStatus("decoding");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_BASE}/api/decode`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка декодирования");
      }

      setDecodedText(data.decodedText);
      setStatus("decoded");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  const handleApply = async () => {
    if (!decodedText) {
      alert("Сначала декодируйте файл");
      return;
    }
    setStatus("applying");
    setErrorMsg("");

    try {
      const modsResponse = await fetch(
        `/profiles/${combo.version_game}/${combo.id}${includeMods ? "m" : ""}.txt`,
      );
      if (!modsResponse.ok) {
        throw new Error(
          `Файл модов для combo.id "${combo.id}" не найден (404)`,
        );
      }
      const newModsBlock = await modsResponse.text();

      const updated = replaceActiveMods(decodedText, newModsBlock);
      setUpdatedText(updated);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  function replaceActiveMods(originalText, newModsBlock) {
    const lines = originalText.split("\n");
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("active_mods:")) {
        startIndex = i;
        break;
      }
    }
    if (startIndex === -1) {
      throw new Error('Строка "active_mods:" не найдена в файле');
    }

    for (let i = startIndex + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith("active_mods[")) {
        continue;
      } else {
        endIndex = i;
        break;
      }
    }
    if (endIndex === -1) {
      endIndex = lines.length;
    }

    const before = lines.slice(0, startIndex).join("\n");
    const after = lines.slice(endIndex).join("\n");

    return before + "\n" + newModsBlock + "\n" + after;
  }

  const handleDownload = () => {
    if (!updatedText) return;
    const blob = new Blob([updatedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "profile.sii";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusClass = () => {
    if (status === "error") return "status-error";
    if (status === "done") return "status-done";
    if (status === "decoding" || status === "applying") return "status-loading";
    return "status-idle";
  };

  const renderStatusText = () => {
    switch (status) {
      case "idle":
        return "Ожидание файла";
      case "uploaded":
        return "Файл загружен";
      case "decoding":
        return "Декодируется...";
      case "decoded":
        return "Декодирован";
      case "applying":
        return "Применяется...";
      case "done":
        return "Готово!";
      case "error":
        return `❌ Ошибка: ${errorMsg}`;
      default:
        return "";
    }
  };

  // Форматируем размер файла
  const getFileSize = () => {
    if (!selectedFile) return "";
    return `(${(selectedFile.size / 1024).toFixed(0)} КБ)`;
  };

  return (
    <div className="auto-profile-install">
      <button
        className="auto-profile-instruction"
        onClick={() => setIsModalOpen(true)}>
        📖 Инструкция
      </button>

      <div className="auto-profile-content">
        <div className="toolbar">
          {/* Шаг 1 – Выбор файла */}
          <div className="toolbar-item">
            <span className="toolbar-label">1. Файл</span>
            <input
              type="file"
              accept=".sii"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: "none" }}
              id="file-input"
            />
            <button
              className="toolbar-btn file-btn"
              onClick={() => fileInputRef.current?.click()}>
              {selectedFile
                ? `${selectedFile.name} ${getFileSize()}`
                : "Выбрать"}
            </button>
          </div>

          {/* Шаг 2 – Декодировать */}
          <div className="toolbar-item">
            <span className="toolbar-label">2. Декодировать</span>
            <button
              className="toolbar-btn action-btn"
              onClick={handleDecode}
              disabled={status === "decoding" || !selectedFile}>
              {status === "decoding" ? "..." : "Декодировать"}
            </button>
          </div>

          {/* Шаг 3 – Применить */}
          <div className="toolbar-item">
            <span className="toolbar-label">3. Применить</span>

            <div className="apply-block">
              <button
                className="toolbar-btn action-btn"
                onClick={handleApply}
                disabled={status !== "decoded"}>
                Применить
              </button>

              {combo.mods && (
                <label className="mods-checkbox">
                  <input
                    type="checkbox"
                    checked={includeMods}
                    onChange={(e) => setIncludeMods(e.target.checked)}
                  />
                  <span>
                    {combo.tags.includes("server")
                      ? "Основные + опциональные"
                      : "Карты + Моды"}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Шаг 4 – Скачать */}
          <div className="toolbar-item">
            <span className="toolbar-label">4. Скачать</span>
            <button
              className="toolbar-btn action-btn"
              onClick={handleDownload}
              disabled={status !== "done"}>
              Скачать
            </button>
          </div>
        </div>

        {/* Статус – под тулбаром, но компактно */}
        <div className={`status ${getStatusClass()}`}>
          Статус: {renderStatusText()}
        </div>

        {/* combo.id – мелко справа */}
        <div className="combo-id">combo: {combo.id}</div>
      </div>

      <InstructionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
