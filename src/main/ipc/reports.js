const reportService = require('../services/reportService');

function ok(data) {
  return { success: true, data };
}

function fail(error) {
  return { success: false, error: error.message || 'Error', details: error.details || null };
}

function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const raw = v == null ? '' : String(v);
    if (/[",\n]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  return [headers.join(','), ...rows.map((row) => headers.map((h) => esc(row[h])).join(','))].join('\n');
}

function register(ipcMain) {
  ipcMain.handle('reports:getDashboard', async () => ok(reportService.getDashboardMetrics()));
  ipcMain.handle('reports:getGenreDistribution', async () => ok(reportService.getGenreDistribution()));
  ipcMain.handle('reports:getReadingTrend', async () => ok(reportService.getReadingTrend()));
  ipcMain.handle('reports:getTopAuthors', async () => ok(reportService.getTopAuthors(10)));
  ipcMain.handle('reports:getLoanStats', async () => ok(reportService.getLoanStats()));

  ipcMain.handle('reports:exportCSV', async (_e, type) => {
    try {
      const data = type === 'genres' ? reportService.getGenreDistribution() : reportService.getTopAuthors(50);
      return ok({ type, content: toCsv(data) });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle('reports:exportExcel', async () => {
    return { success: false, error: 'Exportación Excel pendiente' };
  });

  ipcMain.handle('reports:exportPDF', async () => {
    return { success: false, error: 'Exportación PDF pendiente' };
  });
}

module.exports = { register };
