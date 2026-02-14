/**
 * Formulario de autores (página completa y modal)
 */
const AuthorForm = (() => {
  async function render(container, authorId = null) {
    let author = null;

    if (authorId) {
      const result = await window.api.authors.getById(authorId);
      if (result.success) author = result.data;
    }

    container.innerHTML = `
      <div class="detail-card">
        <h2>${author ? 'Editar Autor' : 'Nuevo Autor'}</h2>
        <form id="author-form" class="mt-lg">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre <span class="required">*</span></label>
              <input type="text" class="form-input" id="author-name" value="${author?.name || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Nacionalidad</label>
              <input type="text" class="form-input" id="author-nationality" value="${author?.nationality || ''}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fecha de nacimiento</label>
              <input type="date" class="form-input" id="author-birth-date" value="${author?.birth_date || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de fallecimiento</label>
              <input type="date" class="form-input" id="author-death-date" value="${author?.death_date || ''}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Biografía</label>
            <textarea class="form-textarea" id="author-biography" rows="4">${author?.biography || ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Foto (URL)</label>
              <input type="text" class="form-input" id="author-photo" value="${author?.photo_url || ''}" placeholder="https://...">
            </div>
            <div class="form-group">
              <label class="form-label">Sitio web</label>
              <input type="text" class="form-input" id="author-website" value="${author?.website || ''}" placeholder="https://...">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notas</label>
            <textarea class="form-textarea" id="author-notes" rows="2">${author?.notes || ''}</textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="Router.navigate('authors')">Cancelar</button>
            <button type="submit" class="btn btn-primary">${author ? 'Guardar cambios' : 'Crear autor'}</button>
          </div>
        </form>
      </div>
    `;

    container.querySelector('#author-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSubmit(authorId);
    });
  }

  async function handleSubmit(authorId) {
    const data = {
      name: document.getElementById('author-name').value.trim(),
      nationality: document.getElementById('author-nationality').value.trim() || null,
      birth_date: document.getElementById('author-birth-date').value || null,
      death_date: document.getElementById('author-death-date').value || null,
      biography: document.getElementById('author-biography').value.trim() || null,
      photo_url: document.getElementById('author-photo').value.trim() || null,
      website: document.getElementById('author-website').value.trim() || null,
      notes: document.getElementById('author-notes').value.trim() || null,
    };

    if (!data.name) {
      Toast.warning('El nombre es obligatorio');
      return;
    }

    try {
      let result;
      if (authorId) {
        result = await window.api.authors.update(authorId, data);
      } else {
        result = await window.api.authors.create(data);
      }

      if (result.success) {
        Toast.success(authorId ? 'Autor actualizado' : 'Autor creado');
        SearchBar.loadData();
        Router.navigate('author-detail', { id: result.data?.id || authorId });
      } else {
        Toast.error(result.error || 'Error al guardar');
      }
    } catch (e) {
      Toast.error('Error al guardar el autor');
    }
  }

  return { render };
})();
