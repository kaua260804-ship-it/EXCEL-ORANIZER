/* ============================================
   REORGANIZAR/CLEANER.JS
   ============================================
   Lógica principal de limpeza:
   - Detecta células "sujas" na coluna COD ACESS
     (contêm TABs e/ou quebras de linha)
   - Faz o parse de cada linha interna (6 campos por TAB)
   - Trata fragmentos (linhas com < 6 campos)
   - Corrige notação científica em códigos
   - Preserva zeros à esquerda
   ============================================ */

const ReorganizarCleaner = {

  // Colunas fixas da planilha
  COLS: ['SEQ', 'DESC', 'CATEGORIA', 'TIPOCOD', 'QTD EMB', 'COD ACESS'],

  /**
   * Detecta se uma célula COD ACESS está "suja":
   * - Contém TAB, OU
   * - Contém múltiplas linhas E ao menos 3 TABs
   */
  celulaSuja(valor) {
    if (valor == null) return false;
    const s = String(valor);
    if (s.includes('\t')) return true;
    const lines = s.split('\n').length;
    const tabs = (s.match(/\t/g) || []).length;
    return lines > 1 && tabs >= 3;
  },

  /**
   * Corrige notação científica em códigos (ex.: "7,62221E+13" → "76222100000000").
   * Preserva zeros à esquerda quando não é notação científica.
   */
  limparCodigo(v) {
    const s = String(v ?? '').trim();
    if (!s) return '';
    // Notação científica (com vírgula ou ponto)
    if (/e/i.test(s)) {
      try {
        const n = parseFloat(s.replace(',', '.'));
        if (!isNaN(n) && isFinite(n)) {
          // BigInt para não perder precisão em inteiros longos
          return String(BigInt(Math.trunc(n)));
        }
      } catch (_) { /* mantém original */ }
    }
    return s;
  },

  /**
   * Faz o parse de uma célula suja em múltiplos registros.
   * @param {string} valor
   * @returns {Array<Object>} registros extraídos
   */
  parseCelulaSuja(valor) {
    const texto = String(valor).replace(/\r\n/g, '\n').replace(/\r/g, '');
    const linhas = texto.split('\n').filter(l => l.trim() !== '');
    const registros = [];

    for (const linha of linhas) {
      const partes = linha.split('\t');

      // Fragmento de descrição: junta ao último registro
      if (partes.length < 6 && registros.length > 0) {
        const frag = linha.trim();
        if (frag) {
          registros[registros.length - 1].DESC =
            (registros[registros.length - 1].DESC + ' ' + frag).trim();
        }
        continue;
      }

      // Completa até 6 campos
      while (partes.length < 6) partes.push('');

      registros.push({
        SEQ:       partes[0].trim(),
        DESC:      partes[1].trim(),
        CATEGORIA: partes[2].trim(),
        TIPOCOD:   partes[3].trim(),
        'QTD EMB': partes[4].trim(),
        'COD ACESS': partes[5].trim()
      });
    }

    return registros;
  },

  /**
   * Normaliza uma linha bruta em um objeto com as 6 colunas esperadas.
   */
  buildRow(linha) {
    const obj = {};
    this.COLS.forEach((c, i) => {
      const v = linha[i];
      obj[c] = v == null ? '' : String(v).trim();
    });
    return obj;
  },

  /**
   * Verifica se uma linha está totalmente vazia.
   */
  isLinhaVazia(obj) {
    return this.COLS.every(c => !obj[c]);
  },

  /**
   * Processa uma matriz de linhas brutas (array de arrays).
   * Retorna { data, stats }.
   *
   * @param {Array<Array>} linhasBrutas
   * @returns {{data: Array<Object>, stats: Object}}
   */
  process(linhasBrutas) {
    const stats = {
      totalRows: linhasBrutas.length,
      linhasVazias: 0,
      linhasSujas: 0,
      linhasExpandidas: 0,
      registrosFinais: 0
    };

    const resultado = [];

    for (const linha of linhasBrutas) {
      if (!Array.isArray(linha)) continue;

      const obj = this.buildRow(linha);

      // Ignora linhas totalmente vazias
      if (this.isLinhaVazia(obj)) {
        stats.linhasVazias++;
        continue;
      }

      if (this.celulaSuja(obj['COD ACESS'])) {
        stats.linhasSujas++;
        const expandidas = this.parseCelulaSuja(obj['COD ACESS']);

        // Preenche SEQ/DESC/CATEGORIA/TIPOCOD originais quando vierem vazios
        expandidas.forEach(r => {
          if (!r.SEQ)       r.SEQ = obj.SEQ;
          if (!r.DESC)      r.DESC = obj.DESC;
          if (!r.CATEGORIA) r.CATEGORIA = obj.CATEGORIA;
          if (!r.TIPOCOD)   r.TIPOCOD = obj.TIPOCOD;
          r['COD ACESS'] = this.limparCodigo(r['COD ACESS']);
          resultado.push(r);
        });

        // Contabiliza linhas "novas" geradas (além da 1ª)
        if (expandidas.length > 0) {
          stats.linhasExpandidas += expandidas.length - 1;
        }
      } else {
        // Linha normal: apenas normaliza o código
        obj['COD ACESS'] = this.limparCodigo(obj['COD ACESS']);
        resultado.push(obj);
      }
    }

    // Filtra novamente garantindo que não há linhas totalmente vazias
    const data = resultado.filter(r => Object.values(r).some(v => v !== ''));

    stats.registrosFinais = data.length;
    return { data, stats };
  },

  /**
   * Processa múltiplas abas em lote.
   * @param {Array<{name:string, rows:Array<Array>}>} sheets
   */
  processAll(sheets) {
    const all = [];
    const stats = {
      totalRows: 0, linhasVazias: 0, linhasSujas: 0,
      linhasExpandidas: 0, registrosFinais: 0
    };

    sheets.forEach(sheet => {
      const r = this.process(sheet.rows);
      all.push(...r.data);
      Object.keys(stats).forEach(k => stats[k] += (r.stats[k] || 0));
    });

    // Recalcula final
    stats.registrosFinais = all.length;
    return { data: all, stats };
  }
};
