const collectionService = require('../services/collectionService');

function ok(data) {
  return { success: true, data };
}

function fail(error) {
  return { success: false, error: error.message || 'Error', details: error.details || null };
}

function register(ipcMain) {
  ipcMain.handle('collections:getAll', async () => ok(collectionService.getAll()));
  ipcMain.handle('collections:getById', async (_e, id) => ok(collectionService.getById(Number(id))));
  ipcMain.handle('collections:create', async (_e, data) => {
    try {
      return ok(collectionService.create(data));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('collections:update', async (_e, id, data) => {
    try {
      return ok(collectionService.update(Number(id), data || {}));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('collections:delete', async (_e, id) => {
    try {
      return ok(collectionService.remove(Number(id)));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('collections:addBook', async (_e, collectionId, bookId) => ok(collectionService.addBook(Number(collectionId), Number(bookId))));
  ipcMain.handle('collections:removeBook', async (_e, collectionId, bookId) => ok(collectionService.removeBook(Number(collectionId), Number(bookId))));
  ipcMain.handle('collections:getBooks', async (_e, collectionId) => ok(collectionService.getBooks(Number(collectionId))));
}

module.exports = { register };
