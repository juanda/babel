/**
 * Sistema de modales
 */
const Modal = (() => {
  const overlay = () => document.getElementById('modal-container');
  const modalEl = () => document.getElementById('modal');
  const titleEl = () => document.getElementById('modal-title');
  const bodyEl = () => document.getElementById('modal-body');
  const footerEl = () => document.getElementById('modal-footer');
  const closeBtn = () => document.getElementById('modal-close');

  let onCloseCallback = null;

  function init() {
    closeBtn().addEventListener('click', close);
    overlay().addEventListener('click', (e) => {
      if (e.target === overlay()) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay().classList.contains('hidden')) {
        close();
      }
    });
  }

  function open({ title, content, footer, size, onClose }) {
    titleEl().textContent = title || '';
    bodyEl().innerHTML = typeof content === 'string' ? content : '';
    if (typeof content !== 'string' && content instanceof HTMLElement) {
      bodyEl().innerHTML = '';
      bodyEl().appendChild(content);
    }

    if (footer) {
      footerEl().innerHTML = typeof footer === 'string' ? footer : '';
      if (typeof footer !== 'string' && footer instanceof HTMLElement) {
        footerEl().innerHTML = '';
        footerEl().appendChild(footer);
      }
      footerEl().classList.remove('hidden');
    } else {
      footerEl().classList.add('hidden');
    }

    modalEl().className = 'modal' + (size ? ` modal-${size}` : '');
    onCloseCallback = onClose || null;
    overlay().classList.remove('hidden');
  }

  function close() {
    overlay().classList.add('hidden');
    bodyEl().innerHTML = '';
    footerEl().innerHTML = '';
    if (onCloseCallback) {
      onCloseCallback();
      onCloseCallback = null;
    }
  }

  function confirm({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false }) {
    return new Promise((resolve) => {
      const footerDiv = document.createElement('div');
      footerDiv.style.display = 'flex';
      footerDiv.style.gap = '8px';
      footerDiv.style.justifyContent = 'flex-end';
      footerDiv.style.width = '100%';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.textContent = cancelText;
      cancelBtn.addEventListener('click', () => { close(); resolve(false); });

      const confirmBtn = document.createElement('button');
      confirmBtn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
      confirmBtn.textContent = confirmText;
      confirmBtn.addEventListener('click', () => { close(); resolve(true); });

      footerDiv.appendChild(cancelBtn);
      footerDiv.appendChild(confirmBtn);

      open({
        title,
        content: `<p class="confirm-message">${message}</p>`,
        footer: footerDiv,
        size: 'sm',
      });
    });
  }

  return { init, open, close, confirm };
})();
