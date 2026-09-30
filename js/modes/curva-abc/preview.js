/* ============================================
   PREVIEW.JS — Renderização das tabelas original/limpo
   ============================================ */

const CurvaABCPreview = {

  /**
   * Renderiza a tabela de dados originais (brutos) com highlight das linhas removidas.
   */
  renderOriginal(container, rows) {
    if (!rows || rows.length === 0) {
      container.innerHTML = this.emptyHtml();
      return;
    }

    const maxCols = Math.max(...rows.slice(0, CONFIG.PREVIEW_ROWS).map(r => r.length), 0);
    const headers = Array.from({ length: maxCols }, (_, i) => `Col ${i + 1}`);

    const html = `
      <div class="preview-legend">
        <span><span class="legend-dot legend-removed"></span> Linha removida (cabeçalho/total/vazia)</span>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.slice(0, CONFIG.PREVIEW_ROWS).map((row) => {
              const isRemoved = this.isRemovableRow(row);
              const cls = isRemoved ? 'row-removed' : '';
              return `<tr class="${cls}">${
                Array.from({ length: maxCols }, (_, i) => {
                  const v = row[i];
                  const display = v === null || v === undefined ? '' : String(v);
                  return `<td title="${Utils.escapeHtml(display)}">${Utils.escapeHtml(display)}</td>`;
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

    const cols = CONFIG.CURVA_ABC_COLUMNS;
    const fields = CONFIG.CURVA_ABC_FIELDS;

    const html = `
      <div class="table-wrapper">
        <table class="data-table" id="cleanTable">
          <thead>
            <tr>
              ${cols.map((c, i) => `
                <th data-field="${fields[i]}" data-idx="${i}">
                  ${Utils.escapeHtml(c)}
                  <span class="sort-ind"><i class="fa-solid fa-sort"></i></span>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody id="cleanTableBody">
            ${this.renderRows(data)}
          </tbody>
        </table>
      </div>
      <p class="text-center mt-2" style="font-size:.78rem;color:var(--text-muted)" id="cleanCount">
        Exibindo ${Math.min(data.length, CONFIG.PREVIEW_ROWS)} de ${data.length} registros
      </p>
    `;
    container.innerHTML = html;
  },

  renderRows(data) {
    const fields = CONFIG.CURVA_ABC_FIELDS;
    return data.slice(0, CONFIG.PREVIEW_ROWS).map(rec => {
      return `<tr>${
        fields.map(f => {
          const v = rec[f];

          if (f === 'abc') {
            const cls = v ? `badge badge-${v}` : 'badge badge-neutral';
            return `<td><span class="${cls}">${Utils.escapeHtml(v || '-')}</span></td>`;
          }

          // ⚠️ Código agora é número
          if (f === 'codigo') {
            const display = (v == null || v === '') ? '' : Utils.formatNumber(v, 0);
            return `<td>${Utils.escapeHtml(display)}</td>`;
          }

          // Números formatados
          if (['ocor','pecas','qtd','perc1','precoMedio','totalRS','perc2','percAc'].includes(f)) {
            return `<td>${v == null ? '' : Utils.formatNumber(v, 4)}</td>`;
          }

          // Texto simples (inclui seqfamilia, seqproduto, desccompleta)
          if (f === 'desccompleta') {
            return `<td title="${Utils.escapeHtml(v ?? '')}">${Utils.escapeHtml(v ?? '')}</td>`;
          }

          return `<td>${Utils.escapeHtml(v == null ? '' : v)}</td>`;
        }).join('')
      }</tr>`;
    }).join('');
  },

  isRemovableRow(row) {
    if (!Array.isArray(row)) return false;
    const joined = row.join(' ');
    if (Utils.isEmpty(joined)) return true;
    if (Utils.containsAny(joined, CONFIG.KEYWORDS.HEADER_SGE)) return true;
    if (Utils.containsAny(joined, CONFIG.KEYWORDS.INFO)) return true;
    if (Utils.containsAny(joined, CONFIG.KEYWORDS.TOTALS)) return true;
    if (
      Utils.containsAny(joined, ['Código']) &&
      Utils.containsAny(joined, ['Produto']) &&
      Utils.containsAny(joined, ['Ocor'])
    ) return true;
    return false;
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