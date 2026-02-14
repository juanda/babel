const authorService = require('../services/authorService');

function ok(data) {
  return { success: true, data };
}

function fail(error) {
  return { success: false, error: error.message || 'Error', details: error.details || null };
}

function register(ipcMain) {
  ipcMain.handle('authors:getAll', async () => ok(authorService.getAll()));
  ipcMain.handle('authors:getById', async (_e, id) => ok(authorService.getById(Number(id))));
  ipcMain.handle('authors:create', async (_e, data) => {
    try {
      return ok(authorService.create(data));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('authors:update', async (_e, id, data) => {
    try {
      return ok(authorService.update(Number(id), data));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('authors:delete', async (_e, id) => {
    try {
      return ok(authorService.remove(Number(id)));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('authors:search', async (_e, query) => ok(authorService.search(query)));
}

module.exports = { register };
