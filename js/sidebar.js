/* ============================================
   SIDEBAR.JS — Navegação entre modos
   ============================================ */

const Sidebar = {
  el: null,
  overlay: null,
  navList: null,
  breadcrumb: null,
  modes: {},
  currentMode: null,

  init() {
    this.el = document.getElementById('sidebar');
    this.overlay = document.getElementById('sidebarOverlay');
    this.navList = document.getElementById('navList');
    this.breadcrumb = document.getElementById('breadcrumb');

    // Botão hamburger (mobile)
    document.getElementById('menuBtn').addEventListener('click', () => this.toggleMobile());
    // Overlay
    this.overlay.addEventListener('click', () => this.closeMobile());
    // Botão toggle (desktop)
    document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleCollapse());

    // Fecha sidebar ao clicar em item em mobile
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) this.closeMobile();
    });
  },

  /**
   * Registra um modo no sistema.
   * Padrão: { id, nome, icone, enabled, init, destroy }
   */
  register(modo) {
    this.modes[modo.id] = modo;
    this.renderNav();
  },

  renderNav() {
    this.navList.innerHTML = '';
    Object.values(this.modes).forEach(modo => {
      const li = Utils.el('li', {
        class: `nav-item ${!modo.enabled ? 'disabled' : ''}`,
        'data-mode': modo.id,
        title: modo.nome
      });
      li.innerHTML = `
        <i class="fa-solid ${modo.icone}"></i>
        <span class="nav-label">${Utils.escapeHtml(modo.nome)}</span>
        ${!modo.enabled ? '<span class="badge-soon">em breve</span>' : ''}
      `;
      if (modo.enabled) {
        li.addEventListener('click', () => this.navigate(modo.id));
      }
      this.navList.appendChild(li);
    });
  },

  async navigate(modeId) {
    const modo = this.modes[modeId];
    if (!modo || !modo.enabled) {
      Toast.warning('Este modo está em desenvolvimento.');
      return;
    }

    // Destroy do modo anterior
    if (this.currentMode && this.modes[this.currentMode]?.destroy) {
      try { this.modes[this.currentMode].destroy(); } catch (e) { console.warn(e); }
    }

    this.currentMode = modeId;

    // Atualiza nav
    Utils.$$('.nav-item', this.navList).forEach(el => {
      el.classList.toggle('active', el.dataset.mode === modeId);
    });

    // Atualiza breadcrumb
    this.breadcrumb.innerHTML = `
      <i class="fa-solid fa-house"></i>
      <span>Início</span>
      <span class="sep">/</span>
      <strong>${Utils.escapeHtml(modo.nome)}</strong>
    `;

    // Renderiza conteúdo do modo
    const content = document.getElementById('content');
    content.innerHTML = '';
    try {
      await modo.init(content);
    } catch (e) {
      console.error(e);
      Toast.error('Erro ao carregar o modo: ' + e.message);
    }

    // Fecha sidebar em mobile
    if (window.innerWidth <= 900) this.closeMobile();
  },

  toggleMobile() {
    this.el.classList.toggle('open');
    this.overlay.classList.toggle('active');
  },

  closeMobile() {
    this.el.classList.remove('open');
    this.overlay.classList.remove('active');
  },

  toggleCollapse() {
    this.el.classList.toggle('collapsed');
    Utils.storageSet('excel_organizer_sidebar_collapsed', this.el.classList.contains('collapsed'));
  },

  restoreCollapse() {
    const collapsed = Utils.storageGet('excel_organizer_sidebar_collapsed', false);
    if (collapsed) this.el.classList.add('collapsed');
  }
};