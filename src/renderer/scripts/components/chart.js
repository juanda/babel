const Chart = (() => {
  function bar(data) {
    const root = document.createElement('div');
    root.className = 'chart chart-bar';

    const max = Math.max(...data.map((d) => d.value), 1);
    root.innerHTML = data
      .map((d) => {
        const pct = Math.round((d.value / max) * 100);
        return `
          <div class="chart-row">
            <div class="chart-label">${d.label}</div>
            <div class="chart-track"><div class="chart-fill" style="width:${pct}%"></div></div>
            <div class="chart-value">${d.value}</div>
          </div>
        `;
      })
      .join('');

    return root;
  }

  async function renderReportsPage(container) {
    container.innerHTML = '<div class="spinner"></div>';

    const [genreRes, trendRes, topRes, loanRes] = await Promise.all([
      window.api.reports.getGenreDistribution(),
      window.api.reports.getReadingTrend(),
      window.api.reports.getTopAuthors(),
      window.api.reports.getLoanStats(),
    ]);

    const genres = genreRes.success ? genreRes.data : [];
    const trend = trendRes.success ? trendRes.data : [];
    const top = topRes.success ? topRes.data : [];
    const loanStats = loanRes.success ? loanRes.data : {};

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><h3>Préstamos totales</h3><p class="stat-value">${loanStats.total || 0}</p></div>
        <div class="stat-card"><h3>Activos</h3><p class="stat-value">${loanStats.active || 0}</p></div>
        <div class="stat-card"><h3>Vencidos</h3><p class="stat-value">${loanStats.overdue || 0}</p></div>
        <div class="stat-card"><h3>Devueltos</h3><p class="stat-value">${loanStats.returned || 0}</p></div>
      </div>
      <div class="detail-card mt-lg">
        <h3>Libros por género</h3>
        <div id="report-genre"></div>
      </div>
      <div class="detail-card mt-lg">
        <h3>Tendencia de lectura</h3>
        <div id="report-trend"></div>
      </div>
      <div class="detail-card mt-lg">
        <h3>Top autores</h3>
        <div id="report-authors"></div>
      </div>
    `;

    document.getElementById('report-genre').appendChild(bar(genres.map((g) => ({ label: g.genre, value: g.count }))));
    document.getElementById('report-trend').appendChild(bar(trend.map((t) => ({ label: t.month, value: t.count }))));
    document.getElementById('report-authors').appendChild(bar(top.map((a) => ({ label: a.name, value: a.book_count }))));
  }

  return { bar, renderReportsPage };
})();
