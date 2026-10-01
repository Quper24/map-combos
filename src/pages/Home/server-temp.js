<div className="quper-servers-compact">
  <div
    className="servers-header-compact"
    onClick={() => setServersExpanded(!serversExpanded)}>
    <div className="servers-title-compact">
      <span className="servers-icon">🚛</span>
      <span className="servers-name">Сервера Quper Simulator</span>
      {!serversExpanded && serverStats.total_players > 0 && (
        <span className="players-badge">
          В сети {serverStats.total_players} игр.
        </span>
      )}
    </div>
    <div className="servers-toggle">
      <span className={`toggle-icon ${serversExpanded ? "expanded" : ""}`}>
        {serversExpanded ? "▼" : "▶"}
      </span>
    </div>
  </div>

  {serversExpanded && (
    <div className="servers-content">
      {serverStats.loading ? (
        <div className="servers-loading">⏳ Загрузка...</div>
      ) : serverStats.error ? (
        <div className="servers-error">⚠️ {serverStats.error}</div>
      ) : (
        <>
          <div className="total-players-compact">
            Всего: <strong>{serverStats.total_players}</strong> игроков
          </div>
          <div className="servers-list-compact">
            {/* ETS2 Main */}
            <div
              className="server-row"
              onMouseEnter={() => setHoveredServer("ets2_main")}
              onMouseLeave={() => setHoveredServer(null)}>
              <span className="server-icon">🚛</span>
              <span className="server-name">ETS2 Main</span>
              <div className="server-status-info">
                <span
                  className={`status-dot ${getServerStatusText(serverStats.servers.ets2_main).class}`}></span>
                <span className="status-text">
                  {getServerStatusText(serverStats.servers.ets2_main).text}
                </span>
              </div>
              <span className="players-count-compact">
                {serverStats.servers.ets2_main?.players || 0}
              </span>
              {/* Всплывающая подсказка со списком игроков */}
              {hoveredServer === "ets2_main" &&
                serverStats.servers.ets2_main?.players_list?.length > 0 && (
                  <div className="players-tooltip">
                    <div className="tooltip-title">👥 Игроки онлайн:</div>
                    <div className="tooltip-list">
                      {serverStats.servers.ets2_main.players_list.map(
                        (player, idx) => (
                          <div key={idx} className="tooltip-player">
                            {player}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* ETS2 Light */}
            <div
              className="server-row"
              onMouseEnter={() => setHoveredServer("ets2_light")}
              onMouseLeave={() => setHoveredServer(null)}>
              <span className="server-icon">🚚</span>
              <span className="server-name">ETS2 Light</span>
              <div className="server-status-info">
                <span
                  className={`status-dot ${getServerStatusText(serverStats.servers.ets2_light).class}`}></span>
                <span className="status-text">
                  {getServerStatusText(serverStats.servers.ets2_light).text}
                </span>
              </div>
              <span className="players-count-compact">
                {serverStats.servers.ets2_light?.players || 0}
              </span>
              {hoveredServer === "ets2_light" &&
                serverStats.servers.ets2_light?.players_list?.length > 0 && (
                  <div className="players-tooltip">
                    <div className="tooltip-title">👥 Игроки онлайн:</div>
                    <div className="tooltip-list">
                      {serverStats.servers.ets2_light.players_list.map(
                        (player, idx) => (
                          <div key={idx} className="tooltip-player">
                            {player}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* ATS */}
            <div
              className="server-row"
              onMouseEnter={() => setHoveredServer("ats")}
              onMouseLeave={() => setHoveredServer(null)}>
              <span className="server-icon">⭐</span>
              <span className="server-name">ATS</span>
              <div className="server-status-info">
                <span
                  className={`status-dot ${getServerStatusText(serverStats.servers.ats).class}`}></span>
                <span className="status-text">
                  {getServerStatusText(serverStats.servers.ats).text}
                </span>
              </div>
              <span className="players-count-compact">
                {serverStats.servers.ats?.players || 0}
              </span>
              {hoveredServer === "ats" &&
                serverStats.servers.ats?.players_list?.length > 0 && (
                  <div className="players-tooltip">
                    <div className="tooltip-title">👥 Игроки онлайн:</div>
                    <div className="tooltip-list">
                      {serverStats.servers.ats.players_list.map(
                        (player, idx) => (
                          <div key={idx} className="tooltip-player">
                            {player}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
          {serverStats.lastUpdate && (
            <div className="servers-update-compact">
              🔄 Обновлено:{" "}
              {new Date(serverStats.lastUpdate).toLocaleString("ru-RU")}
            </div>
          )}
        </>
      )}
    </div>
  )}
</div>;
