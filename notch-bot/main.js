const { app, BrowserWindow, screen, ipcMain, nativeTheme } = require('electron');
const path = require('path');

// MacBook notch widths by model (approximate)
const NOTCH_WIDTH = 230;   // safe default — fits Air M2 and all Pro models
const NOTCH_HEIGHT = 38;   // height of the notch pill
const EXPANDED_HEIGHT = 320;

let win;
let expanded = false;

function getNotchBounds() {
  const primary = screen.getPrimaryDisplay();
  const { width } = primary.workAreaSize;
  const scaleFactor = primary.scaleFactor;
  const x = Math.round((primary.bounds.width / scaleFactor - NOTCH_WIDTH) / 2);
  return { x, y: 0, width: NOTCH_WIDTH };
}

function createWindow() {
  const { x, width } = getNotchBounds();

  win = new BrowserWindow({
    x,
    y: 0,
    width,
    height: NOTCH_HEIGHT,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    level: 'screen-saver',        // above everything including full-screen
    hasShadow: false,
    roundedCorners: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    skipTaskbar: true,
    focusable: true,
    visibleOnAllWorkspaces: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setIgnoreMouseEvents(false);
  win.loadFile('renderer.html');

  // Keep it above full-screen apps
  win.setAlwaysOnTop(true, 'screen-saver', 1);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
}

ipcMain.on('expand', () => {
  if (expanded) return;
  expanded = true;
  const { x, width } = getNotchBounds();
  const expandW = 340;
  win.setBounds({ x: x - Math.round((expandW - width) / 2), y: 0, width: expandW, height: EXPANDED_HEIGHT }, true);
});

ipcMain.on('collapse', () => {
  if (!expanded) return;
  expanded = false;
  const { x, width } = getNotchBounds();
  win.setBounds({ x, y: 0, width, height: NOTCH_HEIGHT }, true);
});

ipcMain.on('quit', () => app.quit());

app.whenReady().then(() => {
  // Hide dock icon — pure menu-bar/overlay app
  if (app.dock) app.dock.hide();
  createWindow();
});

app.on('window-all-closed', () => {});   // keep running
