const bookService = require('../services/bookService');

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

  ipcMain.handle('books:uploadCover', async () => {
    return { success: false, error: 'Carga de portada no implementada todavía' };
  });
}

module.exports = { register };
