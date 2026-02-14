const loanService = require('../services/loanService');

function ok(data) {
  return { success: true, data };
}

function fail(error) {
  return { success: false, error: error.message || 'Error', details: error.details || null };
}

function register(ipcMain) {
  ipcMain.handle('loans:getAll', async (_e, filters) => ok(loanService.getAll(filters || {})));
  ipcMain.handle('loans:getById', async (_e, id) => ok(loanService.getById(Number(id))));
  ipcMain.handle('loans:create', async (_e, data) => {
    try {
      return ok(loanService.createLoan(data));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('loans:return', async (_e, id, data) => {
    try {
      return ok(loanService.returnLoan(Number(id), data || {}));
    } catch (error) {
      return fail(error);
    }
  });
  ipcMain.handle('loans:getActive', async () => ok(loanService.getActiveLoans()));
  ipcMain.handle('loans:getOverdue', async () => ok(loanService.getOverdueLoans()));
  ipcMain.handle('loans:getByUser', async (_e, userId) => ok(loanService.getByUser(Number(userId))));
  ipcMain.handle('loans:getByBook', async (_e, bookId) => ok(loanService.getByBook(Number(bookId))));
}

module.exports = { register };
