const userService = require('../services/userService');

function ok(data) {
  return { success: true, data };
}

function fail(error) {
  return { success: false, error: error.message || 'Error', details: error.details || null };
}

function register(ipcMain) {
  ipcMain.handle('users:getAll', async () => ok(userService.getAll()));
  ipcMain.handle('users:getById', async (_e, id) => ok(userService.getById(Number(id))));
  ipcMain.handle('users:create', async (_e, data) => {
    try {
      return ok(userService.create(data));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('users:update', async (_e, id, data) => {
    try {
      return ok(userService.update(Number(id), data));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('users:delete', async (_e, id) => {
    try {
      return ok(userService.remove(Number(id)));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('users:search', async (_e, query) => ok(userService.search(query)));
}

module.exports = { register };
