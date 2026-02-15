const bookService = require('../services/bookService');
const externalBookService = require('../services/externalBookService');
const labelPrintService = require('../services/labelPrintService');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

function ok(data) {
  return { success: true, data };
}

function fail(error) {
  return { success: false, error: error.message || 'Error', details: error.details || null };
}

function register(ipcMain) {
  ipcMain.handle('books:getAll', async (_e, filters) => ok(bookService.getAll(filters || {})));
  ipcMain.handle('books:getById', async (_e, id) => ok(bookService.getById(Number(id))));
  ipcMain.handle('books:create', async (_e, data) => {
    try {
      return ok(bookService.create(data));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('books:update', async (_e, id, data) => {
    try {
      return ok(bookService.update(Number(id), data));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('books:delete', async (_e, id) => {
    try {
      return ok(bookService.remove(Number(id)));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('books:search', async (_e, query) => ok(bookService.search(query)));
  ipcMain.handle('books:searchExternal', async (_e, query, options) => {
    try {
      return ok(await externalBookService.searchBooks(query, options || {}));
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle('books:printLabels', async (_e, payload) => {
    try {
      return ok(await labelPrintService.printLabels(payload || {}));
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle('books:uploadCover', async (_e, filePath) => {
    try {
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Archivo de portada inválido');
      }

      const srcPath = path.resolve(filePath);
      if (!fs.existsSync(srcPath)) {
        throw new Error('El archivo seleccionado no existe');
      }

      const ext = path.extname(srcPath).toLowerCase();
      const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
      if (!allowed.has(ext)) {
        throw new Error('Formato de imagen no soportado');
      }

      const coversDir = path.join(app.getPath('userData'), 'covers');
      fs.mkdirSync(coversDir, { recursive: true });

      const fileName = `cover_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`;
      const destPath = path.join(coversDir, fileName);
      fs.copyFileSync(srcPath, destPath);

      return ok(`file://${destPath}`);
    } catch (error) {
      return fail(error);
    }
  });
}

module.exports = { register };
