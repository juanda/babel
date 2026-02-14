/**
 * Gestión de usuarios prestatarios
 */
const UserForm = (() => {
  async function renderList(container) {
    container.innerHTML = '<div class="spinner"></div>';

    try {
      const result = await window.api.users.getAll();
      const users = result.success ? result.data : [];

      let html = `
        <div class="view-header">
          <span class="text-secondary text-sm">${users.length} usuario${users.length !== 1 ? 's' : ''}</span>
          <button class="btn btn-primary" id="users-new-btn">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Usuario
          </button>
        </div>
      `;

      if (users.length === 0) {
        html += `
          <div class="empty-state">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>
            <p>No hay usuarios registrados</p>
          </div>
        `;
      } else {
        html += `
          <div class="table-container">
            <table class="data-table">
              <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Confianza</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
        `;
        users.forEach((u) => {
          html += `
            <tr>
              <td><strong>${u.name}</strong></td>
              <td>${u.email || '-'}</td>
              <td>${u.phone || '-'}</td>
              <td>${StarRating.display(u.trust_level)}</td>
              <td>${u.active ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-secondary">Inactivo</span>'}</td>
              <td class="table-actions">
                <button class="icon-btn js-user-edit" data-id="${u.id}" title="Editar">
                  <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="icon-btn js-user-delete" data-id="${u.id}" title="Eliminar">
                  <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </td>
            </tr>
          `;
        });
        html += '</tbody></table></div>';
      }

      container.innerHTML = html;
      const newBtn = container.querySelector('#users-new-btn');
      if (newBtn) {
        newBtn.addEventListener('click', () => showModal());
      }

      container.querySelectorAll('.js-user-edit').forEach((btn) => {
        btn.addEventListener('click', () => {
          showModal(Number(btn.dataset.id));
        });
      });

      container.querySelectorAll('.js-user-delete').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = Number(btn.dataset.id);
          const user = users.find((u) => u.id === id);
          deleteUser(id, user?.name || 'este usuario');
        });
      });
    } catch (e) {
      container.innerHTML = '<p class="text-muted">Error al cargar usuarios</p>';
    }
  }

  async function showModal(userId = null) {
    let user = null;
    if (userId) {
      const result = await window.api.users.getById(userId);
      if (result.success) user = result.data;
    }

    const content = `
      <form id="user-form">
        <div class="form-group">
          <label class="form-label">Nombre <span class="required">*</span></label>
          <input type="text" class="form-input" id="user-name" value="${user?.name || ''}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="user-email" value="${user?.email || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="text" class="form-input" id="user-phone" value="${user?.phone || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input type="text" class="form-input" id="user-address" value="${user?.address || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Nivel de confianza</label>
          <select class="form-select" id="user-trust">
            ${[1, 2, 3, 4, 5].map((i) => `<option value="${i}" ${(user?.trust_level || 3) === i ? 'selected' : ''}>${i} - ${'★'.repeat(i)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="user-notes" rows="2">${user?.notes || ''}</textarea>
        </div>
        ${user ? `
          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" id="user-active" ${user.active ? 'checked' : ''}>
              Usuario activo
            </label>
          </div>
        ` : ''}
      </form>
    `;

    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;width:100%';
    footer.innerHTML = `
      <button class="btn btn-secondary" id="user-cancel">Cancelar</button>
      <button class="btn btn-primary" id="user-submit">${user ? 'Guardar' : 'Crear'}</button>
    `;

    Modal.open({ title: user ? 'Editar Usuario' : 'Nuevo Usuario', content, footer });
    document.getElementById('user-cancel').addEventListener('click', () => Modal.close());

    document.getElementById('user-submit').addEventListener('click', async () => {
      const data = {
        name: document.getElementById('user-name').value.trim(),
        email: document.getElementById('user-email').value.trim() || null,
        phone: document.getElementById('user-phone').value.trim() || null,
        address: document.getElementById('user-address').value.trim() || null,
        trust_level: parseInt(document.getElementById('user-trust').value),
        notes: document.getElementById('user-notes').value.trim() || null,
      };

      if (user) {
        const activeEl = document.getElementById('user-active');
        if (activeEl) data.active = activeEl.checked ? 1 : 0;
      }

      if (!data.name) {
        Toast.warning('El nombre es obligatorio');
        return;
      }

      let result;
      if (userId) {
        result = await window.api.users.update(userId, data);
      } else {
        result = await window.api.users.create(data);
      }

      if (result.success) {
        Modal.close();
        Toast.success(userId ? 'Usuario actualizado' : 'Usuario creado');
        Router.navigate('users');
      } else {
        Toast.error(result.error || 'Error al guardar');
      }
    });
  }

  async function deleteUser(id, name) {
    const confirmed = await Modal.confirm({
      title: 'Eliminar Usuario',
      message: `¿Eliminar a "${name}"?`,
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!confirmed) return;

    const result = await window.api.users.delete(id);
    if (result.success) {
      Toast.success('Usuario eliminado');
      Router.navigate('users');
    } else {
      Toast.error(result.error || 'Error al eliminar');
    }
  }

  return { renderList, showModal, deleteUser };
})();
