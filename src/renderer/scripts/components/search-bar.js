/**
 * Búsqueda global con Fuse.js
 */
const SearchBar = (() => {
  let fuse = null;
  let searchData = [];

  function init() {
    const input = document.getElementById('search-input');
    const resultsEl = document.getElementById('search-results');
    if (!input) return;

    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => handleSearch(input.value, resultsEl), 300);
    });

    input.addEventListener('focus', () => {
      if (input.value.length >= 2 && resultsEl.children.length > 0) {
        resultsEl.classList.remove('hidden');
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.global-search')) {
        resultsEl.classList.add('hidden');
      }
    });
  }

  async function loadData() {
    try {
      const [booksRes, authorsRes] = await Promise.all([
        window.api.books.getAll({}),
        window.api.authors.getAll(),
      ]);

      searchData = [];

      if (booksRes.success) {
        booksRes.data.forEach((b) => {
          searchData.push({ type: 'libro', title: b.title, subtitle: b.authors || '', id: b.id, route: 'book-detail' });
        });
      }
      if (authorsRes.success) {
        authorsRes.data.forEach((a) => {
          searchData.push({ type: 'autor', title: a.name, subtitle: a.nationality || '', id: a.id, route: 'author-detail' });
        });
      }

      if (typeof Fuse !== 'undefined') {
        fuse = new Fuse(searchData, {
          keys: ['title', 'subtitle'],
          threshold: 0.3,
          limit: 10,
        });
      }
    } catch (e) {
      console.error('Error loading search data:', e);
    }
  }

  function handleSearch(query, resultsEl) {
    if (query.length < 2) {
      resultsEl.classList.add('hidden');
      return;
    }

    let results;
    if (fuse) {
      results = fuse.search(query).map((r) => r.item);
    } else {
      const q = query.toLowerCase();
      results = searchData.filter(
        (d) => d.title.toLowerCase().includes(q) || d.subtitle.toLowerCase().includes(q)
      ).slice(0, 10);
    }

    if (results.length === 0) {
      resultsEl.innerHTML = '<div class="search-result-item"><span class="text-muted text-sm">Sin resultados</span></div>';
    } else {
      resultsEl.innerHTML = results
        .map(
          (r) => `
        <div class="search-result-item js-search-result" data-route="${r.route}" data-id="${r.id}">
          <span class="search-result-type">${r.type}</span>
          <div>
            <div class="search-result-title">${r.title}</div>
            <div class="search-result-subtitle">${r.subtitle}</div>
          </div>
        </div>`
        )
        .join('');
    }

    resultsEl.querySelectorAll('.js-search-result').forEach((item) => {
      item.addEventListener('click', () => {
        Router.navigate(item.dataset.route, { id: Number(item.dataset.id) });
        document.getElementById('search-results').classList.add('hidden');
        document.getElementById('search-input').value = '';
      });
    });
    resultsEl.classList.remove('hidden');
  }

  return { init, loadData };
})();
