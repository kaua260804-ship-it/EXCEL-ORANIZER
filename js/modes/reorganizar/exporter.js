/* ============================================
   REORGANIZAR/EXPORTER.JS
   ============================================
   Exportação em XLSX e CSV.
   - Cabeçalhos em CAIXA ALTA
   - COD ACESS como texto (preserva zeros à esquerda)
   - SEQ como número quando possível
   ============================================ */

const ReorganizarExporter = {

  HEADER: ['SEQ', 'DESC', 'CATEGORIA', 'TIPOCOD', 'QTD EMB', 'COD ACESS'],

  /**
   * Monta a matriz [header, ...rows] a partir dos dados.
   */
  buildMatrix(data) {
    const header = this.HEADER;
    const rows = data.map(rec => [
      this.parseMaybeNumber(rec.SEQ),
      rec.DESC ?? '',
      rec.CATEGORIA ?? '',
      rec.TIPOCOD ?? '',
      this.parseMaybeNumber(rec['QTD EMB']),
      // COD ACESS sempre como string (preserva zeros à esquerda)
      String(rec['COD ACESS'] ?? '')
    ]);
    return [header, ...rows];
  },

  /**
   * Converte para número se for inteiro/decimal válido, senão mantém string.
   */
  parseMaybeNumber(v) {
    if (v == null || v === '') return '';
    if (typeof v === 'number') return v;
    const s = String(v).trim();
    if (/^-?\d+$/.test(s)) return parseInt(s, 10);
    if (/^-?\d+([.,]\d+)?$/.test(s)) {
      const n = parseFloat(s.replace(',', '.'));
      return isNaN(n) ? s : n;
    }
    return s;
  },

  /**
   * Exporta XLSX.
   */
  exportXLSX(data, baseName = 'codigos_reorganizados') {
    const wb = XLSX.utils.book_new();
    const matrix = this.buildMatrix(data);
    const ws = XLSX.utils.aoa_to_sheet(matrix);

    // Coluna F (COD ACESS) sempre como texto
    const codIdx = this.HEADER.indexOf('COD ACESS');
    for (let r = 2; r <= matrix.length; r++) {
      const ref = XLSX.utils.encode_cell({ c: codIdx, r: r - 1 });
      const cell = ws[ref];
      if (cell && cell.v != null) {
        cell.t = 's';
        cell.z = '@';
        cell.v = String(cell.v);
      }
    }

    // Larguras
    const widths = [
      { wch: 10 },  // SEQ
      { wch: 55 },  // DESC
      { wch: 18 },  // CATEGORIA
      { wch: 10 },  // TIPOCOD
      { wch: 10 },  // QTD EMB
      { wch: 22 }   // COD ACESS
    ];
    ws['!cols'] = widths;
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, ws, 'Reorganizado');

    const filename = `${baseName}_${Utils.timestamp()}.xlsx`;
    XLSX.writeFile(wb, filename);
    return filename;
  },

  /**
   * Exporta CSV (UTF-8 com BOM).
   */
  exportCSV(data, baseName = 'codigos_reorganizados') {
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
  }
};
