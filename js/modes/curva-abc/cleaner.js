/* ============================================
   CLEANER.JS — Limpeza e organização dos dados (Curva ABC)
   ============================================ */

const CurvaABCCleaner = {

  /**
   * Processa a matriz de linhas de uma aba e retorna resultado limpo.
   * @param {Array<Array>} rows - matriz bruta (array de arrays)
   * @returns {{data: Array<Object>, stats: Object}}
   */
  process(rows) {
    const stats = {
      totalRows: rows.length,
      removedHeaderSGE: 0,
      removedInfo: 0,
      removedColumnHeader: 0,
      removedTotals: 0,
      removedBlank: 0,
      fixedShift: 0,
      extracted: 0
    };

    const clean = [];
    let headerFound = false;

    for (let i = 0; i < rows.length; i++) {
      const row = Array.isArray(rows[i]) ? rows[i] : [];
      const joined = row.join(' ');

      // 1) Cabeçalho SGE (repetido a cada página)
      if (Utils.containsAny(joined, CONFIG.KEYWORDS.HEADER_SGE)) {
        stats.removedHeaderSGE++;
        continue;
      }

      // 2) Linhas informativas
      if (Utils.containsAny(joined, CONFIG.KEYWORDS.INFO)) {
        stats.removedInfo++;
        continue;
      }

      // 3) Linhas de totais
      if (Utils.containsAny(joined, CONFIG.KEYWORDS.TOTALS)) {
        stats.removedTotals++;
        continue;
      }

      // 4) Cabeçalho das colunas
      const hasColHeader =
        Utils.containsAny(joined, ['Código']) &&
        Utils.containsAny(joined, ['Produto']) &&
        Utils.containsAny(joined, ['Ocor']);
      if (hasColHeader) {
        stats.removedColumnHeader++;
        headerFound = true;
        continue;
      }

      // 5) Linha em branco
      if (row.every(c => Utils.isEmpty(c))) {
        stats.removedBlank++;
        continue;
      }

      // 6) Antes do cabeçalho → lixo
      if (!headerFound) {
        stats.removedInfo++;
        continue;
      }

      const record = this.extractRecord(row, stats);
      if (record) {
        clean.push(record);
        stats.extracted++;
      }
    }

    // Ordena por código crescente (numérico)
    clean.sort((a, b) => {
      const ca = typeof a.codigo === 'number' ? a.codigo : parseInt(a.codigo, 10);
      const cb = typeof b.codigo === 'number' ? b.codigo : parseInt(b.codigo, 10);
      if (!isNaN(ca) && !isNaN(cb)) return ca - cb;
      return String(a.codigo).localeCompare(String(b.codigo));
    });

    return { data: clean, stats };
  },

  /**
   * Extrai um registro de uma linha, corrigindo deslocamentos.
   * Formato esperado (após cabeçalho):
   * [Código, Produto, Ocor, Peças, Qtd, Unid, %, Pr.Médio, Total R$, %, ABC, % Ac.]
   */
  extractRecord(row, stats) {
    const arr = row.slice();
    while (arr.length > 0 && Utils.isEmpty(arr[arr.length - 1])) arr.pop();
    if (arr.length === 0) return null;

    const codigoRaw = arr[0];
    const produto = arr[1];
    const next = arr[2];

    if (Utils.isEmpty(codigoRaw)) return null;

    // Detecção de deslocamento:
    // "Produto" vazio + coluna 2 contém texto não numérico → mover para produto.
    let produtoFinal = produto;
    let shifted = false;

    if (Utils.isEmpty(produto) && !Utils.isEmpty(next) && !Utils.isNumeric(next)) {
      produtoFinal = next;
      shifted = true;
    }

    const startIdx = shifted ? 3 : 2;

    const ocor = arr[startIdx] ?? '';
    const pecas = arr[startIdx + 1] ?? '';
    const qtd = arr[startIdx + 2] ?? '';
    const unid = arr[startIdx + 3] ?? '';
    const perc1 = arr[startIdx + 4] ?? '';
    const precoMedio = arr[startIdx + 5] ?? '';
    const totalRS = arr[startIdx + 6] ?? '';
    const perc2 = arr[startIdx + 7] ?? '';
    const abc = arr[startIdx + 8] ?? '';
    const percAc = arr[startIdx + 9] ?? '';

    if (shifted) stats.fixedShift++;

    // ⚠️ AJUSTE 1: código exportado como NÚMERO (sem zeros à esquerda)
    const codigoNum = this.toIntegerCode(codigoRaw);

    return {
      codigo: codigoNum,                     // number | null
      codigoOriginal: String(codigoRaw).trim(), // string preservando "00217" (para debug/mapper)
      produto: String(produtoFinal || '').trim(),
      ocor: Utils.toNumber(ocor),
      pecas: Utils.toNumber(pecas),
      qtd: Utils.toNumber(qtd),
      unid: String(unid || '').trim(),
      perc1: Utils.toNumber(perc1),
      precoMedio: Utils.toNumber(precoMedio),
      totalRS: Utils.toNumber(totalRS),
      perc2: Utils.toNumber(perc2),
      abc: String(abc || '').trim().toUpperCase(),
      percAc: Utils.toNumber(percAc),
      // Campos preenchidos posteriormente pelo mapper
      seqfamilia: '',
      seqproduto: '',
      desccompleta: ''
    };
  },

  /**
   * Converte um código bruto em número inteiro, removendo zeros à esquerda.
   * Ex: "00217" → 217; 217 → 217; "ABC" → null.
   */
  toIntegerCode(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'number') return Math.trunc(value);
    const s = String(value).trim();
    if (s === '') return null;
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    // Código não numérico: tenta parse parcial
    const n = parseInt(s, 10);
    return isNaN(n) ? null : n;
  },

  /**
   * Processa múltiplas abas em lote.
   */
  processAll(sheets) {
    const allData = [];
    const allStats = {
      totalRows: 0, removedHeaderSGE: 0, removedInfo: 0,
      removedColumnHeader: 0, removedTotals: 0, removedBlank: 0,
      fixedShift: 0, extracted: 0
    };

    sheets.forEach(sheet => {
      const r = this.process(sheet.rows);
      allData.push(...r.data);
      Object.keys(allStats).forEach(k => allStats[k] += (r.stats[k] || 0));
    });

    allData.sort((a, b) => {
      const ca = typeof a.codigo === 'number' ? a.codigo : parseInt(a.codigo, 10);
      const cb = typeof b.codigo === 'number' ? b.codigo : parseInt(b.codigo, 10);
      if (!isNaN(ca) && !isNaN(cb)) return ca - cb;
      return String(a.codigo).localeCompare(String(b.codigo));
    });

    return { data: allData, stats: allStats };
  }
};