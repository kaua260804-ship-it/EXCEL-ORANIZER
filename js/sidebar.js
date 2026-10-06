/* ============================================
   SIDEBAR.JS — Navegação entre modos
   ============================================
   Modos registrados em js/main.js via Sidebar.register().
   Modos ativos hoje:
     - curva-abc   (📊 Curva ABC)
     - reorganizar (📑 Reorganizar Códigos)
   Placeholders:
     - estoque, vendas, cadastro
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

    document.getElementById('menuBtn').addEventListener('click', () => this.toggleMobile());
    this.overlay.addEventListener('click', () => this.closeMobile());
    document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleCollapse());

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) this.closeMobile();
    });
  },

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

    if (this.currentMode && this.modes[this.currentMode]?.destroy) {
      try { this.modes[this.currentMode].destroy(); } catch (e) { console.warn(e); }
    }

    this.currentMode = modeId;

    Utils.$$('.nav-item', this.navList).forEach(el => {
      el.classList.toggle('active', el.dataset.mode === modeId);
    });

    this.breadcrumb.innerHTML = `
      <i class="fa-solid fa-house"></i>
      <span>Início</span>
      <span class="sep">/</span>
      <strong>${Utils.escapeHtml(modo.nome)}</strong>
    `;

    const content = document.getElementById('content');
    content.innerHTML = '';
    try {
      await modo.init(content);
    } catch (e) {
      console.error(e);
      Toast.error('Erro ao carregar o modo: ' + e.message);
    }

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
