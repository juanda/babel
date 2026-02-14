const ReadingTracker = (() => {
  function render(container, book) {
    if (!container || !book?.id) return;

    container.innerHTML = `
      <div class="detail-card">
        <h3>Seguimiento de lectura</h3>
        <p class="text-muted">Estado actual: <strong>${book.read_status || 'unread'}</strong></p>
        <div class="form-actions">
          <button class="btn btn-secondary" id="start-reading">Marcar como leyendo</button>
          <button class="btn btn-success" id="finish-reading">Marcar como terminado</button>
        </div>
        <div id="reading-history" class="mt-md"></div>
      </div>
    `;

    container.querySelector('#start-reading').addEventListener('click', async () => {
      const result = await window.api.reading.startReading(book.id);
      if (result.success) {
        Toast.success('Libro marcado como leyendo');
        Router.navigate('book-detail', { id: book.id });
      } else {
        Toast.error(result.error || 'No se pudo actualizar');
      }
    });

    container.querySelector('#finish-reading').addEventListener('click', async () => {
      await showFinishModal(book.id);
    });

    loadHistory(book.id, container.querySelector('#reading-history'));
  }

  async function showFinishModal(bookId) {
    const content = `
      <div class="form-group">
        <label class="form-label">Calificación</label>
        <select class="form-select" id="reading-rating">
          <option value="">Sin calificación</option>
          ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}">${n}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Reseña</label>
        <textarea class="form-textarea" id="reading-review" rows="3"></textarea>
      </div>
    `;

    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;width:100%';
    footer.innerHTML = `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
      <button class="btn btn-success" id="reading-finish-submit">Guardar</button>
    `;

    Modal.open({ title: 'Finalizar lectura', content, footer, size: 'sm' });
    document.getElementById('reading-finish-submit').addEventListener('click', async () => {
      const ratingRaw = document.getElementById('reading-rating').value;
      const payload = {
        rating: ratingRaw ? Number(ratingRaw) : null,
        review: document.getElementById('reading-review').value.trim() || null,
      };
      const result = await window.api.reading.finishReading(bookId, payload);
      if (result.success) {
        Modal.close();
        Toast.success('Lectura finalizada');
        Router.navigate('book-detail', { id: bookId });
      } else {
        Toast.error(result.error || 'No se pudo finalizar lectura');
      }
    });
  }

  async function loadHistory(bookId, mount) {
    const result = await window.api.reading.getHistory(bookId);
    const history = result.success ? result.data : [];

    if (!history.length) {
      mount.innerHTML = '<p class="text-muted">Sin historial de lectura</p>';
      return;
    }

    mount.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Inicio</th><th>Fin</th><th>Rating</th><th>Reseña</th></tr></thead>
        <tbody>
          ${history
            .map(
              (h) => `<tr>
                <td>${h.start_date || '-'}</td>
                <td>${h.finish_date || '-'}</td>
                <td>${h.rating || '-'}</td>
                <td>${h.review || '-'}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  async function renderPage(container) {
    container.innerHTML = '<div class="spinner"></div>';
    const statsRes = await window.api.reading.getStatistics();
    const historyRes = await window.api.reading.getHistory();
    const stats = statsRes.success ? statsRes.data : {};
    const history = historyRes.success ? historyRes.data : [];

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><h3>Sesiones</h3><p class="stat-value">${stats.total_sessions || 0}</p></div>
        <div class="stat-card"><h3>Finalizadas</h3><p class="stat-value">${stats.finished_sessions || 0}</p></div>
        <div class="stat-card"><h3>Rating medio</h3><p class="stat-value">${stats.avg_rating || '-'}</p></div>
      </div>
      <div class="detail-card mt-lg">
        <h3>Historial reciente</h3>
        <div class="table-container mt-md">
          <table class="data-table">
            <thead><tr><th>Libro</th><th>Inicio</th><th>Fin</th><th>Rating</th></tr></thead>
            <tbody>
              ${history
                .slice(0, 20)
                .map(
                  (h) => `<tr>
                    <td>${h.book_title || '-'}</td>
                    <td>${h.start_date || '-'}</td>
                    <td>${h.finish_date || '-'}</td>
                    <td>${h.rating || '-'}</td>
                  </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  return { render, renderPage };
})();
