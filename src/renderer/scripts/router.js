/**
 * Router hash-based simple para SPA
 */
const Router = (() => {
  const routes = new Map();
  let currentRoute = null;

  function register(path, handler) {
    routes.set(path, handler);
  }

  function navigate(path, params = {}) {
    const hash = params && Object.keys(params).length > 0
      ? `${path}?${new URLSearchParams(params).toString()}`
      : path;
    window.location.hash = hash;
  }

  function parseHash() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const [path, queryString] = hash.split('?');
    const params = {};
    if (queryString) {
      new URLSearchParams(queryString).forEach((value, key) => {
        params[key] = value;
      });
    }
    return { path, params };
  }

  function handleRoute() {
    const { path, params } = parseHash();

    if (currentRoute === path + JSON.stringify(params)) return;
    currentRoute = path + JSON.stringify(params);

    const handler = routes.get(path);
    if (handler) {
      // Update page title
      const titleEl = document.getElementById('page-title');
      const titles = {
        dashboard: 'Dashboard',
        books: 'Libros',
        'book-detail': 'Detalle del Libro',
        'book-form': 'Formulario de Libro',
        authors: 'Autores',
        'author-detail': 'Detalle del Autor',
        'author-form': 'Formulario de Autor',
        loans: 'Préstamos',
        users: 'Usuarios',
        'user-form': 'Formulario de Usuario',
        reading: 'Lecturas',
        reports: 'Reportes',
        collections: 'Colecciones',
        'label-print': 'Impresión de Tejuelos',
        settings: 'Configuración',
      };
      if (titleEl) {
        titleEl.textContent = titles[path] || path;
      }

      // Update active nav link
      document.querySelectorAll('.nav-link').forEach((link) => {
        link.classList.toggle('active', link.dataset.route === path);
      });

      // Store current view
      Store.set('currentView', path);

      // Call handler
      handler(params);
    }
  }

  function init() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  return { register, navigate, init, parseHash };
})();
