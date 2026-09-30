/* ============================================
   TOAST.JS — Notificações toast
   ============================================ */

const Toast = {
  container: null,
  counter: 0,

  init() {
    this.container = document.getElementById('toastContainer');
  },

  show(message, type = 'info', title = '', duration = 4000) {
    if (!this.container) this.init();

    const icons = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };

    const titles = {
      success: 'Sucesso',
      error: 'Erro',
      warning: 'Atenção',
      info: 'Informação'
    };

    const id = `toast-${++this.counter}`;

    const toast = Utils.el('div', { class: `toast toast-${type}`, id });
    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${icons[type] || icons.info}"></i></div>
      <div class="toast-body">
        <div class="toast-title">${Utils.escapeHtml(title || titles[type] || '')}</div>
        <div class="toast-msg">${Utils.escapeHtml(message)}</div>
      </div>
      <button class="toast-close" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
    `;

    const close = () => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    };

    toast.querySelector('.toast-close').addEventListener('click', close);

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(close, duration);
    }

    return { close };
  },

  success(msg, title) { return this.show(msg, 'success', title); },
  error(msg, title) { return this.show(msg, 'error', title, 6000); },
  warning(msg, title) { return this.show(msg, 'warning', title); },
  info(msg, title) { return this.show(msg, 'info', title); }
};