/* ============================================
   EXPORTER.JS — Exportação XLSX, CSV, JSON (Curva ABC)
   ============================================ */

const CurvaABCExporter = {

  /**
   * Gera matriz [header, ...rows] a partir dos dados limpos e enriquecidos.
   * Código como NÚMERO e novas colunas em CAIXA ALTA.
   */
  buildMatrix(data) {
    const header = CONFIG.CURVA_ABC_COLUMNS; // já inclui SEQFAMILIA, SEQPRODUTO, DESCCOMPLETA
    const rows = data.map(rec => [
      // Código: número puro (sem zeros à esquerda)
      typeof rec.codigo === 'number' ? rec.codigo : (rec.codigo == null ? '' : rec.codigo),
      rec.produto ?? '',
      rec.ocor ?? '',
      rec.pecas ?? '',
      rec.qtd ?? '',
      rec.unid ?? '',
      rec.perc1 ?? '',
      rec.precoMedio ?? '',
      rec.totalRS ?? '',
      rec.perc2 ?? '',
      rec.abc ?? '',
      rec.percAc ?? '',
      // Novas colunas (caixa alta nos cabeçalhos, valores originais da referência)
      rec.seqfamilia ?? '',
      rec.seqproduto ?? '',
      rec.desccompleta ?? ''
    ]);
    return [header, ...rows];
  },

  /**
   * Exporta como XLSX.
   */
  exportXLSX(data, baseName = 'curva_abc_limpo', extraSheets = []) {
    const wb = XLSX.utils.book_new();

    const matrix = this.buildMatrix(data);
    const ws = XLSX.utils.aoa_to_sheet(matrix);

    // ⚠️ AJUSTE 1: força formato numérico na coluna A (Código)
    // Aplica formato "0" (inteiro) em todas as células da coluna A (a partir da linha 2)
    for (let r = 2; r <= matrix.length; r++) {
      const ref = XLSX.utils.encode_cell({ c: 0, r: r - 1 });
      const cell = ws[ref];
      if (cell && typeof cell.v === 'number') {
        cell.t = 'n';
        cell.z = '0';
      }
    }

    // Larguras de coluna
    const widths = [
      { wch: 10 },  // Código (número)
      { wch: 42 },  // Produto
      { wch: 10 },  // Ocor
      { wch: 14 },  // Peças
      { wch: 14 },  // Qtd
      { wch: 8 },   // Unid
      { wch: 10 },  // %
      { wch: 14 },  // Pr. Médio
      { wch: 16 },  // Total R$
      { wch: 10 },  // %
      { wch: 6 },   // ABC
      { wch: 10 },  // % Ac.
      { wch: 12 },  // SEQFAMILIA
      { wch: 12 },  // SEQPRODUTO
      { wch: 50 }   // DESCCOMPLETA
    ];
    ws['!cols'] = widths;

    // Congela a primeira linha
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, ws, 'Curva ABC Limpa');

    extraSheets.forEach(s => {
      const m = this.buildMatrix(s.data);
      const w = XLSX.utils.aoa_to_sheet(m);
      w['!cols'] = widths;
      XLSX.utils.book_append_sheet(wb, w, (s.name || 'Aba').slice(0, 31));
    });

    const filename = `${baseName}_${Utils.timestamp()}.xlsx`;
    XLSX.writeFile(wb, filename);
    return filename;
  },

  /**
   * Exporta como CSV (UTF-8 com BOM para Excel BR).
   */
  exportCSV(data, baseName = 'curva_abc_limpo') {
    const matrix = this.buildMatrix(data);
    const csv = matrix.map(row =>
      row.map(cell => {
        const s = cell == null ? '' : String(cell);
        if (s.includes(';') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      }).join(';')
    ).join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const filename = `${baseName}_${Utils.timestamp()}.csv`;
    Utils.downloadBlob(blob, filename);
    return filename;
  },

  /**
   * Exporta como JSON.
   */
  exportJSON(data, baseName = 'curva_abc_limpo') {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `${baseName}_${Utils.timestamp()}.json`;
    Utils.downloadBlob(blob, filename);
    return filename;
  }
};