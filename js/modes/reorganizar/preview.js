/* ============================================
   REORGANIZAR/PREVIEW.JS
   ============================================
   Renderização das tabelas "Original" e "Limpo".
   ============================================ */

const ReorganizarPreview = {

  /**
   * Renderiza a tabela de dados originais (brutos).
   * Destaca visualmente linhas cujo COD ACESS está sujo.
   */
  renderOriginal(container, rows) {
    if (!rows || rows.length === 0) {
      container.innerHTML = this.emptyHtml();
      return;
    }

    const cols = ReorganizarCleaner.COLS;
    const maxCols = Math.max(cols.length, ...rows.slice(0, CONFIG.PREVIEW_ROWS).map(r => r.length));

    const headerCols = [];
    for (let i = 0; i < maxCols; i++) {
      headerCols.push(cols[i] || `Col ${i + 1}`);
    }

    const html = `
      <div class="reorg-preview-legend">
        <span><span class="reorg-legend-dot reorg-legend-dirty"></span> Linha com COD ACESS "sujo" (multilinha)</span>
        <span><span class="reorg-legend-dot reorg-legend-empty"></span> Linha vazia</span>
      </div>
      <div class="table-wrapper">
        <table class="data-table reorg-table">
          <thead>
            <tr>${headerCols.map(h => `<th>${Utils.escapeHtml(h)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.slice(0, CONFIG.PREVIEW_ROWS).map(row => {
              const isEmpty = !row || row.every(c => Utils.isEmpty(c));
              const codIdx = cols.indexOf('COD ACESS');
              const cod = row ? row[codIdx] : '';
              const isDirty = ReorganizarCleaner.celulaSuja(cod);

              let cls = '';
              if (isEmpty) cls = 'row-removed';
              else if (isDirty) cls = 'row-dirty';

              return `<tr class="${cls}">${
                Array.from({ length: maxCols }, (_, i) => {
                  const v = row ? row[i] : '';
                  const display = v == null ? '' : String(v);
                  const shortDisplay = display.length > 120
                    ? display.slice(0, 120) + '…'
                    : display;
                  const tdCls = i === codIdx ? 'col-cod' : (i === 1 ? 'col-desc' : '');
                  return `<td class="${tdCls}" title="${Utils.escapeHtml(display)}">${Utils.escapeHtml(shortDisplay)}</td>`;
                }).join('')
              }</tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <p class="text-center mt-2" style="font-size:.78rem;color:var(--text-muted)">
        Exibindo ${Math.min(rows.length, CONFIG.PREVIEW_ROWS)} de ${rows.length} linhas
      </p>
    `;
    container.innerHTML = html;
  },

  /**
   * Renderiza a tabela de dados limpos com filtros/ordenação aplicados.
   */
  renderClean(container, data) {
    if (!data || data.length === 0) {
      container.innerHTML = this.emptyHtml();
      return;
    }

    const cols = ReorganizarCleaner.COLS;

    const html = `
      <div class="table-wrapper">
        <table class="data-table reorg-table" id="reorgCleanTable">
          <thead>
            <tr>
              ${cols.map((c, i) => {
                const isSorted = ReorganizarFilters.state.sortField === c;
                const sortCls = isSorted
                  ? (ReorganizarFilters.state.sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc')
                  : '';
                return `
                  <th data-field="${Utils.escapeHtml(c)}" data-idx="${i}" class="${sortCls}">
                    ${Utils.escapeHtml(c)}
                    <span class="sort-ind"><i class="fa-solid fa-sort"></i></span>
                  </th>
                `;
              }).join('')}
            </tr>
          </thead>
          <tbody id="reorgCleanTableBody">
            ${this.renderRows(data)}
          </tbody>
        </table>
      </div>
      <p class="text-center mt-2" style="font-size:.78rem;color:var(--text-muted)" id="reorgCleanCount">
        Exibindo ${Math.min(data.length, CONFIG.PREVIEW_ROWS)} de ${data.length} registros
      </p>
    `;
    container.innerHTML = html;
  },

  /**
   * Renderiza o corpo da tabela (apenas linhas).
   */
  renderRows(data) {
    const cols = ReorganizarCleaner.COLS;
    return data.slice(0, CONFIG.PREVIEW_ROWS).map(rec => {
      return `<tr>${
        cols.map((c, i) => {
          const v = rec[c];
          const display = v == null ? '' : String(v);
          const cls = i === 1 ? 'col-desc' : (c === 'COD ACESS' ? 'col-cod' : '');
          return `<td class="${cls}" title="${Utils.escapeHtml(display)}">${Utils.escapeHtml(display)}</td>`;
        }).join('')
      }</tr>`;
    }).join('');
  },

  emptyHtml() {
    return `
      <div class="table-empty">
        <i class="fa-solid fa-inbox"></i>
        <p>Nenhum dado para exibir.</p>
      </div>
    `;
  }
};
