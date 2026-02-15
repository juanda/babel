/**
 * Componente de listado de libros (grid y tabla)
 */
const BookList = (() => {
  const ITEMS_PER_PAGE = 24;
  let currentPage = 1;
  let currentBooks = [];
  let currentFilters = {};
  let viewMode = Store.get('viewMode') || 'grid';

  function hasActiveFilters(filters = {}) {
    return Object.values(filters).some((value) => value !== undefined && value !== null && value !== '');
  }

  function getEmptyStateConfig(filters = {}) {
    const filteredEmpty = hasActiveFilters(filters);
    return {
      message: filteredEmpty
        ? 'No se encontraron libros con los filtros actuales'
        : 'No hay libros en tu biblioteca',
      showAddButton: !filteredEmpty,
    };
  }

  async function render(container, filters = {}) {
    currentFilters = filters;
    currentPage = 1;
    container.innerHTML = '<div class="flex items-center justify-between"><div class="spinner"></div></div>';

    try {
      const result = await window.api.books.getAll(filters);
      if (!result.success) {
        container.innerHTML = `<p class="text-muted">Error: ${result.error}</p>`;
        return;
      }
      currentBooks = result.data || [];
      renderView(container);
    } catch (e) {
      container.innerHTML = '<p class="text-muted">Error al cargar libros</p>';
    }
  }

  function renderView(container) {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageBooks = currentBooks.slice(start, start + ITEMS_PER_PAGE);
    const totalPages = Math.ceil(currentBooks.length / ITEMS_PER_PAGE);

    let html = `
      <div class="view-header">
        <div>
          <span class="text-secondary text-sm">${currentBooks.length} libro${currentBooks.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="view-actions">
          <div class="view-toggle">
            <button class="view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}" data-action="set-view" data-mode="grid" title="Vista cuadrícula">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <button class="view-toggle-btn ${viewMode === 'table' ? 'active' : ''}" data-action="set-view" data-mode="table" title="Vista tabla">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
          </div>
          <button class="btn btn-primary" data-action="go-new-book">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar Libro
          </button>
        </div>
      </div>
    `;

    if (currentBooks.length === 0) {
      const emptyState = getEmptyStateConfig(currentFilters);
      html += `
        <div class="empty-state">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          <p>${emptyState.message}</p>
          ${emptyState.showAddButton ? '<button class="btn btn-primary" data-action="go-new-book">Agregar tu primer libro</button>' : ''}
        </div>
      `;
    } else if (viewMode === 'grid') {
      html += '<div class="book-grid">';
      pageBooks.forEach((book) => {
        html += renderBookCard(book);
      });
      html += '</div>';
    } else {
      html += renderBookTable(pageBooks);
    }

    if (totalPages > 1) {
      html += renderPagination(totalPages);
    }

    container.innerHTML = html;
    attachHandlers(container);
  }

  function renderBookCard(book) {
    const coverHtml = book.cover_url
      ? `<img src="${book.cover_url}" alt="${book.title}" loading="lazy">`
      : `<div class="no-cover"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg><span class="text-xs">Sin portada</span></div>`;

    const statusBadge = getStatusBadge(book.read_status);
    const loanBadge = getLoanBadge(book);

    return `
      <div class="book-card js-open-book" data-id="${book.id}">
        <div class="book-card-cover">
          ${coverHtml}
          ${statusBadge ? `<span class="book-card-badge">${statusBadge}</span>` : ''}
          ${loanBadge ? `<span class="book-card-badge" style="top:36px">${loanBadge}</span>` : ''}
        </div>
        <div class="book-card-info">
          <div class="book-card-title">${book.title}</div>
          <div class="book-card-author">${book.authors || 'Sin autor'}</div>
          <div class="book-card-meta">
            <span>${book.genre || ''}</span>
            ${book.rating ? `<span class="book-card-rating">${'★'.repeat(book.rating)}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function renderBookTable(books) {
    let html = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor(es)</th>
              <th>Género</th>
              <th>Estado</th>
              <th>Calificación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;

    books.forEach((book) => {
      html += `
        <tr class="clickable-row js-open-book" data-id="${book.id}">
          <td><strong>${book.title}</strong>${book.subtitle ? `<br><small class="text-muted">${book.subtitle}</small>` : ''}</td>
          <td>${book.authors || 'Sin autor'}</td>
          <td>${book.genre || '-'}</td>
          <td>${getStatusBadge(book.read_status)} ${getLoanBadge(book) || ''}</td>
          <td>${book.rating ? StarRating.display(book.rating) : '-'}</td>
          <td class="table-actions">
            <button class="icon-btn js-edit-book" data-id="${book.id}" title="Editar">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn js-delete-book" data-id="${book.id}" title="Eliminar">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    return html;
  }

  function getStatusBadge(status) {
    const badges = {
      unread: '<span class="badge badge-secondary">No leído</span>',
      reading: '<span class="badge badge-primary">Leyendo</span>',
      completed: '<span class="badge badge-success">Leído</span>',
    };
    return badges[status] || '';
  }

  function getLoanBadge(book) {
    if (!book || !book.is_loaned) {
      return '<span class="badge badge-success">Disponible</span>';
    }
    if (book.loan_status === 'overdue') {
      return '<span class="badge badge-error">Prestado (vencido)</span>';
    }
    return '<span class="badge badge-warning">Prestado</span>';
  }

  function renderPagination(totalPages) {
    let html = '<div class="pagination">';
    html += `<button class="btn btn-sm btn-secondary" ${currentPage <= 1 ? 'disabled' : ''} data-action="go-page" data-page="${currentPage - 1}">Anterior</button>`;
    html += `<span class="pagination-info">Página ${currentPage} de ${totalPages}</span>`;
    html += `<button class="btn btn-sm btn-secondary" ${currentPage >= totalPages ? 'disabled' : ''} data-action="go-page" data-page="${currentPage + 1}">Siguiente</button>`;
    html += '</div>';
    return html;
  }

  function attachHandlers(container) {
    container.querySelectorAll('[data-action="set-view"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setViewMode(btn.dataset.mode);
      });
    });

    container.querySelectorAll('[data-action="go-new-book"]').forEach((btn) => {
      btn.addEventListener('click', () => Router.navigate('book-form'));
    });

    container.querySelectorAll('.js-open-book').forEach((el) => {
      el.addEventListener('click', () => {
        Router.navigate('book-detail', { id: Number(el.dataset.id) });
      });
    });

    container.querySelectorAll('.js-edit-book').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        Router.navigate('book-form', { id: Number(btn.dataset.id) });
      });
    });

    container.querySelectorAll('.js-delete-book').forEach((btn) => {
      btn.addEventListener('click', async (event) => {
        event.stopPropagation();
        const id = Number(btn.dataset.id);
        const book = currentBooks.find((b) => b.id === id);
        await deleteBook(id, book?.title || 'este libro');
      });
    });

    container.querySelectorAll('[data-action="go-page"]').forEach((btn) => {
      btn.addEventListener('click', () => goToPage(Number(btn.dataset.page)));
    });
  }

  function goToPage(page) {
    currentPage = page;
    const container = document.getElementById('view-container');
    if (container) renderView(container);
  }

  function setViewMode(mode) {
    viewMode = mode;
    localStorage.setItem('viewMode', mode);
    Store.set('viewMode', mode);
    const container = document.getElementById('view-container');
    if (container) {
      renderView(container);
    }
  }

  async function deleteBook(id, title) {
    const confirmed = await Modal.confirm({
      title: 'Eliminar Libro',
      message: `¿Estás seguro de eliminar "${title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!confirmed) return;

    const result = await window.api.books.delete(id);
    if (result.success) {
      Toast.success('Libro eliminado');
      currentBooks = currentBooks.filter((b) => b.id !== id);
      const container = document.getElementById('view-container');
      if (container) renderView(container);
    } else {
      Toast.error(result.error || 'Error al eliminar');
    }
  }

  function getCurrentBooks() {
    return [...currentBooks];
  }

  return { render, goToPage, setViewMode, deleteBook, getCurrentBooks, __test: { hasActiveFilters, getEmptyStateConfig } };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookList;
}
