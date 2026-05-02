# Keyboard Analyzer

A sleek desktop application that runs silently in the background, tracking your real-time typing speed (WPM), accuracy, error rate, and most-used keys.

![Dashboard Preview](https://img.shields.io/badge/Platform-Windows-blue?style=for-the-badge&logo=windows)
![License](https://img.shields.io/badge/License-ISC-green?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-purple?style=for-the-badge)

---

##  Features

- **Real-time WPM tracking** — see your typing speed update live
- **Accuracy & Error Rate** — calculated from backspace usage
- **Most Used Keys** — top 5 keys with visual frequency bars
- **System Tray** — runs silently in the background, minimizes to tray on close
- **Session Duration** — tracks how long you've been typing
- **One-click Reset** — clear all data and start fresh

---

##  Quick Install (For Users)

> **Just download and run.**

### Step 1: Download
Download the latest **`Keyboard Analyzer Setup 1.0.0.exe`** from the [Releases](https://github.com/ShlokRathi29/Keyboard_analysier/releases) page.

### Step 2: Install
1. Double-click the downloaded `.exe` file
2. If Windows SmartScreen pops up → Click **"More info"** → **"Run anyway"**
3. The app installs automatically and creates a Desktop shortcut

### Step 3: Run
1. Click the **Keyboard Analyzer** shortcut on your Desktop
2. The app opens and starts tracking your keystrokes immediately
3. Just keep typing normally — stats update every second!

### Step 4: Using the App
| Action | How |
|---|---|
| **View Stats** | Open the app window from the desktop shortcut or system tray |
| **Minimize** | Click the X button — app keeps running in the system tray |
| **Restore** | Double-click the keyboard icon in the system tray (bottom-right) |
| **Quit** | Right-click the tray icon → **Quit** |
| **Reset Data** | Click the "Reset All Data" button in the dashboard |

**Note:** Your antivirus may flag this app because it monitors keyboard input. This is expected — the app only tracks key counts locally on your PC and never sends data anywhere. You may need to whitelist it.

---

## Build From Source (For Developers)

If you want to build the app yourself or contribute:

### Prerequisites

- **Python 3.10+** — [python.org](https://www.python.org/downloads/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **Git** — [git-scm.com](https://git-scm.com/)

### Step 1: Clone the Repo

```bash
git clone https://github.com/ShlokRathi29/Keyboard_analysier.git
cd Keyboard_analysier
```

### Step 2: Install Python Dependencies

```bash
pip install pynput fastapi uvicorn pyinstaller
```

### Step 3: Install Node Dependencies

```bash
cd ui
npm install
cd ../desktop
npm install
cd ..
```

### Step 4: Build Backend Executables

```bash
pyinstaller --onefile --noconsole --name main main.py
pyinstaller --onefile --noconsole --name api --hidden-import uvicorn.logging --hidden-import uvicorn.protocols.http --hidden-import uvicorn.protocols.http.auto --hidden-import uvicorn.protocols.http.h11_impl --hidden-import uvicorn.protocols.websockets --hidden-import uvicorn.protocols.websockets.auto --hidden-import uvicorn.lifespan --hidden-import uvicorn.lifespan.on --hidden-import uvicorn.lifespan.off --hidden-import fastapi --hidden-import starlette --hidden-import anyio --hidden-import anyio._backends --hidden-import anyio._backends._asyncio api.py
```

This creates `main.exe` and `api.exe` inside the `dist/` folder.

> After building, you can delete the auto-generated `build/`, `*.spec` files.

### Step 5: Build the UI

```bash
cd ui
npm run build
cd ..
```

### Step 6: Run in Dev Mode

```bash
cd desktop
npm start
```

### Step 7: Build the Installer

```bash
cd desktop
npm run build
```

The installer will be at: `desktop/release/Keyboard Analyzer Setup 1.0.0.exe`

---

## Project Structure

```
Keyboard_analysier/
├── main.py              # Keystroke tracker (pynput) — runs in background
├── api.py               # FastAPI server — serves stats on localhost:8000
├── ui/                  # React dashboard (Vite)
│   ├── src/
│   │   ├── App.jsx      # Main dashboard UI
│   │   └── main.jsx     # React entry point
│   └── public/          # Static assets
├── desktop/             # Electron shell
│   ├── main.js          # Electron main process (tray, window, backend)
│   ├── icon.png         # App icon
│   └── package.json     # Electron & builder config
└── .gitignore
```

---

## How It Works

1. **`main.exe`** — Listens to all keyboard input using `pynput` and saves each keystroke (key + timestamp) to a SQLite database at `%APPDATA%/KeyboardAnalyzer/keystrokes.db`
2. **`api.exe`** — Runs a FastAPI server on `localhost:8000` that reads the database and calculates WPM, accuracy, error rate, and top keys
3. **Electron** — Opens a window showing the React dashboard, which polls the API every second for live stats
4. **System Tray** — The app minimizes to tray instead of closing, so tracking continues silently

---

## Stats Explained

| Metric | How It's Calculated |
|---|---|
| **WPM** | (Total characters ÷ 5) ÷ minutes elapsed |
| **Accuracy** | 100% − Error Rate |
| **Error Rate** | (Backspace presses ÷ Total keystrokes) × 100 |
| **Keystrokes** | Total key presses recorded |
| **Duration** | Time between first and last keystroke |

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/cool-feature`)
3. Commit your changes (`git commit -m 'Add cool feature'`)
4. Push to the branch (`git push origin feature/cool-feature`)
5. Open a Pull Request

---

##  License

ISC License — free to use, modify, and distribute.

---

## Author

**Shlok Rathi** — [GitHub](https://github.com/ShlokRathi29)
