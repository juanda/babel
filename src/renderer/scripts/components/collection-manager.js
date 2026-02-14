const CollectionManager = (() => {
  async function render(container) {
    container.innerHTML = '<div class="spinner"></div>';
    const result = await window.api.collections.getAll();
    const collections = result.success ? result.data : [];

    container.innerHTML = `
      <div class="view-header">
        <span class="text-secondary text-sm">${collections.length} colección(es)</span>
        <button class="btn btn-primary" id="collection-new">Nueva colección</button>
      </div>
      <div class="table-container mt-md">
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>Descripción</th><th>Libros</th><th>Acciones</th></tr></thead>
          <tbody>
            ${collections
              .map(
                (c) => `<tr>
                  <td>${c.name}</td>
                  <td>${c.description || '-'}</td>
                  <td>${c.book_count || 0}</td>
                  <td class="table-actions">
                    <button class="btn btn-sm btn-secondary" onclick="CollectionManager.edit(${c.id})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="CollectionManager.remove(${c.id})">Eliminar</button>
                  </td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('collection-new').addEventListener('click', () => openModal());
  }

  function openModal(collection = null) {
    const content = `
      <div class="form-group">
        <label class="form-label">Nombre</label>
        <input class="form-input" id="collection-name" value="${collection?.name || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea class="form-textarea" id="collection-description">${collection?.description || ''}</textarea>
      </div>
    `;

    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;width:100%';
    footer.innerHTML = `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
      <button class="btn btn-primary" id="collection-save">Guardar</button>
    `;

    Modal.open({ title: collection ? 'Editar colección' : 'Nueva colección', content, footer, size: 'sm' });

    document.getElementById('collection-save').addEventListener('click', async () => {
      const payload = {
        name: document.getElementById('collection-name').value.trim(),
        description: document.getElementById('collection-description').value.trim() || null,
      };

      if (!payload.name) {
        Toast.warning('El nombre es obligatorio');
        return;
      }

      const res = collection
        ? await window.api.collections.update(collection.id, payload)
        : await window.api.collections.create(payload);

      if (!res.success) {
        Toast.error(res.error || 'No se pudo guardar');
        return;
      }

      Modal.close();
      Toast.success('Colección guardada');
      Router.navigate('collections');
    });
  }

  async function edit(id) {
    const result = await window.api.collections.getById(id);
    if (!result.success || !result.data) {
      Toast.error('Colección no encontrada');
      return;
    }
    openModal(result.data);
  }

  async function remove(id) {
    const ok = await Modal.confirm({
      title: 'Eliminar colección',
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      danger: true,
    });

    if (!ok) return;

    const result = await window.api.collections.delete(id);
    if (result.success) {
      Toast.success('Colección eliminada');
      Router.navigate('collections');
    } else {
      Toast.error(result.error || 'No se pudo eliminar');
    }
  }

  return { render, edit, remove };
})();
