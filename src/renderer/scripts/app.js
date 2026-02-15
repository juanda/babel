(function bootstrap() {
  const NAV_ITEMS = [
    { route: 'dashboard', label: 'Dashboard' },
    { route: 'books', label: 'Libros' },
    { route: 'authors', label: 'Autores' },
    { route: 'loans', label: 'Préstamos' },
    { route: 'users', label: 'Usuarios' },
    { route: 'reading', label: 'Lecturas' },
    { route: 'reports', label: 'Reportes' },
    { route: 'collections', label: 'Colecciones' },
    { route: 'settings', label: 'Configuración' },
  ];

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = NAV_ITEMS.map((item) => `
      <li>
        <a class="nav-link" href="#${item.route}" data-route="${item.route}">${item.label}</a>
      </li>
    `).join('');
  }

  function initTheme() {
    const current = Store.get('theme');
    document.documentElement.setAttribute('data-theme', current);
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');

    function syncIcons(theme) {
      lightIcon.classList.toggle('hidden', theme === 'dark');
      darkIcon.classList.toggle('hidden', theme !== 'dark');
    }

    syncIcons(current);
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const next = Store.get('theme') === 'light' ? 'dark' : 'light';
      Store.set('theme', next);
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
      syncIcons(next);
    });
  }

  function viewContainer() {
    return document.getElementById('view-container');
  }

  function getLabelTemplateOptions() {
    return [
      { value: '65', label: '65 etiquetas por hoja (38.1×21.2 mm)' },
      { value: '24', label: '24 etiquetas por hoja (63.5×33.9 mm)' },
      { value: '21', label: '21 etiquetas por hoja (63.5×38.1 mm)' },
    ];
  }

  async function renderDashboard() {
    const container = viewContainer();
    container.innerHTML = '<div class="spinner"></div>';

    const [dashboardRes, topAuthorsRes] = await Promise.all([
      window.api.reports.getDashboard(),
      window.api.reports.getTopAuthors(),
    ]);

    const d = dashboardRes.success ? dashboardRes.data : {};
    const topAuthors = topAuthorsRes.success ? topAuthorsRes.data : [];

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><h3>Libros</h3><p class="stat-value">${d.total_books || 0}</p></div>
        <div class="stat-card"><h3>Autores</h3><p class="stat-value">${d.total_authors || 0}</p></div>
        <div class="stat-card"><h3>Usuarios</h3><p class="stat-value">${d.total_users || 0}</p></div>
        <div class="stat-card"><h3>Préstamos activos</h3><p class="stat-value">${d.active_loans || 0}</p></div>
      </div>
      <div class="detail-card mt-lg">
        <h3>Top autores</h3>
        <div id="dashboard-top-authors"></div>
      </div>
    `;

    const mount = document.getElementById('dashboard-top-authors');
    if (topAuthors.length === 0) {
      mount.innerHTML = '<p class="text-muted">Sin datos todavía</p>';
    } else {
      mount.appendChild(Chart.bar(topAuthors.map((a) => ({ label: a.name, value: a.book_count }))));
    }
  }

  async function renderBooks() {
    const container = viewContainer();
    const collectionsRes = await window.api.collections.getAll();
    const collections = collectionsRes.success ? collectionsRes.data : [];

    container.innerHTML = `
      <div class="filters-bar">
        <input class="form-input" id="book-filter-search" placeholder="Buscar por título o autor">
        <select class="form-select" id="book-filter-status">
          <option value="">Todos</option>
          <option value="unread">No leídos</option>
          <option value="reading">Leyendo</option>
          <option value="completed">Leídos</option>
        </select>
        <select class="form-select" id="book-filter-collection">
          <option value="">Todas las colecciones</option>
          ${collections.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
        </select>
        <label class="form-checkbox">
          <input type="checkbox" id="book-filter-favorite">
          Favoritos
        </label>
        <label class="form-checkbox">
          <input type="checkbox" id="book-filter-loanable">
          Disponibles préstamo
        </label>
        <label class="form-checkbox">
          <input type="checkbox" id="book-filter-label-not-printed">
          Tejuelo no impreso
        </label>
        <button class="btn btn-secondary" id="book-filter-apply">Filtrar</button>
        <button class="btn btn-primary" id="book-print-labels">Imprimir tejuelos</button>
      </div>
      <div id="books-content" class="mt-md"></div>
    `;

    const content = document.getElementById('books-content');
    const load = () => {
      BookList.render(content, {
        search: document.getElementById('book-filter-search').value.trim() || undefined,
        read_status: document.getElementById('book-filter-status').value || undefined,
        collection_id: document.getElementById('book-filter-collection').value || undefined,
        favorite: document.getElementById('book-filter-favorite').checked ? 1 : undefined,
        loanable: document.getElementById('book-filter-loanable').checked ? 1 : undefined,
        label_printed: document.getElementById('book-filter-label-not-printed').checked ? 0 : undefined,
      });
    };

    document.getElementById('book-filter-apply').addEventListener('click', load);
    document.getElementById('book-print-labels').addEventListener('click', () => {
      const booksToPrint = BookList.getCurrentBooks();
      if (!booksToPrint.length) {
        Toast.warning('No hay libros en el resultado actual para imprimir');
        return;
      }

      Store.set('labelPrintSelection', booksToPrint.map((book) => book.id));
      Router.navigate('label-print');
    });
    load();
  }

  async function renderLabelPrint() {
    const container = viewContainer();
    const selectedIds = Array.isArray(Store.get('labelPrintSelection')) ? Store.get('labelPrintSelection') : [];

    if (!selectedIds.length) {
      container.innerHTML = `
        <div class="detail-card">
          <h2>Imprimir tejuelos</h2>
          <p class="text-muted mt-md">No hay libros seleccionados.</p>
          <div class="form-actions">
            <button class="btn btn-secondary" id="label-print-back-empty">Volver</button>
          </div>
        </div>
      `;
      container.querySelector('#label-print-back-empty')?.addEventListener('click', () => Router.navigate('books'));
      return;
    }

    container.innerHTML = '<div class="spinner"></div>';
    const loaded = await Promise.all(selectedIds.map((id) => window.api.books.getById(id)));
    const books = loaded.filter((res) => res.success && res.data).map((res) => res.data);
    const printableBooks = books.filter((book) => String(book.signature || '').trim());
    const skippedCount = books.length - printableBooks.length;
    const templateOptions = getLabelTemplateOptions();

    container.innerHTML = `
      <div class="detail-card">
        <h2>Imprimir tejuelos</h2>
        <p class="text-muted mt-md">Libros del resultado actual: ${books.length}. Con signatura imprimible: ${printableBooks.length}.</p>
        ${skippedCount > 0 ? `<p class="text-muted text-sm">Se omiten ${skippedCount} libro(s) sin signatura.</p>` : ''}

        <div class="form-row mt-lg">
          <div class="form-group">
            <label class="form-label">Plantilla</label>
            <select class="form-select" id="label-template">
              ${templateOptions.map((option) => `<option value="${option.value}">${escapeHtml(option.label)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Salida</label>
            <div class="form-checkbox-grid">
              <label class="form-checkbox form-checkbox-card">
                <input type="radio" name="label-output" value="pdf" checked>
                Generar PDF
              </label>
              <label class="form-checkbox form-checkbox-card">
                <input type="radio" name="label-output" value="printer">
                Enviar a impresora
              </label>
            </div>
          </div>
        </div>

        <div class="table-container mt-md">
          <table class="data-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Signatura</th>
              </tr>
            </thead>
            <tbody>
              ${printableBooks
                .map((book) => `<tr><td>${escapeHtml(book.title || '-')}</td><td>${escapeHtml(book.signature || '-')}</td></tr>`)
                .join('')}
            </tbody>
          </table>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" id="label-print-cancel">Cancelar</button>
          <button class="btn btn-primary" id="label-print-submit">Imprimir</button>
        </div>
      </div>
    `;

    container.querySelector('#label-print-cancel')?.addEventListener('click', () => Router.navigate('books'));
    container.querySelector('#label-print-submit')?.addEventListener('click', async () => {
      if (!printableBooks.length) {
        Toast.warning('No hay libros con signatura para imprimir');
        return;
      }

      const button = container.querySelector('#label-print-submit');
      const template = container.querySelector('#label-template')?.value || '65';
      const output = container.querySelector('input[name="label-output"]:checked')?.value || 'pdf';
      if (button) button.disabled = true;

      try {
        const result = await window.api.books.printLabels({
          books: printableBooks.map((book) => ({ id: book.id, signature: book.signature })),
          template,
          output,
        });

        if (!result.success) {
          Toast.error(result.error || 'No se pudo completar la impresión');
          return;
        }

        await Promise.all(
          printableBooks.map((book) =>
            window.api.books.update(book.id, {
              label_printed: 1,
            })
          )
        );

        if (output === 'pdf') {
          Toast.success(result.data?.saved ? 'PDF generado correctamente' : 'Generación de PDF cancelada');
        } else {
          Toast.success('Trabajo enviado a la impresora');
        }

        Router.navigate('books', { t: Date.now() });
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  async function renderBookDetail(params) {
    const id = Number(params.id);
    const container = viewContainer();
    if (!id) {
      container.innerHTML = '<p class="text-muted">Libro no encontrado</p>';
      return;
    }

    const [bookRes, collectionsRes, bookCollectionsRes] = await Promise.all([
      window.api.books.getById(id),
      window.api.collections.getAll(),
      window.api.collections.getAll().then(async (allRes) => {
        if (!allRes.success) return { success: false, data: [] };
        try {
          const entries = await Promise.all(
            allRes.data.map(async (c) => {
              const books = await window.api.collections.getBooks(c.id);
              if (!books.success) return null;
              const hasBook = books.data.some((item) => item.id === id);
              return hasBook ? c : null;
            })
          );
          return { success: true, data: entries.filter(Boolean) };
        } catch (_error) {
          return { success: false, data: [] };
        }
      }),
    ]);

    if (!bookRes.success || !bookRes.data) {
      container.innerHTML = '<p class="text-muted">Libro no encontrado</p>';
      return;
    }

    const b = bookRes.data;
    const allCollections = collectionsRes.success ? collectionsRes.data : [];
    const assignedCollections = bookCollectionsRes.success ? bookCollectionsRes.data : [];
    const authors = (b.bookAuthors || []).map((a) => `${a.name} (${AuthorSelector.translateRole(a.role)})`).join(', ');
    const assignedIds = new Set(assignedCollections.map((c) => c.id));
    const availableCollections = allCollections.filter((c) => !assignedIds.has(c.id));
    const loanText = b.is_loaned
      ? (b.loan_status === 'overdue'
          ? `Prestado (vencido)${b.loaned_to ? ` a ${b.loaned_to}` : ''}`
          : `Prestado${b.loaned_to ? ` a ${b.loaned_to}` : ''}`)
      : 'Disponible';

    container.innerHTML = `
      <div class="detail-card">
        <div class="view-header">
          <h2>${escapeHtml(b.title)}</h2>
          <div>
            <button class="btn btn-secondary" id="book-detail-edit" data-id="${b.id}">Editar</button>
            <button class="btn btn-danger" id="book-detail-delete" data-id="${b.id}">Eliminar</button>
          </div>
        </div>
        <p class="text-muted">${escapeHtml(b.subtitle || '')}</p>
        <p><strong>Autores:</strong> ${escapeHtml(authors || 'Sin autores')}</p>
        <p><strong>Género:</strong> ${escapeHtml(b.genre || '-')}</p>
        <p><strong>CDU:</strong> ${escapeHtml(b.cdu || '-')}</p>
        <p><strong>Signatura:</strong> ${escapeHtml(b.signature || '-')}</p>
        <p><strong>Estado:</strong> ${escapeHtml(b.read_status || '-')}</p>
        <p><strong>Préstamo:</strong> ${escapeHtml(loanText)}</p>
        <p><strong>Descripción:</strong> ${escapeHtml(b.description || '-')}</p>

        <div class="mt-lg">
          <h3>Colecciones</h3>
          <div class="form-inline mt-md">
            <select class="form-select" id="book-collection-select">
              <option value="">Agregar a colección...</option>
              ${availableCollections.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
            </select>
            <button class="btn btn-secondary" id="book-collection-add">Agregar</button>
          </div>
          <div id="book-collections-list" class="mt-md">
            ${assignedCollections.length === 0
              ? '<span class="text-muted text-sm">Este libro no está en ninguna colección.</span>'
              : assignedCollections
                  .map(
                    (c) => `<span class="badge badge-primary" style="margin-right:8px;">
                      ${escapeHtml(c.name)}
                      <button class="icon-btn js-book-collection-remove" data-id="${c.id}" style="margin-left:6px;">×</button>
                    </span>`
                  )
                  .join('')}
          </div>
        </div>

        <div id="reading-tracker" class="mt-lg"></div>
      </div>
    `;
    container.querySelector('#book-detail-edit')?.addEventListener('click', () => {
      Router.navigate('book-form', { id: b.id });
    });
    container.querySelector('#book-detail-delete')?.addEventListener('click', async () => {
      const confirmed = await Modal.confirm({
        title: 'Eliminar Libro',
        message: `¿Estás seguro de eliminar "${b.title}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        danger: true,
      });
      if (!confirmed) return;

      const deleted = await window.api.books.delete(b.id);
      if (!deleted.success) {
        Toast.error(deleted.error || 'No se pudo eliminar el libro');
        return;
      }

      Toast.success('Libro eliminado');
      SearchBar.loadData();
      Router.navigate('books');
    });
    container.querySelector('#book-collection-add')?.addEventListener('click', async () => {
      const select = container.querySelector('#book-collection-select');
      const collectionId = Number(select.value);
      if (!collectionId) {
        Toast.warning('Selecciona una colección');
        return;
      }

      const addRes = await window.api.collections.addBook(collectionId, b.id);
      if (!addRes.success) {
        Toast.error(addRes.error || 'No se pudo agregar a la colección');
        return;
      }

      Toast.success('Libro agregado a colección');
      Router.navigate('book-detail', { id: b.id, t: Date.now() });
    });
    container.querySelectorAll('.js-book-collection-remove').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const collectionId = Number(btn.dataset.id);
        const remRes = await window.api.collections.removeBook(collectionId, b.id);
        if (!remRes.success) {
          Toast.error(remRes.error || 'No se pudo quitar de la colección');
          return;
        }

        Toast.success('Libro eliminado de la colección');
        Router.navigate('book-detail', { id: b.id, t: Date.now() });
      });
    });

    ReadingTracker.render(document.getElementById('reading-tracker'), b);
  }

  async function renderAuthors() {
    const container = viewContainer();
    container.innerHTML = '<div class="spinner"></div>';
    const result = await window.api.authors.getAll();
    const authors = result.success ? result.data : [];

    container.innerHTML = `
      <div class="view-header">
        <span class="text-secondary text-sm">${authors.length} autor(es)</span>
        <button class="btn btn-primary" id="authors-new-btn">Nuevo autor</button>
      </div>
      <div class="table-container mt-md">
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>Nacionalidad</th><th>Acciones</th></tr></thead>
          <tbody>
            ${authors
              .map(
                (a) => `<tr>
                  <td>${escapeHtml(a.name)}</td>
                  <td>${escapeHtml(a.nationality || '-')}</td>
                  <td class="table-actions">
                    <button class="btn btn-sm btn-secondary js-author-view" data-id="${a.id}">Ver</button>
                    <button class="btn btn-sm btn-secondary js-author-edit" data-id="${a.id}">Editar</button>
                  </td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
    container.querySelector('#authors-new-btn')?.addEventListener('click', () => {
      Router.navigate('author-form');
    });
    container.querySelectorAll('.js-author-view').forEach((btn) => {
      btn.addEventListener('click', () => Router.navigate('author-detail', { id: Number(btn.dataset.id) }));
    });
    container.querySelectorAll('.js-author-edit').forEach((btn) => {
      btn.addEventListener('click', () => Router.navigate('author-form', { id: Number(btn.dataset.id) }));
    });
  }

  async function renderAuthorDetail(params) {
    const id = Number(params.id);
    const container = viewContainer();
    const [authorRes, booksRes] = await Promise.all([
      window.api.authors.getById(id),
      window.api.books.getAll({}),
    ]);

    if (!authorRes.success || !authorRes.data) {
      container.innerHTML = '<p class="text-muted">Autor no encontrado</p>';
      return;
    }

    const author = authorRes.data;
    const books = (booksRes.success ? booksRes.data : []).filter((b) =>
      (b.authors || '').toLowerCase().includes((author.name || '').toLowerCase())
    );

    container.innerHTML = `
      <div class="detail-card">
        <h2>${escapeHtml(author.name)}</h2>
        <p><strong>Nacionalidad:</strong> ${escapeHtml(author.nationality || '-')}</p>
        <p><strong>Biografía:</strong> ${escapeHtml(author.biography || '-')}</p>
        <h3 class="mt-lg">Libros</h3>
        <ul>
          ${books.map((b) => `<li><a href="#book-detail?id=${b.id}">${escapeHtml(b.title)}</a></li>`).join('') || '<li>Sin libros registrados</li>'}
        </ul>
      </div>
    `;
  }

  function renderSettings() {
    const container = viewContainer();
    container.innerHTML = `
      <div class="detail-card">
        <h2>Configuración</h2>
        <p class="text-muted">Ajustes básicos de la aplicación.</p>
        <div class="form-group mt-lg">
          <label class="form-label">Tema</label>
          <select class="form-select" id="settings-theme">
            <option value="light" ${Store.get('theme') === 'light' ? 'selected' : ''}>Claro</option>
            <option value="dark" ${Store.get('theme') === 'dark' ? 'selected' : ''}>Oscuro</option>
          </select>
        </div>
        <button class="btn btn-primary" id="settings-save">Guardar</button>
      </div>
    `;

    document.getElementById('settings-save').addEventListener('click', () => {
      const theme = document.getElementById('settings-theme').value;
      localStorage.setItem('theme', theme);
      Store.set('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      Toast.success('Configuración guardada');
    });
  }

  function registerRoutes() {
    Router.register('dashboard', () => renderDashboard());
    Router.register('books', () => renderBooks());
    Router.register('book-detail', (params) => renderBookDetail(params));
    Router.register('book-form', (params) => BookForm.render(viewContainer(), params.id ? Number(params.id) : null));
    Router.register('authors', () => renderAuthors());
    Router.register('author-detail', (params) => renderAuthorDetail(params));
    Router.register('author-form', (params) => AuthorForm.render(viewContainer(), params.id ? Number(params.id) : null));
    Router.register('loans', () => LoanManager.render(viewContainer()));
    Router.register('users', () => UserForm.renderList(viewContainer()));
    Router.register('reading', () => ReadingTracker.renderPage(viewContainer()));
    Router.register('reports', () => Chart.renderReportsPage(viewContainer()));
    Router.register('collections', () => CollectionManager.render(viewContainer()));
    Router.register('label-print', () => renderLabelPrint());
    Router.register('settings', () => renderSettings());
  }

  function initSidebarToggle() {
    const btn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  function init() {
    renderSidebar();
    Modal.init();
    initTheme();
    initSidebarToggle();
    registerRoutes();
    Router.init();
    SearchBar.init();
    SearchBar.loadData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
