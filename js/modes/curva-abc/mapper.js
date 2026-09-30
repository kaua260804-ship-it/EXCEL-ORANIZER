/* ============================================
   MAPPER.JS — Cruzamento com planilha "CODIGOS SGE VS C5.xlsx"
   ============================================
   Responsável por:
   1. Carregar (fetch) a planilha de referência localizada em /dados/
   2. Construir um índice { "CODIGO_SGE": { seqfamilia, seqproduto, desccompleta } }
   3. Enriquecer os registros limpos com esses campos
   ============================================ */

const CurvaABCMapper = {

  // Índice em memória: { [codigoSge: string]: { seqfamilia, seqproduto, desccompleta } }
  index: null,
  loaded: false,
  loadPromise: null,
  referenceName: null,

  /**
   * Normaliza uma string de cabeçalho para comparação:
   * - remove acentos
   * - minúsculas
   * - remove pontuação/underscores/espaços extras
   * Ex: "CODIGO SGE", "Código_SGE", "codigoSge" → "codigosge"
   */
  normalizeHeader(str) {
    if (str == null) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  },

  /**
   * Normaliza o código para uso como chave do índice.
   * Remove zeros à esquerda e converte para string "numérica pura".
   * Ex: "00217" → "217"; "217" → "217"; "0" → "0".
   * Mantém como string para não perder precisão em códigos grandes.
   */
  normalizeCodeKey(value) {
    if (value == null || value === '') return '';
    // Se for número, converte para string inteira
    if (typeof value === 'number') {
      return Number.isInteger(value) ? String(value) : String(Math.trunc(value));
    }
    const s = String(value).trim();
    if (s === '') return '';
    // Se for puramente dígitos (com ou sem zeros à esquerda), remove zeros à esquerda
    if (/^\d+$/.test(s)) {
      const noZeros = s.replace(/^0+/, '');
      return noZeros === '' ? '0' : noZeros;
    }
    return s;
  },

  /**
   * Faz o fetch e o parse da planilha de referência.
   * Retorna uma Promise que resolve quando o índice estiver pronto.
   * @returns {Promise<void>}
   */
  load() {
    if (this.loaded) return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      const url = CONFIG.MAPPER.REFERENCE_FILE;

      // Cache-buster leve para garantir versão atual
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(
          `Não foi possível carregar a planilha de referência em "${url}" (HTTP ${response.status}). ` +
          `Verifique se o arquivo está em /dados/CODIGOS SGE VS C5.xlsx.`
        );
      }

      const buffer = await response.arrayBuffer();
      if (!window.XLSX) throw new Error('SheetJS não carregado.');

      const wb = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });

      // Seleciona a aba
      const sheetName = CONFIG.MAPPER.REFERENCE_SHEET && wb.SheetNames.includes(CONFIG.MAPPER.REFERENCE_SHEET)
        ? CONFIG.MAPPER.REFERENCE_SHEET
        : wb.SheetNames[0];

      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true, blankrows: false });

      if (!rows || rows.length < 2) {
        throw new Error('Planilha de referência vazia ou sem linhas de dados.');
      }

      // Detecta índices das colunas a partir da primeira linha
      const headerRow = rows[0];
      const wanted = CONFIG.MAPPER.COLUMNS;
      const idx = {
        seqfamilia: -1,
        seqproduto: -1,
        desccompleta: -1,
        codigoSge: -1
      };

      headerRow.forEach((h, i) => {
        const n = this.normalizeHeader(h);
        if (n === this.normalizeHeader(wanted.SEQFAMILIA))  idx.seqfamilia = i;
        else if (n === this.normalizeHeader(wanted.SEQPRODUTO))   idx.seqproduto = i;
        else if (n === this.normalizeHeader(wanted.DESCCOMPLETA)) idx.desccompleta = i;
        else if (n === this.normalizeHeader(wanted.CODIGO_SGE))   idx.codigoSge = i;
      });

      // Fallback posicional caso o cabeçalho não bata (na ordem declarada no problema)
      if (idx.codigoSge === -1 && headerRow.length >= 4) {
        // Ordem esperada: seqfamilia | seqproduto | desccompleta | CODIGO SGE
        idx.seqfamilia  = idx.seqfamilia  === -1 ? 0 : idx.seqfamilia;
        idx.seqproduto  = idx.seqproduto  === -1 ? 1 : idx.seqproduto;
        idx.desccompleta = idx.desccompleta === -1 ? 2 : idx.desccompleta;
        idx.codigoSge   = 3;
      }

      if (idx.codigoSge === -1) {
        throw new Error(
          'Coluna "CODIGO SGE" não encontrada na planilha de referência. ' +
          'Cabeçalhos detectados: ' + headerRow.map(h => `"${h}"`).join(', ')
        );
      }

      // Constrói o índice
      const index = Object.create(null);
      let inserted = 0;
      let duplicates = 0;

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const rawCodigo = row[idx.codigoSge];
        const key = this.normalizeCodeKey(rawCodigo);
        if (key === '') continue;

        const registro = {
          seqfamilia:   idx.seqfamilia   >= 0 ? row[idx.seqfamilia]   ?? '' : '',
          seqproduto:   idx.seqproduto   >= 0 ? row[idx.seqproduto]   ?? '' : '',
          desccompleta: idx.desccompleta >= 0 ? row[idx.desccompleta] ?? '' : ''
        };

        if (index[key]) {
          duplicates++;
        } else {
          index[key] = registro;
          inserted++;
        }
      }

      this.index = index;
      this.loaded = true;
      this.referenceName = `CODIGOS SGE VS C5.xlsx · aba "${sheetName}" · ${inserted} códigos mapeados`;

      console.log(`[Mapper] ${this.referenceName}${duplicates ? ` · ${duplicates} duplicatas ignoradas` : ''}`);
    })();

    return this.loadPromise;
  },

  /**
   * Consulta um código (com ou sem zeros à esquerda).
   * Retorna sempre um objeto, mesmo que vazio.
   * @param {string|number} codigo
   * @returns {{seqfamilia:*, seqproduto:*, desccompleta:*}}
   */
  lookup(codigo) {
    const empty = { seqfamilia: '', seqproduto: '', desccompleta: '' };
    if (!this.loaded || !this.index) return empty;
    const key = this.normalizeCodeKey(codigo);
    if (key === '') return empty;
    return this.index[key] || empty;
  },

  /**
   * Enriquece um array de registros com os campos do mapeamento.
   * Não modifica o array original; retorna novo array com propriedades adicionais.
   * Também registra estatísticas de match/miss.
   *
   * @param {Array<Object>} data
   * @returns {{data: Array<Object>, stats: {matched:number, unmatched:number}}}
   */
  enrich(data) {
    let matched = 0;
    let unmatched = 0;

    const enriched = data.map(rec => {
      const hit = this.lookup(rec.codigo);
      const hasMatch = hit.seqfamilia !== '' || hit.seqproduto !== '' || hit.desccompleta !== '';
      if (hasMatch) matched++; else unmatched++;

      return {
        ...rec,
        seqfamilia:   hit.seqfamilia   === '' || hit.seqfamilia   == null ? '' : hit.seqfamilia,
        seqproduto:   hit.seqproduto   === '' || hit.seqproduto   == null ? '' : hit.seqproduto,
        desccompleta: hit.desccompleta == null ? '' : String(hit.desccompleta)
      };
    });

    return { data: enriched, stats: { matched, unmatched } };
  },

  /**
   * Estado atual do módulo (para debug/diagnóstico).
   */
  status() {
    return {
      loaded: this.loaded,
      size: this.index ? Object.keys(this.index).length : 0,
      referenceName: this.referenceName
    };
  }
};