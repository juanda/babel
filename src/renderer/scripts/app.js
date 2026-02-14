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

  function renderBooks() {
    const container = viewContainer();
    container.innerHTML = `
      <div class="filters-bar">
        <input class="form-input" id="book-filter-search" placeholder="Buscar por título o autor">
        <select class="form-select" id="book-filter-status">
          <option value="">Todos</option>
          <option value="unread">No leídos</option>
          <option value="reading">Leyendo</option>
          <option value="completed">Leídos</option>
        </select>
        <button class="btn btn-secondary" id="book-filter-apply">Filtrar</button>
      </div>
      <div id="books-content" class="mt-md"></div>
    `;

    const content = document.getElementById('books-content');
    const load = () => {
      BookList.render(content, {
        search: document.getElementById('book-filter-search').value.trim() || undefined,
        read_status: document.getElementById('book-filter-status').value || undefined,
      });
    };

    document.getElementById('book-filter-apply').addEventListener('click', load);
    load();
  }

  async function renderBookDetail(params) {
    const id = Number(params.id);
    const container = viewContainer();
    if (!id) {
      container.innerHTML = '<p class="text-muted">Libro no encontrado</p>';
      return;
    }

    const result = await window.api.books.getById(id);
    if (!result.success || !result.data) {
      container.innerHTML = '<p class="text-muted">Libro no encontrado</p>';
      return;
    }

    const b = result.data;
    const authors = (b.bookAuthors || []).map((a) => `${a.name} (${AuthorSelector.translateRole(a.role)})`).join(', ');
    container.innerHTML = `
      <div class="detail-card">
        <div class="view-header">
          <h2>${escapeHtml(b.title)}</h2>
          <div>
            <button class="btn btn-secondary" onclick="Router.navigate('book-form', { id: ${b.id} })">Editar</button>
          </div>
        </div>
        <p class="text-muted">${escapeHtml(b.subtitle || '')}</p>
        <p><strong>Autores:</strong> ${escapeHtml(authors || 'Sin autores')}</p>
        <p><strong>Género:</strong> ${escapeHtml(b.genre || '-')}</p>
        <p><strong>Estado:</strong> ${escapeHtml(b.read_status || '-')}</p>
        <p><strong>Descripción:</strong> ${escapeHtml(b.description || '-')}</p>
        <div id="reading-tracker" class="mt-lg"></div>
      </div>
    `;

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
        <button class="btn btn-primary" onclick="Router.navigate('author-form')">Nuevo autor</button>
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
                    <button class="btn btn-sm btn-secondary" onclick="Router.navigate('author-detail', { id: ${a.id} })">Ver</button>
                    <button class="btn btn-sm btn-secondary" onclick="Router.navigate('author-form', { id: ${a.id} })">Editar</button>
                  </td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
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
