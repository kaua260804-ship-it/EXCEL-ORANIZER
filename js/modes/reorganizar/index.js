/* ============================================
   REORGANIZAR/INDEX.JS
   ============================================
   Orquestração do modo "Reorganizar Códigos de Acesso".
   Segue o mesmo padrão do ModoCurvaABC.
   ============================================ */

const ModoReorganizar = {
  id: 'reorganizar',
  nome: 'Reorganizar Códigos',
  icone: 'fa-layer-group',
  enabled: true,

  state: {
    parsed: null,
    selectedSheet: null,
    processed: null
  },

  container: null,

  /* ---------- CICLO DE VIDA ---------- */

  init(container) {
    this.container = container;
    this.renderLayout();
    this.bindEvents();
  },

  destroy() {
    this.container = null;
    this.state = { parsed: null, selectedSheet: null, processed: null };
  },

  /* ---------- LAYOUT ---------- */

  renderLayout() {
    this.container.innerHTML = `
      <div class="reorg-header">
        <h1><i class="fa-solid fa-layer-group"></i> Reorganizar Códigos de Acesso</h1>
        <p>Importe planilhas que tenham a coluna <strong>"COD ACESS"</strong> com múltiplos códigos colados numa única célula (separados por TAB e quebra de linha). Esta ferramenta expande cada código em uma linha própria, corrige notação científica e preserva zeros à esquerda.</p>
      </div>

      <!-- Área de Upload -->
      <div id="reorgUploadArea">
        <div class="upload-zone" id="reorgUploadZone">
          <div class="upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
          <div class="upload-title">Arraste e solte seus arquivos aqui</div>
          <div class="upload-sub">ou clique para selecionar do seu computador</div>
          <input type="file" id="reorgFileInput" accept=".xls,.xlsx,.csv" multiple hidden>
          <div class="upload-formats">
            <span class="badge badge-neutral"><i class="fa-solid fa-file-excel"></i> XLS</span>
            <span class="badge badge-neutral"><i class="fa-solid fa-file-excel"></i> XLSX</span>
            <span class="badge badge-neutral"><i class="fa-solid fa-file-csv"></i> CSV</span>
          </div>
        </div>
      </div>

      <!-- Área de Trabalho -->
      <div id="reorgWorkArea" class="hidden">
        <div class="reorg-file-info" id="reorgFileInfo"></div>

        <!-- Seletor de abas + ações -->
        <div id="reorgSheetSelectorWrap" class="hidden">
          <div class="toolbar">
            <label class="form-label" style="margin:0"><i class="fa-solid fa-layer-group"></i> Aba:</label>
            <select class="form-select" id="reorgSheetSelect"></select>
            <label style="display:flex;align-items:center;gap:6px;font-size:.85rem">
              <input type="checkbox" id="reorgAllSheets"> Processar todas as abas
            </label>
            <div class="spacer"></div>
            <button class="btn btn-primary" id="reorgProcessBtn">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Processar / Limpar
            </button>
            <button class="btn btn-danger" id="reorgClearBtn">
              <i class="fa-solid fa-trash-can"></i> Limpar
            </button>
          </div>
        </div>

        <!-- Progresso -->
        <div class="progress-wrap hidden" id="reorgProgressWrap">
          <div class="progress-label">
            <span id="reorgProgressLabel">Processando…</span>
            <span id="reorgProgressPct">0%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" id="reorgProgressFill"></div></div>
        </div>

        <!-- Preview -->
        <div id="reorgPreviewSection" class="reorg-preview-section hidden">
          <div class="tabs">
            <button class="tab-btn active" data-tab="reorg-tab-original">
              <i class="fa-solid fa-file-lines"></i> Original
            </button>
            <button class="tab-btn" data-tab="reorg-tab-clean">
              <i class="fa-solid fa-broom"></i> Limpo
            </button>
          </div>

          <div class="tab-content active" id="reorg-tab-original">
            <div id="reorgOriginalTable"></div>
          </div>

          <div class="tab-content" id="reorg-tab-clean">
            <!-- Estatísticas -->
            <div id="reorgCleanStatsWrap" class="hidden">
              <div class="card mb-4">
                <div class="card-header">
                  <h3><i class="fa-solid fa-chart-simple"></i> Estatísticas do Processamento</h3>
                </div>
                <div class="reorg-clean-stats" id="reorgCleanStats"></div>
              </div>
            </div>

            <!-- Filtros + Tabela -->
            <div id="reorgFiltersWrap" class="hidden">
              <div class="toolbar">
                <input type="search" class="form-input" id="reorgSearchInput"
                       placeholder="Buscar por SEQ, DESC ou COD ACESS…" style="min-width:240px">
                <select class="form-select" id="reorgCategoriaFilter">
                  <option value="">Todas as categorias</option>
                </select>
                <select class="form-select" id="reorgTipoFilter">
                  <option value="">Todos os tipos</option>
                </select>
                <button class="btn btn-ghost btn-sm" id="reorgResetFilters">
                  <i class="fa-solid fa-rotate-left"></i> Limpar filtros
                </button>
                <div class="spacer"></div>
                <span id="reorgResultCount" style="font-size:.8rem;color:var(--text-secondary)"></span>
              </div>
              <div id="reorgCleanTable"></div>
            </div>
          </div>
        </div>

        <!-- Barra de ações -->
        <div class="reorg-action-bar hidden" id="reorgActionBar">
          <button class="btn btn-outline" id="reorgExportCsvBtn">
            <i class="fa-solid fa-file-csv"></i> CSV
          </button>
          <button class="btn btn-success" id="reorgExportXlsxBtn">
            <i class="fa-solid fa-file-excel"></i> Exportar XLSX
          </button>
        </div>
      </div>
    `;
  },

  /* ---------- EVENTOS ---------- */

  bindEvents() {
    const $ = (sel) => this.container.querySelector(sel);

    // Upload
    const zone = $('#reorgUploadZone');
    const input = $('#reorgFileInput');
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => this.handleFiles(e.target.files));

    ['dragenter', 'dragover'].forEach(ev => {
      zone.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        zone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(ev => {
      zone.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        zone.classList.remove('dragover');
      });
    });
    zone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length) this.handleFiles(files);
    });

    // Ações
    $('#reorgProcessBtn').addEventListener('click', () => this.runProcess());
    $('#reorgClearBtn').addEventListener('click', () => this.reset());

    // Abas
    Utils.$$('.tab-btn', this.container).forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Filtros
    $('#reorgSearchInput').addEventListener('input', Utils.debounce((e) => {
      ReorganizarFilters.setSearch(e.target.value);
      this.refreshCleanTable();
    }, 250));
    $('#reorgCategoriaFilter').addEventListener('change', (e) => {
      ReorganizarFilters.setCategoria(e.target.value);
      this.refreshCleanTable();
    });
    $('#reorgTipoFilter').addEventListener('change', (e) => {
      ReorganizarFilters.setTipocod(e.target.value);
      this.refreshCleanTable();
    });
    $('#reorgResetFilters').addEventListener('click', () => {
      ReorganizarFilters.reset();
      $('#reorgSearchInput').value = '';
      $('#reorgCategoriaFilter').value = '';
      $('#reorgTipoFilter').value = '';
      this.refreshCleanTable();
    });

    // Exportação
    $('#reorgExportXlsxBtn').addEventListener('click', () => this.doExport('xlsx'));
    $('#reorgExportCsvBtn').addEventListener('click', () => this.doExport('csv'));

    // Seleção de aba
    $('#reorgSheetSelect').addEventListener('change', (e) => {
      this.state.selectedSheet = parseInt(e.target.value, 10);
      this.renderOriginalPreview();
    });

    // Ordenação via clique no <th>
    this.container.addEventListener('click', (e) => {
      const th = e.target.closest('th[data-field]');
      if (th && this.state.processed) {
        ReorganizarFilters.setSort(th.dataset.field);
        this.refreshCleanTable(true);
      }
    });
  },

  /* ---------- UPLOAD ---------- */

  async handleFiles(files) {
    const list = Array.from(files);
    if (list.length === 0) return;

    const file = list[0];
    const $ = (sel) => this.container.querySelector(sel);
    const fileInfo = $('#reorgFileInfo');
    fileInfo.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Lendo "${Utils.escapeHtml(file.name)}"…`;

    try {
      const parsed = await FileReaderService.read(file);
      this.state.parsed = parsed;
      this.state.selectedSheet = 0;

      $('#reorgUploadArea').classList.add('hidden');
      $('#reorgWorkArea').classList.remove('hidden');

      this.renderFileInfo();
      this.renderSheetSelector();
      this.renderOriginalPreview();

      Toast.success(`Arquivo "${file.name}" carregado com ${parsed.sheets.length} aba(s).`);
    } catch (err) {
      console.error(err);
      Toast.error('Erro ao ler o arquivo: ' + err.message);
      fileInfo.innerHTML = '';
    }
  },

  renderFileInfo() {
    const p = this.state.parsed;
    const $ = (sel) => this.container.querySelector(sel);
    $('#reorgFileInfo').innerHTML = `
      <i class="fa-solid fa-file-excel"></i>
      <span class="rfi-name">${Utils.escapeHtml(p.name)}</span>
      <span class="rfi-meta">${Utils.formatFileSize(p.size)} · ${p.sheets.length} aba(s)</span>
      <span class="spacer"></span>
      <button class="btn btn-ghost btn-sm" id="reorgNewFileBtn">
        <i class="fa-solid fa-arrow-up-from-bracket"></i> Novo arquivo
      </button>
    `;
    $('#reorgNewFileBtn').addEventListener('click', () => this.reset());
  },

  renderSheetSelector() {
    const $ = (sel) => this.container.querySelector(sel);
    const select = $('#reorgSheetSelect');
    const wrap = $('#reorgSheetSelectorWrap');

    wrap.classList.remove('hidden');

    if (this.state.parsed.sheets.length <= 1) {
      select.innerHTML = `<option value="0">${Utils.escapeHtml(this.state.parsed.sheets[0].name)}</option>`;
      select.disabled = true;
      $('#reorgAllSheets').disabled = true;
    } else {
      select.disabled = false;
      $('#reorgAllSheets').disabled = false;
      select.innerHTML = this.state.parsed.sheets.map((s, i) =>
        `<option value="${i}">${Utils.escapeHtml(s.name)} (${s.rows.length} linhas)</option>`
      ).join('');
    }
  },

  renderOriginalPreview() {
    const sheet = this.state.parsed.sheets[this.state.selectedSheet];
    if (!sheet) return;
    const el = this.container.querySelector('#reorgOriginalTable');
    ReorganizarPreview.renderOriginal(el, sheet.rows);
  },

  /* ---------- PROCESSAMENTO ---------- */

  async runProcess() {
    if (!this.state.parsed) return;

    const $ = (sel) => this.container.querySelector(sel);
    const progressWrap = $('#reorgProgressWrap');
    const progressFill = $('#reorgProgressFill');
    const progressPct = $('#reorgProgressPct');
    const progressLabel = $('#reorgProgressLabel');

    progressWrap.classList.remove('hidden');
    progressLabel.textContent = 'Processando…';
    progressFill.style.width = '0%';
    progressPct.textContent = '0%';

    const steps = [
      { pct: 20, label: 'Lendo linhas…' },
      { pct: 45, label: 'Detectando células sujas…' },
      { pct: 70, label: 'Expandindo códigos multilinha…' },
      { pct: 90, label: 'Corrigindo notação científica…' },
      { pct: 100, label: 'Concluído!' }
    ];

    try {
      const all = $('#reorgAllSheets').checked;
      await this.animateProgress(steps, progressFill, progressPct, progressLabel);

      let result;
      if (all) {
        result = ReorganizarCleaner.processAll(this.state.parsed.sheets);
      } else {
        const sheet = this.state.parsed.sheets[this.state.selectedSheet];
        result = ReorganizarCleaner.process(sheet.rows);
      }

      this.state.processed = result;
      this.renderProcessed();
      this.saveHistory(result);

      Toast.success(
        `Processamento concluído: ${result.data.length} registros ` +
        `(${result.stats.linhasSujas} células sujas, ${result.stats.linhasExpandidas} linhas expandidas).`
      );
    } catch (err) {
      console.error(err);
      Toast.error('Falha ao processar: ' + err.message);
    } finally {
      setTimeout(() => progressWrap.classList.add('hidden'), 800);
    }
  },

  animateProgress(steps, fill, pct, label) {
    return new Promise(resolve => {
      let i = 0;
      const tick = () => {
        if (i >= steps.length) return resolve();
        const s = steps[i++];
        fill.style.width = s.pct + '%';
        pct.textContent = s.pct + '%';
        label.textContent = s.label;
        setTimeout(tick, 150);
      };
      tick();
    });
  },

  renderProcessed() {
    const r = this.state.processed;
    const $ = (sel) => this.container.querySelector(sel);

    $('#reorgPreviewSection').classList.remove('hidden');
    $('#reorgFiltersWrap').classList.remove('hidden');
    $('#reorgActionBar').classList.remove('hidden');
    $('#reorgCleanStatsWrap').classList.remove('hidden');

    // Preenche dropdowns dinâmicos
    ReorganizarFilters.setData(r.data);

    const catSelect = $('#reorgCategoriaFilter');
    const cats = ReorganizarFilters.getUniqueCategorias();
    catSelect.innerHTML = `<option value="">Todas as categorias</option>` +
      cats.map(c => `<option value="${Utils.escapeHtml(c)}">${Utils.escapeHtml(c)}</option>`).join('');

    const tipoSelect = $('#reorgTipoFilter');
    const tipos = ReorganizarFilters.getUniqueTipocods();
    tipoSelect.innerHTML = `<option value="">Todos os tipos</option>` +
      tipos.map(t => `<option value="${Utils.escapeHtml(t)}">${Utils.escapeHtml(t)}</option>`).join('');

    this.renderCleanStats(r.stats);
    this.refreshCleanTable(true);
  },

  renderCleanStats(stats) {
    const $ = (sel) => this.container.querySelector(sel);
    const items = [
      { label: 'Linhas lidas',        value: stats.totalRows,          cls: '' },
      { label: 'Linhas vazias',       value: stats.linhasVazias,       cls: '' },
      { label: 'Células sujas',       value: stats.linhasSujas,        cls: 'rcs-dirty' },
      { label: 'Linhas expandidas',   value: stats.linhasExpandidas,   cls: 'rcs-expanded' },
      { label: 'Registros finais',    value: stats.registrosFinais,    cls: 'rcs-final' }
    ];
    $('#reorgCleanStats').innerHTML = items.map(i => `
      <div class="reorg-clean-stat ${i.cls}">
        <div class="rcs-value">${Utils.formatNumber(i.value, 0)}</div>
        <div class="rcs-label">${Utils.escapeHtml(i.label)}</div>
      </div>
    `).join('');
  },

  refreshCleanTable(forceRerender = false) {
    const $ = (sel) => this.container.querySelector(sel);
    const container = $('#reorgCleanTable');
    const filtered = ReorganizarFilters.apply();

    if (forceRerender || !container.querySelector('#reorgCleanTable')) {
      ReorganizarPreview.renderClean(container, filtered);
    } else {
      const tbody = container.querySelector('#reorgCleanTableBody');
      if (tbody) tbody.innerHTML = ReorganizarPreview.renderRows(filtered);
      const count = container.querySelector('#reorgCleanCount');
      if (count) count.textContent = `Exibindo ${Math.min(filtered.length, CONFIG.PREVIEW_ROWS)} de ${filtered.length} registros`;
    }

    // Atualiza indicadores de ordenação
    Utils.$$('th[data-field]', container).forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.field === ReorganizarFilters.state.sortField) {
        th.classList.add(ReorganizarFilters.state.sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
      }
    });

    $('#reorgResultCount').textContent =
      `${filtered.length} de ${this.state.processed.data.length} registros`;
  },

  switchTab(tabId) {
    Utils.$$('.tab-btn', this.container).forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    Utils.$$('.tab-content', this.container).forEach(c => c.classList.toggle('active', c.id === tabId));
  },

  /* ---------- EXPORTAÇÃO ---------- */

  doExport(type) {
    if (!this.state.processed) return;
    const data = ReorganizarFilters.apply();
    const baseName = 'codigos_reorganizados';

    try {
      if (type === 'xlsx') {
        const fn = ReorganizarExporter.exportXLSX(data, baseName);
        Toast.success(`Arquivo exportado: ${fn}`);
      } else if (type === 'csv') {
        const fn = ReorganizarExporter.exportCSV(data, baseName);
        Toast.success(`Arquivo exportado: ${fn}`);
      }
    } catch (err) {
      console.error(err);
      Toast.error('Erro ao exportar: ' + err.message);
    }
  },

  /* ---------- HISTÓRICO ---------- */

  saveHistory(result) {
    const history = Utils.storageGet(CONFIG.STORAGE_KEYS.HISTORY, []);
    history.unshift({
      mode: 'reorganizar',
      file: this.state.parsed.name,
      date: new Date().toISOString(),
      stats: result.stats,
      count: result.data.length,
      data: result.data.slice(0, 500)
    });
    while (history.length > CONFIG.HISTORY_LIMIT) history.pop();
    Utils.storageSet(CONFIG.STORAGE_KEYS.HISTORY, history);
  },

  /* ---------- RESET ---------- */

  reset() {
    this.state = { parsed: null, selectedSheet: null, processed: null };
    ReorganizarFilters.reset();
    this.renderLayout();
    this.bindEvents();
  }
};
