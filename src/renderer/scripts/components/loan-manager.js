/**
 * Gestor de préstamos
 */
const LoanManager = (() => {
  async function render(container) {
    container.innerHTML = '<div class="spinner"></div>';

    try {
      const [activeRes, overdueRes] = await Promise.all([
        window.api.loans.getActive(),
        window.api.loans.getOverdue(),
      ]);

      const activeLoans = activeRes.success ? activeRes.data : [];
      const overdueLoans = overdueRes.success ? overdueRes.data : [];

      let html = `
        <div class="view-header">
          <div>
            <span class="text-secondary text-sm">${activeLoans.length} préstamo${activeLoans.length !== 1 ? 's' : ''} activo${activeLoans.length !== 1 ? 's' : ''}</span>
            ${overdueLoans.length > 0 ? `<span class="badge badge-error ml-sm">${overdueLoans.length} vencido${overdueLoans.length !== 1 ? 's' : ''}</span>` : ''}
          </div>
          <button class="btn btn-primary" id="loan-new-btn">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Préstamo
          </button>
        </div>
      `;

      if (activeLoans.length === 0) {
        html += `
          <div class="empty-state">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            <p>No hay préstamos activos</p>
          </div>
        `;
      } else {
        html += `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Libro</th>
                  <th>Prestado a</th>
                  <th>Fecha préstamo</th>
                  <th>Fecha devolución</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
        `;

        activeLoans.forEach((loan) => {
          const isOverdue = loan.status === 'overdue';
          const dueDate = new Date(loan.due_date);
          const today = new Date();
          const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

          html += `
            <tr>
              <td><strong>${loan.book_title || 'Libro #' + loan.book_id}</strong></td>
              <td>${loan.user_name || 'Usuario #' + loan.user_id}</td>
              <td>${formatDate(loan.loan_date)}</td>
              <td>${formatDate(loan.due_date)}</td>
              <td>
                ${isOverdue
                  ? '<span class="badge badge-error">Vencido</span>'
                  : daysLeft <= 3
                    ? `<span class="badge badge-warning">Vence en ${daysLeft}d</span>`
                    : '<span class="badge badge-success">Activo</span>'
                }
              </td>
              <td class="table-actions">
                <button class="btn btn-sm btn-success js-loan-return" data-id="${loan.id}">Devolver</button>
              </td>
            </tr>
          `;
        });

        html += '</tbody></table></div>';
      }

      // Historial
      html += `
        <div class="mt-lg">
          <h3>Historial de Préstamos</h3>
          <button class="btn btn-secondary btn-sm mt-md" id="loan-load-history">Cargar historial</button>
          <div id="loan-history" class="mt-md"></div>
        </div>
      `;

      container.innerHTML = html;
      container.querySelector('#loan-new-btn')?.addEventListener('click', () => showCreateModal());
      container.querySelector('#loan-load-history')?.addEventListener('click', () => loadHistory());
      container.querySelectorAll('.js-loan-return').forEach((btn) => {
        btn.addEventListener('click', () => returnLoan(Number(btn.dataset.id)));
      });
    } catch (e) {
      container.innerHTML = '<p class="text-muted">Error al cargar préstamos</p>';
    }
  }

  async function showCreateModal() {
    const [booksRes, usersRes] = await Promise.all([
      window.api.books.getAll({}),
      window.api.users.getAll(),
    ]);

    const books = booksRes.success ? booksRes.data.filter((b) => b.loanable) : [];
    const users = usersRes.success ? usersRes.data.filter((u) => u.active) : [];

    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 14);

    const content = `
      <form id="loan-form">
        <div class="form-group">
          <label class="form-label">Libro <span class="required">*</span></label>
          <select class="form-select" id="loan-book" required>
            <option value="">Seleccionar libro...</option>
            ${books.map((b) => `<option value="${b.id}">${b.title}${b.authors ? ' - ' + b.authors : ''}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Prestar a <span class="required">*</span></label>
          <select class="form-select" id="loan-user" required>
            <option value="">Seleccionar usuario...</option>
            ${users.map((u) => `<option value="${u.id}">${u.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha de préstamo</label>
            <input type="date" class="form-input" id="loan-date" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label class="form-label">Fecha de devolución</label>
            <input type="date" class="form-input" id="loan-due-date" value="${defaultDue.toISOString().split('T')[0]}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Condición del libro</label>
          <select class="form-select" id="loan-condition">
            <option value="excellent">Excelente</option>
            <option value="good" selected>Bueno</option>
            <option value="fair">Regular</option>
            <option value="poor">Malo</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="loan-notes" rows="2"></textarea>
        </div>
      </form>
    `;

    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;width:100%';
    footer.innerHTML = `
      <button class="btn btn-secondary" id="loan-cancel">Cancelar</button>
      <button class="btn btn-primary" id="loan-submit">Crear préstamo</button>
    `;

    Modal.open({ title: 'Nuevo Préstamo', content, footer });
    document.getElementById('loan-cancel').addEventListener('click', () => Modal.close());

    document.getElementById('loan-submit').addEventListener('click', async () => {
      const data = {
        book_id: parseInt(document.getElementById('loan-book').value),
        user_id: parseInt(document.getElementById('loan-user').value),
        loan_date: document.getElementById('loan-date').value,
        due_date: document.getElementById('loan-due-date').value,
        condition_on_loan: document.getElementById('loan-condition').value,
        notes: document.getElementById('loan-notes').value.trim() || null,
      };

      if (!data.book_id || !data.user_id) {
        Toast.warning('Selecciona libro y usuario');
        return;
      }

      const result = await window.api.loans.create(data);
      if (result.success) {
        Modal.close();
        Toast.success('Préstamo creado');
        Router.navigate('loans');
      } else {
        Toast.error(result.error || 'Error al crear préstamo');
      }
    });
  }

  async function returnLoan(loanId) {
    const content = `
      <div class="form-group">
        <label class="form-label">Condición al devolver</label>
        <select class="form-select" id="return-condition">
          <option value="excellent">Excelente</option>
          <option value="good" selected>Bueno</option>
          <option value="fair">Regular</option>
          <option value="poor">Malo</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea class="form-textarea" id="return-notes" rows="2"></textarea>
      </div>
    `;

    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;width:100%';
    footer.innerHTML = `
      <button class="btn btn-secondary" id="return-cancel">Cancelar</button>
      <button class="btn btn-success" id="return-submit">Confirmar devolución</button>
    `;

    Modal.open({ title: 'Devolver Libro', content, footer, size: 'sm' });
    document.getElementById('return-cancel').addEventListener('click', () => Modal.close());

    document.getElementById('return-submit').addEventListener('click', async () => {
      const data = {
        condition_on_return: document.getElementById('return-condition').value,
        notes: document.getElementById('return-notes').value.trim() || null,
      };

      const result = await window.api.loans.return(loanId, data);
      if (result.success) {
        Modal.close();
        Toast.success('Libro devuelto');
        Router.navigate('loans');
      } else {
        Toast.error(result.error || 'Error al devolver');
      }
    });
  }

  async function loadHistory() {
    const historyEl = document.getElementById('loan-history');
    if (!historyEl) return;

    const result = await window.api.loans.getAll({ status: 'returned' });
    if (!result.success || result.data.length === 0) {
      historyEl.innerHTML = '<p class="text-muted text-sm">Sin historial de préstamos</p>';
      return;
    }

    let html = `
      <div class="table-container">
        <table class="data-table">
          <thead><tr><th>Libro</th><th>Usuario</th><th>Préstamo</th><th>Devolución</th></tr></thead>
          <tbody>
    `;

    result.data.forEach((loan) => {
      html += `<tr>
        <td>${loan.book_title || ''}</td>
        <td>${loan.user_name || ''}</td>
        <td>${formatDate(loan.loan_date)}</td>
        <td>${formatDate(loan.return_date)}</td>
      </tr>`;
    });

    html += '</tbody></table></div>';
    historyEl.innerHTML = html;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  return { render, showCreateModal, returnLoan, loadHistory };
})();
