import { useEffect, useState, useRef } from "react";

function App() {
  const [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [paused, setPaused] = useState(false);
  const prevStats = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://127.0.0.1:8000/stats")
        .then((res) => res.json())
        .then((data) => {
          prevStats.current = stats;
          setStats(data);
          setConnected(true);
        })
        .catch(() => setConnected(false));

      fetch("http://127.0.0.1:8000/tracker-status")
        .then((res) => res.json())
        .then((data) => setPaused(data.paused))
        .catch(() => {});
    }, 1000);

    return () => clearInterval(interval);
  }, [stats]);

  const handleReset = () => {
    setIsResetting(true);
    fetch("http://127.0.0.1:8000/reset", { method: "POST" })
      .then(() => {
        setTimeout(() => setIsResetting(false), 600);
      })
      .catch((err) => {
        console.error(err);
        setIsResetting(false);
      });
  };

  const handleToggle = () => {
    const endpoint = paused ? "/resume" : "/pause";
    fetch(`http://127.0.0.1:8000${endpoint}`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => setPaused(data.paused))
      .catch(console.error);
  };

  if (!stats) {
    return (
      <div className="app-wrapper flex-center">
        <div className="loading-state">
          <div className="loader"></div>
          <p className="loading-text">
            {connected ? "Loading dashboard..." : "Waiting for backend..."}
          </p>
          <p className="loading-subtext">
            Make sure the tracker is running
          </p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  const maxKeyCount = Math.max(...stats.top_keys.map(([, count]) => count), 1);

  const getWpmLevel = (wpm) => {
    if (wpm >= 80) return { label: "Blazing", color: "#f59e0b" };
    if (wpm >= 60) return { label: "Fast", color: "#22d3ee" };
    if (wpm >= 40) return { label: "Average", color: "#38bdf8" };
    if (wpm >= 20) return { label: "Learning", color: "#a78bfa" };
    return { label: "Warming Up", color: "#94a3b8" };
  };

  const wpmLevel = getWpmLevel(stats.wpm);

  const formatKey = (key) => {
    if (key === " ") return "Space";
    if (key.startsWith("Key.")) return key.replace("Key.", "").charAt(0).toUpperCase() + key.replace("Key.", "").slice(1);
    return key;
  };

  return (
    <div className="app-wrapper">
      <div className="dashboard">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="app-icon">⌨</div>
            <div>
              <h1 className="title">Keyboard Analyzer</h1>
              <p className="subtitle">Real-time typing metrics</p>
            </div>
          </div>
          <div className={`status-badge ${connected ? "online" : "offline"}`}>
            <span className="status-dot"></span>
            {connected ? "Live" : "Offline"}
          </div>
        </header>

        {/* Main WPM Display */}
        <div className="wpm-hero">
          <div className="wpm-number">{stats.wpm}</div>
          <div className="wpm-unit">WPM</div>
          <div className="wpm-level" style={{ color: wpmLevel.color }}>
            {wpmLevel.label}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-info">
              <span className="stat-value" style={{
                color: stats.accuracy >= 95 ? "#4ade80" : stats.accuracy >= 85 ? "#fbbf24" : "#f87171"
              }}>
                {stats.accuracy}%
              </span>
              <span className="stat-label">Accuracy</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-info">
              <span className="stat-value">{stats.total_keys.toLocaleString()}</span>
              <span className="stat-label">Keystrokes</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <span className="stat-value" style={{
                color: stats.error_rate > 10 ? "#f87171" : stats.error_rate > 5 ? "#fbbf24" : "#4ade80"
              }}>
                {stats.error_rate}%
              </span>
              <span className="stat-label">Error Rate</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <span className="stat-value">{stats.duration_minutes}</span>
              <span className="stat-label">Minutes</span>
            </div>
          </div>
        </div>

        {/* Top Keys */}
        <div className="section">
          <h3 className="section-title">
            <span className="section-icon">🔥</span>
            Most Used Keys
          </h3>
          <div className="keys-list">
            {stats.top_keys.map(([keyName, count], index) => {
              const percentage = (count / maxKeyCount) * 100;
              const barColors = [
                "linear-gradient(90deg, #38bdf8, #818cf8)",
                "linear-gradient(90deg, #818cf8, #c084fc)",
                "linear-gradient(90deg, #c084fc, #f472b6)",
                "linear-gradient(90deg, #f472b6, #fb923c)",
                "linear-gradient(90deg, #fb923c, #fbbf24)",
              ];
              return (
                <div className="key-row" key={keyName}>
                  <div className="key-rank">#{index + 1}</div>
                  <div className="key-cap">{formatKey(keyName)}</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${percentage}%`,
                        background: barColors[index] || barColors[0]
                      }}
                    ></div>
                  </div>
                  <div className="key-count">{count.toLocaleString()}</div>
                </div>
              );
            })}
            {stats.top_keys.length === 0 && (
              <p className="empty-state">Start typing to see data...</p>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="btn-row">
          <button
            className={`control-btn toggle-btn ${paused ? "stopped" : "running"}`}
            onClick={handleToggle}
            id="toggle-button"
          >
            {paused ? "▶  Start Tracking" : "⏸  Stop Tracking"}
          </button>
          <button
            className={`control-btn reset-btn ${isResetting ? "resetting" : ""}`}
            onClick={handleReset}
            disabled={isResetting}
            id="reset-button"
          >
            {isResetting ? "Resetting..." : "🗑️  Reset"}
          </button>
        </div>

        {/* Paused Banner */}
        {paused && (
          <div className="paused-banner">
            Tracking paused — keystrokes are not being recorded
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <span>Runs silently in your system tray</span>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
  }

  body {
    background-color: #0a0e1a;
    overflow: hidden;
  }

  .app-wrapper {
    min-height: 100vh;
    background: #0a0e1a;
    background-image:
      radial-gradient(ellipse at 20% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(129, 140, 248, 0.06) 0%, transparent 50%);
    font-family: 'Inter', sans-serif;
    color: #f8fafc;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 24px;
    overflow-y: auto;
  }

  .flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Loading state */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .loader {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(56, 189, 248, 0.15);
    border-bottom-color: #38bdf8;
    border-radius: 50%;
    animation: rotation 0.8s linear infinite;
  }

  .loading-text {
    font-size: 1rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .loading-subtext {
    font-size: 0.8rem;
    color: #64748b;
  }

  @keyframes rotation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Dashboard */
  .dashboard {
    width: 100%;
    max-width: 560px;
    background: rgba(15, 20, 35, 0.7);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 28px;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.03),
      0 20px 60px -15px rgba(0, 0, 0, 0.5);
    animation: fadeIn 0.5s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .app-icon {
    width: 42px;
    height: 42px;
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    box-shadow: 0 4px 15px rgba(56, 189, 248, 0.25);
  }

  .title {
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #f8fafc, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 500;
    margin-top: 2px;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 99px;
    user-select: none;
  }

  .status-badge.online {
    color: #4ade80;
    background: rgba(74, 222, 128, 0.1);
    border: 1px solid rgba(74, 222, 128, 0.15);
  }

  .status-badge.offline {
    color: #f87171;
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.15);
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    animation: pulse 1.5s infinite ease-in-out;
  }

  .online .status-dot {
    background: #4ade80;
    box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
  }

  .offline .status-dot {
    background: #f87171;
    box-shadow: 0 0 8px rgba(248, 113, 113, 0.6);
  }

  @keyframes pulse {
    0%, 100% { transform: scale(0.85); opacity: 0.6; }
    50% { transform: scale(1.15); opacity: 1; }
  }

  /* WPM Hero */
  .wpm-hero {
    text-align: center;
    padding: 20px 0 28px;
    position: relative;
  }

  .wpm-number {
    font-size: 4.5rem;
    font-weight: 800;
    font-family: 'JetBrains Mono', monospace;
    background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    letter-spacing: -3px;
    text-shadow: none;
    filter: drop-shadow(0 0 30px rgba(56, 189, 248, 0.2));
  }

  .wpm-unit {
    font-size: 0.85rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 4px;
    margin-top: 4px;
  }

  .wpm-level {
    font-size: 0.8rem;
    font-weight: 600;
    margin-top: 8px;
    letter-spacing: 0.5px;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 14px;
    padding: 14px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
  }

  .stat-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }

  .stat-icon {
    font-size: 1.2rem;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    color: #f8fafc;
  }

  .stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #64748b;
    font-weight: 600;
  }

  /* Sections */
  .section {
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 14px;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-icon {
    font-size: 1rem;
  }

  /* Keys List */
  .keys-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .key-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
    transition: transform 0.15s ease;
  }

  .key-row:hover {
    transform: translateX(4px);
  }

  .key-rank {
    font-size: 0.7rem;
    color: #475569;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    width: 24px;
    text-align: center;
  }

  .key-cap {
    min-width: 56px;
    max-width: 100px;
    text-align: center;
    background: linear-gradient(180deg, #2a3040, #1e2530);
    padding: 5px 10px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    font-weight: 600;
    color: #e2e8f0;
    box-shadow: 0 3px 0 #151a25, 0 0 0 1px rgba(255, 255, 255, 0.06);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-track {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 3px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .key-count {
    width: 48px;
    text-align: right;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    color: #64748b;
  }

  .empty-state {
    text-align: center;
    color: #475569;
    padding: 24px 0;
    font-style: italic;
    font-size: 0.85rem;
  }

  /* Button Row */
  .btn-row {
    display: flex;
    gap: 10px;
  }

  .control-btn {
    flex: 1;
    padding: 14px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all 0.25s ease;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .control-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Toggle Button */
  .toggle-btn.running {
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.2);
  }

  .toggle-btn.running:hover {
    background: rgba(251, 191, 36, 0.18);
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.1);
  }

  .toggle-btn.stopped {
    background: rgba(74, 222, 128, 0.1);
    color: #4ade80;
    border-color: rgba(74, 222, 128, 0.2);
  }

  .toggle-btn.stopped:hover {
    background: rgba(74, 222, 128, 0.18);
    box-shadow: 0 0 20px rgba(74, 222, 128, 0.1);
  }

  /* Reset Button */
  .reset-btn {
    background: rgba(255, 255, 255, 0.04);
    color: #94a3b8;
  }

  .reset-btn:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.25);
    box-shadow: 0 0 25px rgba(239, 68, 68, 0.1);
  }

  /* Paused Banner */
  .paused-banner {
    text-align: center;
    margin-top: 12px;
    padding: 10px;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.08);
    border: 1px solid rgba(251, 191, 36, 0.15);
    animation: fadeIn 0.3s ease;
  }

  /* Footer */
  .footer {
    text-align: center;
    margin-top: 16px;
    font-size: 0.7rem;
    color: #334155;
    font-weight: 500;
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

export default App;