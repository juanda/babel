const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database/db');
const logger = require('./utils/logger');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Mi Biblioteca',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  // System handlers
  ipcMain.handle('system:getAppVersion', () => {
    return { success: true, data: app.getVersion() };
  });

  ipcMain.handle('system:selectFile', async (_event, options) => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options?.filters || [],
    });
    if (result.canceled) {
      return { success: false, error: 'Selección cancelada' };
    }
    return { success: true, data: result.filePaths[0] };
  });

  ipcMain.handle('system:getConfig', async () => {
    try {
      const configPath = path.join(app.getPath('userData'), 'config.json');
      if (!fs.existsSync(configPath)) {
        return { success: true, data: {} };
      }
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return { success: true, data: parsed };
    } catch (error) {
      return { success: false, error: error.message || 'No se pudo cargar configuración' };
    }
  });

  ipcMain.handle('system:setConfig', async (_event, key, value) => {
    try {
      const configPath = path.join(app.getPath('userData'), 'config.json');
      const current = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf-8')) : {};
      current[key] = value;
      fs.writeFileSync(configPath, JSON.stringify(current, null, 2));
      return { success: true, data: current };
    } catch (error) {
      return { success: false, error: error.message || 'No se pudo guardar configuración' };
    }
  });

  ipcMain.handle('system:backup', async () => {
    return { success: false, error: 'Backup no implementado todavía' };
  });

  ipcMain.handle('system:restore', async () => {
    return { success: false, error: 'Restore no implementado todavía' };
  });

  ipcMain.handle('system:importData', async () => {
    return { success: false, error: 'Importación no implementada todavía' };
  });

  // Load module-specific handlers
  require('./ipc/authors').register(ipcMain);
  require('./ipc/books').register(ipcMain);
  require('./ipc/loans').register(ipcMain);
  require('./ipc/users').register(ipcMain);
  require('./ipc/reading').register(ipcMain);
  require('./ipc/reports').register(ipcMain);
  require('./ipc/collections').register(ipcMain);
}

app.whenReady().then(() => {
  logger.initialize();
  logger.info('Aplicación iniciando...');

  db.initialize();
  registerIpcHandlers();
  createWindow();

  // Verificar préstamos vencidos al inicio y cada hora
  const loanService = require('./services/loanService');
  loanService.updateOverdueStatuses();
  setInterval(() => loanService.updateOverdueStatuses(), 60 * 60 * 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  db.close();
  logger.close();
});
