/**
 * Formulario de creación/edición de libros
 */
const BookForm = (() => {
  let authorSelectorInstance = null;

  async function render(container, bookId = null) {
    let book = null;
    let bookAuthors = [];

    if (bookId) {
      const result = await window.api.books.getById(bookId);
      if (result.success) {
        book = result.data;
        bookAuthors = book.bookAuthors || [];
      }
    }

    container.innerHTML = `
      <div class="detail-card">
        <h2>${book ? 'Editar Libro' : 'Nuevo Libro'}</h2>
        <form id="book-form" class="mt-lg">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Título <span class="required">*</span></label>
              <input type="text" class="form-input" id="book-title" value="${book?.title || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Subtítulo</label>
              <input type="text" class="form-input" id="book-subtitle" value="${book?.subtitle || ''}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">ISBN</label>
              <input type="text" class="form-input" id="book-isbn" value="${book?.isbn || ''}" placeholder="978-...">
            </div>
            <div class="form-group">
              <label class="form-label">Editorial</label>
              <input type="text" class="form-input" id="book-publisher" value="${book?.publisher || ''}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Autores</label>
            <div id="author-selector-container"></div>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">Fecha de publicación</label>
              <input type="date" class="form-input" id="book-publication-date" value="${book?.publication_date || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Edición</label>
              <input type="text" class="form-input" id="book-edition" value="${book?.edition || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Idioma</label>
              <select class="form-select" id="book-language">
                <option value="es" ${(book?.language || 'es') === 'es' ? 'selected' : ''}>Español</option>
                <option value="en" ${book?.language === 'en' ? 'selected' : ''}>Inglés</option>
                <option value="fr" ${book?.language === 'fr' ? 'selected' : ''}>Francés</option>
                <option value="pt" ${book?.language === 'pt' ? 'selected' : ''}>Portugués</option>
                <option value="de" ${book?.language === 'de' ? 'selected' : ''}>Alemán</option>
                <option value="it" ${book?.language === 'it' ? 'selected' : ''}>Italiano</option>
                <option value="other" ${book?.language === 'other' ? 'selected' : ''}>Otro</option>
              </select>
            </div>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">Páginas</label>
              <input type="number" class="form-input" id="book-pages" value="${book?.pages || ''}" min="1">
            </div>
            <div class="form-group">
              <label class="form-label">Formato</label>
              <select class="form-select" id="book-format">
                <option value="">Seleccionar...</option>
                <option value="hardcover" ${book?.format === 'hardcover' ? 'selected' : ''}>Tapa dura</option>
                <option value="paperback" ${book?.format === 'paperback' ? 'selected' : ''}>Tapa blanda</option>
                <option value="ebook" ${book?.format === 'ebook' ? 'selected' : ''}>E-book</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Género</label>
              <input type="text" class="form-input" id="book-genre" value="${book?.genre || ''}" placeholder="Novela, Ciencia ficción...">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea class="form-textarea" id="book-description" rows="3">${book?.description || ''}</textarea>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">Ubicación</label>
              <input type="text" class="form-input" id="book-location" value="${book?.location || ''}" placeholder="Estante A, Caja 3...">
            </div>
            <div class="form-group">
              <label class="form-label">Condición</label>
              <select class="form-select" id="book-condition">
                <option value="">Seleccionar...</option>
                <option value="excellent" ${book?.condition === 'excellent' ? 'selected' : ''}>Excelente</option>
                <option value="good" ${book?.condition === 'good' ? 'selected' : ''}>Bueno</option>
                <option value="fair" ${book?.condition === 'fair' ? 'selected' : ''}>Regular</option>
                <option value="poor" ${book?.condition === 'poor' ? 'selected' : ''}>Malo</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Estado de lectura</label>
              <select class="form-select" id="book-read-status">
                <option value="unread" ${(book?.read_status || 'unread') === 'unread' ? 'selected' : ''}>No leído</option>
                <option value="reading" ${book?.read_status === 'reading' ? 'selected' : ''}>Leyendo</option>
                <option value="completed" ${book?.read_status === 'completed' ? 'selected' : ''}>Completado</option>
              </select>
            </div>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">Fecha de adquisición</label>
              <input type="date" class="form-input" id="book-acquisition-date" value="${book?.acquisition_date || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Fuente</label>
              <select class="form-select" id="book-acquisition-source">
                <option value="">Seleccionar...</option>
                <option value="purchase" ${book?.acquisition_source === 'purchase' ? 'selected' : ''}>Compra</option>
                <option value="gift" ${book?.acquisition_source === 'gift' ? 'selected' : ''}>Regalo</option>
                <option value="exchange" ${book?.acquisition_source === 'exchange' ? 'selected' : ''}>Intercambio</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Precio</label>
              <input type="number" class="form-input" id="book-price" value="${book?.purchase_price || ''}" min="0" step="0.01">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Tags</label>
            <input type="text" class="form-input" id="book-tags" value="${book?.tags ? JSON.parse(book.tags).join(', ') : ''}" placeholder="Separados por coma">
          </div>

          <div class="form-group">
            <label class="form-label">Notas</label>
            <textarea class="form-textarea" id="book-notes" rows="2">${book?.notes || ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-checkbox">
                <input type="checkbox" id="book-favorite" ${book?.favorite ? 'checked' : ''}>
                Favorito
              </label>
            </div>
            <div class="form-group">
              <label class="form-checkbox">
                <input type="checkbox" id="book-loanable" ${book?.loanable !== 0 ? 'checked' : ''}>
                Disponible para préstamo
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Portada</label>
            <div class="form-inline">
              <input type="text" class="form-input" id="book-cover-url" value="${book?.cover_url || ''}" readonly placeholder="Sin portada seleccionada">
              <button type="button" class="btn btn-secondary" id="book-cover-select">Seleccionar imagen</button>
            </div>
            <div id="book-cover-preview" class="mt-md"></div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="book-form-cancel">Cancelar</button>
            <button type="submit" class="btn btn-primary">${book ? 'Guardar cambios' : 'Crear libro'}</button>
          </div>
        </form>
      </div>
    `;

    // Initialize author selector
    const selectorContainer = container.querySelector('#author-selector-container');
    authorSelectorInstance = AuthorSelector.render(selectorContainer, {
      selectedAuthors: bookAuthors.map((ba) => ({
        id: ba.author_id || ba.id,
        name: ba.name || ba.author_name,
        role: ba.role || 'author',
        author_order: ba.author_order || 1,
      })),
    });

    // Form submission
    container.querySelector('#book-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSubmit(bookId);
    });
    container.querySelector('#book-form-cancel').addEventListener('click', () => {
      Router.navigate('books');
    });
    container.querySelector('#book-cover-select').addEventListener('click', async () => {
      await handleSelectCover(container);
    });
    renderCoverPreview(container, book?.cover_url || '');
  }

  function renderCoverPreview(container, coverUrl) {
    const preview = container.querySelector('#book-cover-preview');
    if (!preview) return;

    if (!coverUrl) {
      preview.innerHTML = '<span class="text-muted text-sm">No hay portada seleccionada</span>';
      return;
    }

    preview.innerHTML = `
      <img
        src="${coverUrl}"
        alt="Vista previa de portada"
        style="max-width: 140px; max-height: 200px; border-radius: 8px; border: 1px solid var(--color-border); object-fit: cover;"
      >
    `;
  }

  async function handleSelectCover(container) {
    const selected = await window.api.system.selectFile({
      filters: [
        {
          name: 'Imágenes',
          extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        },
      ],
    });

    if (!selected.success) {
      return;
    }

    const uploaded = await window.api.books.uploadCover(selected.data);
    if (!uploaded.success) {
      Toast.error(uploaded.error || 'No se pudo subir la portada');
      return;
    }

    const input = container.querySelector('#book-cover-url');
    input.value = uploaded.data;
    renderCoverPreview(container, uploaded.data);
    Toast.success('Portada cargada');
  }

  async function handleSubmit(bookId) {
    const tags = document.getElementById('book-tags').value;
    const data = {
      title: document.getElementById('book-title').value.trim(),
      subtitle: document.getElementById('book-subtitle').value.trim() || null,
      isbn: document.getElementById('book-isbn').value.trim() || null,
      publisher: document.getElementById('book-publisher').value.trim() || null,
      publication_date: document.getElementById('book-publication-date').value || null,
      edition: document.getElementById('book-edition').value.trim() || null,
      language: document.getElementById('book-language').value,
      pages: parseInt(document.getElementById('book-pages').value) || null,
      format: document.getElementById('book-format').value || null,
      genre: document.getElementById('book-genre').value.trim() || null,
      tags: tags ? JSON.stringify(tags.split(',').map((t) => t.trim()).filter(Boolean)) : null,
      description: document.getElementById('book-description').value.trim() || null,
      cover_url: document.getElementById('book-cover-url').value.trim() || null,
      location: document.getElementById('book-location').value.trim() || null,
      condition: document.getElementById('book-condition').value || null,
      read_status: document.getElementById('book-read-status').value,
      acquisition_date: document.getElementById('book-acquisition-date').value || null,
      acquisition_source: document.getElementById('book-acquisition-source').value || null,
      purchase_price: parseFloat(document.getElementById('book-price').value) || null,
      favorite: document.getElementById('book-favorite').checked ? 1 : 0,
      loanable: document.getElementById('book-loanable').checked ? 1 : 0,
      notes: document.getElementById('book-notes').value.trim() || null,
      authors: authorSelectorInstance?.getAuthors() || [],
    };

    if (!data.title) {
      Toast.warning('El título es obligatorio');
      return;
    }

    try {
      let result;
      if (bookId) {
        result = await window.api.books.update(bookId, data);
      } else {
        result = await window.api.books.create(data);
      }

      if (result.success) {
        Toast.success(bookId ? 'Libro actualizado' : 'Libro creado');
        SearchBar.loadData();
        Router.navigate('book-detail', { id: result.data.id || bookId });
      } else {
        Toast.error(result.error || 'Error al guardar');
      }
    } catch (e) {
      Toast.error('Error al guardar el libro');
    }
  }

  return { render };
})();
