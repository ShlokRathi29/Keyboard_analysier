const { app, BrowserWindow, Tray, Menu, nativeImage } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

let mainWindow;
let tray;
let trackerProcess;
let apiProcess;
let isQuitting = false;

function getBackendPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "backend")
    : path.join(__dirname, "..", "dist");
}

function getUIPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "ui")
    : path.join(__dirname, "..", "ui", "dist");
}

function startBackend() {
  const backendPath = getBackendPath();
  const tracker = path.join(backendPath, "main.exe");
  const api = path.join(backendPath, "api.exe");

  console.log("Backend path:", backendPath);

  if (fs.existsSync(tracker)) {
    trackerProcess = spawn(tracker, { cwd: backendPath, windowsHide: true });
    trackerProcess.stdout.on("data", (d) => console.log(`TRACKER: ${d}`));
    trackerProcess.stderr.on("data", (d) => console.error(`TRACKER ERR: ${d}`));
    trackerProcess.on("error", (err) => console.error("Tracker failed:", err));
  } else {
    console.error("Tracker exe not found:", tracker);
  }

  if (fs.existsSync(api)) {
    apiProcess = spawn(api, { cwd: backendPath, windowsHide: true });
    apiProcess.stdout.on("data", (d) => console.log(`API: ${d}`));
    apiProcess.stderr.on("data", (d) => console.error(`API ERR: ${d}`));
    apiProcess.on("error", (err) => console.error("API failed:", err));
  } else {
    console.error("API exe not found:", api);
  }
}

function killBackend() {
  if (trackerProcess) {
    try { process.kill(trackerProcess.pid); } catch (e) {}
    trackerProcess = null;
  }
  if (apiProcess) {
    try { process.kill(apiProcess.pid); } catch (e) {}
    apiProcess = null;
  }
}

function createTray() {
  // Create a simple 16x16 tray icon
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "icon.png")
    : path.join(__dirname, "icon.png");

  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    // Fallback: create a simple colored icon
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip("Keyboard Analyzer — Running");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Dashboard",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 640,
    height: 720,
    minWidth: 500,
    minHeight: 600,
    frame: true,
    resizable: true,
    icon: app.isPackaged
      ? path.join(process.resourcesPath, "icon.png")
      : path.join(__dirname, "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: "#0a0e1a",
    show: false,
  });

  // Load UI
  const uiPath = getUIPath();
  const indexFile = path.join(uiPath, "index.html");
  console.log("Loading UI from:", indexFile);

  if (fs.existsSync(indexFile)) {
    mainWindow.loadFile(indexFile);
  } else {
    mainWindow.loadURL("data:text/html,<h2 style='color:white;background:#0a0e1a;padding:40px;font-family:sans-serif'>UI not built. Run: cd ui && npm run build</h2>");
  }

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Minimize to tray instead of closing
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    startBackend();
    createTray();
    createWindow();
  });
}

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("will-quit", () => {
  killBackend();
  if (tray) tray.destroy();
});

// Keep app running when all windows are closed (tray mode)
app.on("window-all-closed", () => {
  // Do nothing — app stays alive in tray
});