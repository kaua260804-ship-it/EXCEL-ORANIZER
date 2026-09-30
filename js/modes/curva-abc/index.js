/* ============================================
   INDEX.JS — Orquestração do modo Curva ABC
   ============================================ */

const ModoCurvaABC = {
  id: 'curva-abc',
  nome: 'Curva ABC',
  icone: 'fa-chart-line',
  enabled: true,

  state: {
    parsed: null,
    selectedSheet: null,
    processed: null,     // { data, stats, mapStats }
    originalPreview: []
  },

  container: null,

  init(container) {
    this.container = container;
    this.renderLayout();
    this.bindEvents();
    this.renderHistoryCount();
    this.preloadReference();
  },

  /**
   * Pré-carrega a planilha de referência em background.
   * Não bloqueia a UI.
   */
  preloadReference() {
    if (CurvaABCMapper.loaded) return;
    CurvaABCMapper.load()
      .then(() => {
        const st = CurvaABCMapper.status();
        console.log(`[Curva ABC] Referência pronta: ${st.referenceName}`);
        Toast.info(`Base de referência carregada (${st.size} códigos).`, 'Mapeamento SGE vs C5');
      })
      .catch(err => {
        console.warn('[Curva ABC] Falha ao pré-carregar referência:', err);
        Toast.warning(
          'Não foi possível carregar "dados/CODIGOS SGE VS C5.xlsx". As colunas de mapeamento ficarão em branco.',
          'Mapeamento indisponível'
        );
      });
  },

  destroy() {
    CurvaABCDashboard.destroy();
    this.container = null;
    this.state = { parsed: null, selectedSheet: null, processed: null, originalPreview: [] };
  },

  /* ---------- LAYOUT ---------- */

  renderLayout() {
    this.container.innerHTML = `
      <div class="curva-header">
        <h1><i class="fa-solid fa-chart-line"></i> Curva ABC</h1>
        <p>Importe relatórios exportados do SGE (.xls, .xlsx, .csv) e obtenha uma planilha limpa, com enriquecimento automático de SEQFAMILIA / SEQPRODUTO / DESCCOMPLETA via base "CODIGOS SGE VS C5".</p>
      </div>

      <!-- Status da base de referência -->
      <div id="mapperStatus" class="file-info" style="background:var(--bg-muted);color:var(--text-secondary)">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span class="fi-name">Carregando base "CODIGOS SGE VS C5.xlsx"…</span>
      </div>

      <div id="uploadArea">
        <div class="upload-zone" id="uploadZone">
          <div class="upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
          <div class="upload-title">Arraste e solte seus arquivos aqui</div>
          <div class="upload-sub">ou clique para selecionar do seu computador</div>
          <input type="file" id="fileInput" accept=".xls,.xlsx,.csv" multiple hidden>
          <div class="upload-formats">
            <span class="badge badge-neutral"><i class="fa-solid fa-file-excel"></i> XLS</span>
            <span class="badge badge-neutral"><i class="fa-solid fa-file-excel"></i> XLSX</span>
            <span class="badge badge-neutral"><i class="fa-solid fa-file-csv"></i> CSV</span>
          </div>
        </div>
      </div>

      <div id="workArea" class="hidden">
        <div class="file-info" id="fileInfo"></div>

        <div id="sheetSelectorWrap" class="hidden">
          <div class="toolbar">
            <label class="form-label" style="margin:0"><i class="fa-solid fa-layer-group"></i> Aba:</label>
            <select class="form-select" id="sheetSelect"></select>
            <label style="display:flex;align-items:center;gap:6px;font-size:.85rem">
              <input type="checkbox" id="allSheets"> Processar todas as abas
            </label>
            <div class="spacer"></div>
            <button class="btn btn-primary" id="processBtn"><i class="fa-solid fa-wand-magic-sparkles"></i> Processar / Limpar</button>
            <button class="btn btn-danger" id="clearBtn"><i class="fa-solid fa-trash-can"></i> Limpar</button>
          </div>
        </div>

        <div class="progress-wrap hidden" id="progressWrap">
          <div class="progress-label">
            <span id="progressLabel">Processando…</span>
            <span id="progressPct">0%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
        </div>

        <div id="previewSection" class="preview-section hidden">
          <div class="tabs">
            <button class="tab-btn active" data-tab="tab-original"><i class="fa-solid fa-file-lines"></i> Original</button>
            <button class="tab-btn" data-tab="tab-clean"><i class="fa-solid fa-broom"></i> Limpo</button>
          </div>

          <div class="tab-content active" id="tab-original">
            <div id="originalTable"></div>
          </div>

          <div class="tab-content" id="tab-clean">
            <div id="cleanStatsWrap" class="hidden">
              <div class="card mb-4">
                <div class="card-header">
                  <h3><i class="fa-solid fa-chart-simple"></i> Estatísticas da Limpeza</h3>
                </div>
                <div class="clean-stats" id="cleanStats"></div>
              </div>
            </div>

            <div id="dashboardWrap" class="hidden"></div>

            <div id="filtersWrap" class="hidden">
              <div class="toolbar">
                <input type="search" class="form-input" id="searchInput" placeholder="Buscar por código, produto ou desc. completa…" style="min-width:240px">
                <select class="form-select" id="abcFilter">
                  <option value="">Todas as classes ABC</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
                <select class="form-select" id="unidFilter">
                  <option value="">Todas as unidades</option>
                </select>
                <button class="btn btn-ghost btn-sm" id="resetFilters"><i class="fa-solid fa-rotate-left"></i> Limpar filtros</button>
                <div class="spacer"></div>
                <span id="resultCount" style="font-size:.8rem;color:var(--text-secondary)"></span>
              </div>
              <div id="cleanTable"></div>
            </div>
          </div>
        </div>

        <div class="action-bar hidden" id="actionBar">
          <button class="btn btn-outline" id="exportCsvBtn"><i class="fa-solid fa-file-csv"></i> CSV</button>
          <button class="btn btn-outline" id="exportJsonBtn"><i class="fa-solid fa-file-code"></i> JSON</button>
          <button class="btn btn-success" id="exportXlsxBtn"><i class="fa-solid fa-file-excel"></i> Exportar XLSX</button>
        </div>
      </div>
    `;
  },

  /* ---------- EVENTOS ---------- */

  bindEvents() {
    const $ = (sel) => this.container.querySelector(sel);

    const zone = $('#uploadZone');
    const input = $('#fileInput');
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

    $('#processBtn').addEventListener('click', () => this.runProcess());
    $('#clearBtn').addEventListener('click', () => this.reset());

    Utils.$$('.tab-btn', this.container).forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    $('#searchInput').addEventListener('input', Utils.debounce((e) => {
      CurvaABCFilters.setSearch(e.target.value);
      this.refreshCleanTable();
    }, 250));
    $('#abcFilter').addEventListener('change', (e) => {
      CurvaABCFilters.setABC(e.target.value);
      this.refreshCleanTable();
    });
    $('#unidFilter').addEventListener('change', (e) => {
      CurvaABCFilters.setUnid(e.target.value);
      this.refreshCleanTable();
    });
    $('#resetFilters').addEventListener('click', () => {
      CurvaABCFilters.reset();
      $('#searchInput').value = '';
      $('#abcFilter').value = '';
      $('#unidFilter').value = '';
      this.refreshCleanTable();
    });

    $('#exportXlsxBtn').addEventListener('click', () => this.doExport('xlsx'));
    $('#exportCsvBtn').addEventListener('click', () => this.doExport('csv'));
    $('#exportJsonBtn').addEventListener('click', () => this.doExport('json'));

    $('#sheetSelect').addEventListener('change', (e) => {
      this.state.selectedSheet = parseInt(e.target.value, 10);
      this.renderOriginalPreview();
    });

    this.container.addEventListener('click', (e) => {
      const th = e.target.closest('th[data-field]');
      if (th && this.state.processed) {
        CurvaABCFilters.setSort(th.dataset.field);
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
    const fileInfo = $('#fileInfo');
    fileInfo.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Lendo "${Utils.escapeHtml(file.name)}"…`;

    try {
      const parsed = await FileReaderService.read(file);
      this.state.parsed = parsed;
      this.state.selectedSheet = 0;

      $('#uploadArea').classList.add('hidden');
      $('#workArea').classList.remove('hidden');

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
    $('#fileInfo').innerHTML = `
      <i class="fa-solid fa-file-excel"></i>
      <span class="fi-name">${Utils.escapeHtml(p.name)}</span>
      <span class="fi-meta">${Utils.formatFileSize(p.size)} · ${p.sheets.length} aba(s)</span>
      <span class="spacer"></span>
      <button class="btn btn-ghost btn-sm" id="newFileBtn"><i class="fa-solid fa-arrow-up-from-bracket"></i> Novo arquivo</button>
    `;
    $('#newFileBtn').addEventListener('click', () => this.reset());
  },

  renderSheetSelector() {
    const $ = (sel) => this.container.querySelector(sel);
    const select = $('#sheetSelect');
    const wrap = $('#sheetSelectorWrap');

    if (this.state.parsed.sheets.length <= 1) {
      wrap.classList.remove('hidden');
      select.innerHTML = `<option value="0">${Utils.escapeHtml(this.state.parsed.sheets[0].name)}</option>`;
      select.disabled = true;
      $('#allSheets').disabled = true;
    } else {
      wrap.classList.remove('hidden');
      select.disabled = false;
      $('#allSheets').disabled = false;
      select.innerHTML = this.state.parsed.sheets.map((s, i) =>
        `<option value="${i}">${Utils.escapeHtml(s.name)} (${s.rows.length} linhas)</option>`
      ).join('');
    }
  },

  renderOriginalPreview() {
    const sheet = this.state.parsed.sheets[this.state.selectedSheet];
    if (!sheet) return;
    const el = this.container.querySelector('#originalTable');
    CurvaABCPreview.renderOriginal(el, sheet.rows);
  },

  /* ---------- PROCESSAMENTO ---------- */

  async runProcess() {
    if (!this.state.parsed) return;

    const $ = (sel) => this.container.querySelector(sel);
    const progressWrap = $('#progressWrap');
    const progressFill = $('#progressFill');
    const progressPct = $('#progressPct');
    const progressLabel = $('#progressLabel');

    progressWrap.classList.remove('hidden');
    progressLabel.textContent = 'Processando…';
    progressFill.style.width = '0%';
    progressPct.textContent = '0%';

    const steps = [
      { pct: 15, label: 'Removendo cabeçalhos do SGE…' },
      { pct: 35, label: 'Removendo linhas de totais…' },
      { pct: 55, label: 'Corrigindo deslocamentos…' },
      { pct: 75, label: 'Padronizando tipos…' },
      { pct: 90, label: 'Cruzando com base SGE vs C5…' },
      { pct: 100, label: 'Concluído!' }
    ];

    try {
      const all = $('#allSheets').checked;
      await this.animateProgress(steps.slice(0, 4), progressFill, progressPct, progressLabel);

      let result;
      if (all) {
        result = CurvaABCCleaner.processAll(this.state.parsed.sheets);
      } else {
        const sheet = this.state.parsed.sheets[this.state.selectedSheet];
        result = CurvaABCCleaner.process(sheet.rows);
      }

      // --- Enriquecimento via planilha de referência ---
      progressLabel.textContent = 'Cruzando com base SGE vs C5…';
      progressFill.style.width = '90%';
      progressPct.textContent = '90%';

      let mapStats = { matched: 0, unmatched: 0, available: false, error: null };
      try {
        await CurvaABCMapper.load();
        const enriched = CurvaABCMapper.enrich(result.data);
        result.data = enriched.data;
        mapStats = { ...enriched.stats, available: true, error: null };
      } catch (err) {
        console.warn('[Curva ABC] Mapper indisponível:', err);
        mapStats.error = err.message;
        // segue sem mapeamento — dados ficam com campos vazios
      }

      progressFill.style.width = '100%';
      progressPct.textContent = '100%';
      progressLabel.textContent = 'Concluído!';

      this.state.processed = { ...result, mapStats };
      this.renderProcessed();
      this.saveHistory(result);

      if (mapStats.available) {
        Toast.success(
          `Processamento concluído: ${result.data.length} registros. ` +
          `Mapeados: ${mapStats.matched} / ${result.data.length}.`
        );
      } else {
        Toast.warning(
          `Processamento concluído sem mapeamento SGE vs C5 (${mapStats.error || 'base indisponível'}).`
        );
      }
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

    $('#previewSection').classList.remove('hidden');
    $('#filtersWrap').classList.remove('hidden');
    $('#actionBar').classList.remove('hidden');
    $('#cleanStatsWrap').classList.remove('hidden');
    $('#dashboardWrap').classList.remove('hidden');

    CurvaABCFilters.setData(r.data);
    const unidSelect = $('#unidFilter');
    const unids = CurvaABCFilters.getUniqueUnids();
    unidSelect.innerHTML = `<option value="">Todas as unidades</option>` +
      unids.map(u => `<option value="${Utils.escapeHtml(u)}">${Utils.escapeHtml(u)}</option>`).join('');

    this.renderCleanStats(r.stats, r.mapStats);
    CurvaABCDashboard.render($('#dashboardWrap'), r.data);
    this.refreshCleanTable(true);
  },

  renderCleanStats(stats, mapStats) {
    const $ = (sel) => this.container.querySelector(sel);
    const items = [
      { label: 'Linhas totais', value: stats.totalRows },
      { label: 'Cabeçalhos SGE', value: stats.removedHeaderSGE },
      { label: 'Informativas', value: stats.removedInfo },
      { label: 'Cabeçalhos col.', value: stats.removedColumnHeader },
      { label: 'Totais', value: stats.removedTotals },
      { label: 'Vazias', value: stats.removedBlank },
      { label: 'Deslocamentos', value: stats.fixedShift },
      { label: 'Registros', value: stats.extracted },
      { label: 'Mapeados', value: mapStats ? mapStats.matched : 0 },
      { label: 'Não mapeados', value: mapStats ? mapStats.unmatched : 0 }
    ];
    $('#cleanStats').innerHTML = items.map(i => `
      <div class="clean-stat">
        <div class="cs-value">${Utils.formatNumber(i.value, 0)}</div>
        <div class="cs-label">${Utils.escapeHtml(i.label)}</div>
      </div>
    `).join('');
  },

  refreshCleanTable(forceRerender = false) {
    const $ = (sel) => this.container.querySelector(sel);
    const container = $('#cleanTable');
    const filtered = CurvaABCFilters.apply();

    if (forceRerender || !container.querySelector('#cleanTable')) {
      CurvaABCPreview.renderClean(container, filtered);
    } else {
      const tbody = container.querySelector('#cleanTableBody');
      if (tbody) tbody.innerHTML = CurvaABCPreview.renderRows(filtered);
      const count = container.querySelector('#cleanCount');
      if (count) count.textContent = `Exibindo ${Math.min(filtered.length, CONFIG.PREVIEW_ROWS)} de ${filtered.length} registros`;
    }

    $('#resultCount').textContent = `${filtered.length} de ${this.state.processed.data.length} registros`;
  },

  switchTab(tabId) {
    Utils.$$('.tab-btn', this.container).forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    Utils.$$('.tab-content', this.container).forEach(c => c.classList.toggle('active', c.id === tabId));
  },

  /* ---------- EXPORTAÇÃO ---------- */

  doExport(type) {
    if (!this.state.processed) return;
    const data = CurvaABCFilters.apply();
    const baseName = 'curva_abc_limpo';

    try {
      if (type === 'xlsx') {
        const fn = CurvaABCExporter.exportXLSX(data, baseName);
        Toast.success(`Arquivo exportado: ${fn}`);
      } else if (type === 'csv') {
        const fn = CurvaABCExporter.exportCSV(data, baseName);
        Toast.success(`Arquivo exportado: ${fn}`);
      } else if (type === 'json') {
        const fn = CurvaABCExporter.exportJSON(data, baseName);
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
      file: this.state.parsed.name,
      date: new Date().toISOString(),
      stats: result.stats,
      count: result.data.length,
      data: result.data.slice(0, 500)
    });
    while (history.length > CONFIG.HISTORY_LIMIT) history.pop();
    Utils.storageSet(CONFIG.STORAGE_KEYS.HISTORY, history);
    this.renderHistoryCount();
  },

  renderHistoryCount() {
    const history = Utils.storageGet(CONFIG.STORAGE_KEYS.HISTORY, []);
    const badge = document.getElementById('historyBtn');
    if (badge) badge.dataset.count = history.length;
  },

  reset() {
    this.state = { parsed: null, selectedSheet: null, processed: null };
    CurvaABCFilters.reset();
    CurvaABCDashboard.destroy();
    this.renderLayout();
    this.bindEvents();
    this.updateMapperStatus();
  },

  /**
   * Atualiza o banner de status da base de referência.
   */
  updateMapperStatus() {
    const el = this.container.querySelector('#mapperStatus');
    if (!el) return;
    if (CurvaABCMapper.loaded) {
      const st = CurvaABCMapper.status();
      el.innerHTML = `
        <i class="fa-solid fa-circle-check" style="color:var(--color-success)"></i>
        <span class="fi-name">Base carregada: ${Utils.escapeHtml(st.referenceName)}</span>
      `;
    } else {
      el.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation" style="color:var(--color-warning)"></i>
        <span class="fi-name">Base "CODIGOS SGE VS C5.xlsx" não disponível — colunas de mapeamento ficarão em branco.</span>
      `;
    }
  }
};