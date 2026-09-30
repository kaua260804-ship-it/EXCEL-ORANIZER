/* ============================================
   MAIN.JS — Inicialização geral
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Ano do rodapé
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Tema
  initTheme();

  // Sidebar
  Sidebar.init();
  Sidebar.restoreCollapse();

  // Toasts
  Toast.init();

  // Registro dos modos
  Sidebar.register(ModoCurvaABC);

  // Modos futuros (placeholders)
  Sidebar.register({
    id: 'estoque', nome: 'Estoque', icone: 'fa-boxes-stacked', enabled: false
  });
  Sidebar.register({
    id: 'vendas', nome: 'Vendas', icone: 'fa-cart-shopping', enabled: false
  });
  Sidebar.register({
    id: 'cadastro', nome: 'Cadastro', icone: 'fa-clipboard-list', enabled: false
  });

  // Navegação inicial
  Sidebar.navigate('curva-abc');

  // Botão de tema
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);

  // Botão de histórico (modal)
  document.getElementById('historyBtn').addEventListener('click', openHistory);

  // Fechar modal
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.remove('active');
    });
  });
  document.getElementById('historyModal').addEventListener('click', (e) => {
    if (e.target.id === 'historyModal') e.target.classList.remove('active');
  });

  // Atalhos de teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    }
  });

  console.log(`${CONFIG.APP_NAME} v${CONFIG.APP_VERSION} iniciado.`);
});

/* ---------- TEMA ---------- */

function initTheme() {
  const saved = Utils.storageGet(CONFIG.STORAGE_KEYS.THEME, 'light');
  if (saved === 'dark') {
    document.body.classList.add('dark-theme');
    updateThemeIcon(true);
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  Utils.storageSet(CONFIG.STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  btn.innerHTML = isDark
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

/* ---------- HISTÓRICO ---------- */

function openHistory() {
  const modal = document.getElementById('historyModal');
  const body = document.getElementById('historyBody');
  const history = Utils.storageGet(CONFIG.STORAGE_KEYS.HISTORY, []);

  if (history.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <p>Nenhum processamento registrado ainda.</p>
        <p style="font-size:.8rem;margin-top:8px">Os últimos ${CONFIG.HISTORY_LIMIT} processamentos aparecerão aqui.</p>
      </div>
    `;
  } else {
    body.innerHTML = history.map((h, i) => {
      const d = new Date(h.date);
      const dateStr = d.toLocaleString('pt-BR');
      return `
        <div class="history-item">
          <div class="hi-icon"><i class="fa-solid fa-file-excel"></i></div>
          <div class="hi-body">
            <div class="hi-title" title="${Utils.escapeHtml(h.file)}">${Utils.escapeHtml(h.file)}</div>
            <div class="hi-meta">${dateStr} · ${Utils.formatNumber(h.count, 0)} registros · ${Utils.formatNumber(h.stats.totalRows, 0)} linhas lidas</div>
          </div>
          <button class="btn btn-primary btn-sm" data-history-index="${i}">
            <i class="fa-solid fa-download"></i>
          </button>
          <button class="btn btn-danger btn-sm" data-history-remove="${i}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');
  }

  // Re-download
  body.querySelectorAll('[data-history-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.historyIndex, 10);
      const h = history[idx];
      if (!h) return;
      CurvaABCExporter.exportXLSX(h.data, `historico_${idx}`);
      Toast.success('Download do histórico iniciado.');
    });
  });

  // Remover
  body.querySelectorAll('[data-history-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.historyRemove, 10);
      history.splice(idx, 1);
      Utils.storageSet(CONFIG.STORAGE_KEYS.HISTORY, history);
      openHistory(); // re-render
      Toast.info('Item removido do histórico.');
    });
  });

  modal.classList.add('active');
}