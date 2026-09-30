/* ============================================
   FILE-READER.JS — Leitura de XLS/XLSX/CSV via SheetJS
   ============================================ */

const FileReaderService = {

  /**
   * Lê um arquivo (File) e retorna um objeto com metadados e abas.
   * @param {File} file
   * @returns {Promise<{file: File, name: string, size: number, sheets: Array, workbook: Object}>}
   */
  async read(file) {
    if (!window.XLSX) {
      throw new Error('SheetJS não carregado.');
    }
    if (!Utils.isAcceptedFile(file)) {
      throw new Error(`Formato não suportado: ${file.name}. Aceitos: ${CONFIG.ACCEPTED_EXTENSIONS.join(', ')}`);
    }

    const buffer = await file.arrayBuffer();
    const isCSV = Utils.getExtension(file.name) === '.csv';

    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: false,
      cellNF: false,
      cellText: false,
      raw: true,
      // CSV sem cabeçalho implícito
      ...(isCSV ? { raw: false } : {})
    });

    const sheets = workbook.SheetNames.map(name => {
      const ws = workbook.Sheets[name];
      // Lê como matriz (array de arrays), preservando tudo
      const rows = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: '',
        raw: true,
        blankrows: true
      });
      return { name, rows };
    });

    return {
      file,
      name: file.name,
      size: file.size,
      workbook,
      sheets
    };
  },

  /**
   * Detecta se há múltiplas abas com conteúdo relevante.
   */
  hasMultipleSheets(parsed) {
    return parsed.sheets.length > 1;
  }
};