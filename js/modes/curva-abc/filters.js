/* ============================================
   FILTERS.JS — Filtros, busca e ordenação (Curva ABC)
   ============================================
   Responsável por:
   - Guardar o estado dos filtros ativos (busca, ABC, Unid)
   - Aplicar filtros e ordenação sobre os dados limpos + enriquecidos
   - Fornecer lista de unidades distintas para o dropdown
   - Ordenar por qualquer coluna (inclusive as novas: SEQFAMILIA,
     SEQPRODUTO e DESCCOMPLETA)
   ============================================ */

const CurvaABCFilters = {
  state: {
    data: [],          // dados originais (enriquecidos)
    filtered: [],      // dados após filtros + ordenação
    search: '',        // texto de busca (codigo, produto, desccompleta)
    abc: '',           // filtro por classe ABC (A/B/C) ou vazio
    unid: '',          // filtro por unidade (KG/UN/...) ou vazio
    sortField: null,   // campo de ordenação (ex: 'codigo', 'totalRS')
    sortDir: 'asc'     // 'asc' ou 'desc'
  },

  /**
   * Define a base de dados sobre a qual os filtros vão operar.
   * @param {Array<Object>} data
   */
  setData(data) {
    this.state.data = Array.isArray(data) ? data : [];
    this.state.filtered = this.state.data.slice();
  },

  /**
   * Aplica todos os filtros + ordenação ativa e retorna o resultado.
   * @returns {Array<Object>}
   */
  apply() {
    const { data, search, abc, unid } = this.state;
    const s = search.trim().toLowerCase();

    this.state.filtered = data.filter(rec => {
      // Filtro ABC
      if (abc && rec.abc !== abc) return false;

      // Filtro Unidade
      if (unid && rec.unid !== unid) return false;

      // Busca textual (código, produto e desc. completa)
      if (s) {
        const hay = [
          rec.codigo ?? '',
          rec.produto ?? '',
          rec.desccompleta ?? ''
        ].join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }

      return true;
    });

    if (this.state.sortField) {
      this.sortInPlace();
    }

    return this.state.filtered;
  },

  /**
   * Ordena `filtered` in-place conforme `sortField` / `sortDir`.
   * Suporta números e strings (com ordenação natural pt-BR).
   */
  sortInPlace() {
    const { sortField, sortDir } = this.state;
    const dir = sortDir === 'asc' ? 1 : -1;

    this.state.filtered.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];

      // Vazios vão sempre para o final
      const emptyA = va == null || va === '';
      const emptyB = vb == null || vb === '';
      if (emptyA && emptyB) return 0;
      if (emptyA) return 1;
      if (emptyB) return -1;

      // Números
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * dir;
      }

      // Strings / mistos → comparação natural (ex: "10" > "2")
      return String(va).localeCompare(String(vb), 'pt-BR', { numeric: true }) * dir;
    });
  },

  /* ---------- SETTERS ---------- */

  setSearch(v) { this.state.search = v == null ? '' : String(v); },
  setABC(v)    { this.state.abc = v == null ? '' : String(v); },
  setUnid(v)   { this.state.unid = v == null ? '' : String(v); },

  /**
   * Define o campo de ordenação. Se for o mesmo campo,
   * alterna entre asc/desc. Caso contrário, reseta para asc.
   */
  setSort(field) {
    if (this.state.sortField === field) {
      this.state.sortDir = this.state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.state.sortField = field;
      this.state.sortDir = 'asc';
    }
  },

  /* ---------- HELPERS ---------- */

  /**
   * Retorna lista de unidades distintas (para preencher o <select>).
   * @returns {Array<string>}
   */
  getUniqueUnids() {
    const set = new Set();
    this.state.data.forEach(r => {
      if (r.unid) set.add(r.unid);
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { numeric: true })
    );
  },

  /**
   * Retorna lista de classes ABC distintas presentes nos dados.
   * (útil caso queira montar o filtro dinamicamente)
   * @returns {Array<string>}
   */
  getUniqueABC() {
    const set = new Set();
    this.state.data.forEach(r => {
      if (r.abc) set.add(r.abc);
    });
    return Array.from(set).sort();
  },

  /**
   * Reseta filtros e ordenação (mantém o dataset).
   */
  reset() {
    this.state.search = '';
    this.state.abc = '';
    this.state.unid = '';
    this.state.sortField = null;
    this.state.sortDir = 'asc';
    this.state.filtered = this.state.data.slice();
  },

  /**
   * Total de registros considerando os filtros ativos.
   */
  countFiltered() {
    return this.state.filtered.length;
  },

  /**
   * Total de registros na base (sem filtros).
   */
  countTotal() {
    return this.state.data.length;
  }
};