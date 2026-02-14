/**
 * Selector de autores con autocompletar, chips y roles
 */
const AuthorSelector = (() => {
  function render(container, { selectedAuthors = [], onChange = null } = {}) {
    let authors = [...selectedAuthors];

    container.innerHTML = `
      <div class="author-selector">
        <div class="author-selector-chips" id="author-chips"></div>
        <div class="author-selector-input">
          <input type="text" placeholder="Buscar autor..." id="author-search-input" autocomplete="off">
          <div class="author-dropdown hidden" id="author-dropdown"></div>
        </div>
      </div>
    `;

    const chipsEl = container.querySelector('#author-chips');
    const input = container.querySelector('#author-search-input');
    const dropdown = container.querySelector('#author-dropdown');

    function renderChips() {
      chipsEl.innerHTML = authors
        .map(
          (a, i) => `
        <span class="author-chip" draggable="true" data-index="${i}">
          ${a.name}
          <span class="role-label">(${translateRole(a.role || 'author')})</span>
          <select class="author-role-select" data-index="${i}">
            <option value="author" ${a.role === 'author' ? 'selected' : ''}>Autor</option>
            <option value="editor" ${a.role === 'editor' ? 'selected' : ''}>Editor</option>
            <option value="translator" ${a.role === 'translator' ? 'selected' : ''}>Traductor</option>
            <option value="illustrator" ${a.role === 'illustrator' ? 'selected' : ''}>Ilustrador</option>
          </select>
          <button class="author-chip-remove" data-index="${i}">&times;</button>
        </span>`
        )
        .join('');

      chipsEl.querySelectorAll('.author-chip-remove').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          authors.splice(parseInt(btn.dataset.index), 1);
          renderChips();
          if (onChange) onChange(authors);
        });
      });

      chipsEl.querySelectorAll('.author-role-select').forEach((sel) => {
        sel.addEventListener('change', (e) => {
          e.stopPropagation();
          authors[parseInt(sel.dataset.index)].role = sel.value;
          renderChips();
          if (onChange) onChange(authors);
        });
      });
    }

    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => searchAuthors(input.value, dropdown, authors, input), 300);
    });

    input.addEventListener('focus', () => {
      if (input.value.length >= 1) {
        searchAuthors(input.value, dropdown, authors, input);
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.author-selector')) {
        dropdown.classList.add('hidden');
      }
    });

    async function searchAuthors(query, dropdown, currentAuthors, input) {
      if (query.length < 1) {
        dropdown.classList.add('hidden');
        return;
      }

      try {
        const result = await window.api.authors.search(query);
        const existing = currentAuthors.map((a) => a.id);
        const filtered = result.success
          ? result.data.filter((a) => !existing.includes(a.id))
          : [];

        let html = filtered
          .map(
            (a) => `<div class="author-dropdown-item" data-id="${a.id}" data-name="${a.name}">${a.name}</div>`
          )
          .join('');

        html += `<div class="author-dropdown-item create-new" data-name="${query}">+ Crear "${query}"</div>`;
        dropdown.innerHTML = html;
        dropdown.classList.remove('hidden');

        dropdown.querySelectorAll('.author-dropdown-item:not(.create-new)').forEach((item) => {
          item.addEventListener('click', () => {
            authors.push({
              id: parseInt(item.dataset.id),
              name: item.dataset.name,
              role: 'author',
              author_order: authors.length + 1,
            });
            input.value = '';
            dropdown.classList.add('hidden');
            renderChips();
            if (onChange) onChange(authors);
          });
        });

        dropdown.querySelector('.create-new')?.addEventListener('click', async () => {
          const name = dropdown.querySelector('.create-new').dataset.name;
          try {
            const res = await window.api.authors.create({ name });
            if (res.success) {
              authors.push({
                id: res.data.id,
                name: res.data.name,
                role: 'author',
                author_order: authors.length + 1,
              });
              input.value = '';
              dropdown.classList.add('hidden');
              renderChips();
              if (onChange) onChange(authors);
              Toast.success(`Autor "${name}" creado`);
            } else {
              Toast.error(res.error);
            }
          } catch (e) {
            Toast.error('Error al crear autor');
          }
        });
      } catch (e) {
        console.error('Error searching authors:', e);
      }
    }

    renderChips();

    return {
      getAuthors: () => authors,
      setAuthors: (newAuthors) => {
        authors = [...newAuthors];
        renderChips();
      },
    };
  }

  function translateRole(role) {
    const roles = { author: 'Autor', editor: 'Editor', translator: 'Traductor', illustrator: 'Ilustrador' };
    return roles[role] || role;
  }

  return { render, translateRole };
})();
