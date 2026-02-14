const readingService = require('../services/readingService');

function ok(data) {
  return { success: true, data };
}

function fail(error) {
  return { success: false, error: error.message || 'Error', details: error.details || null };
}

function register(ipcMain) {
  ipcMain.handle('reading:start', async (_e, bookId) => {
    try {
      return ok(readingService.startReading(Number(bookId)));
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle('reading:finish', async (_e, bookId, data) => {
    try {
      return ok(readingService.finishReading(Number(bookId), data || {}));
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle('reading:getHistory', async (_e, bookId) => ok(readingService.getHistory(bookId ? Number(bookId) : null)));
  ipcMain.handle('reading:getStatistics', async () => ok(readingService.getStatistics()));
}

module.exports = { register };
