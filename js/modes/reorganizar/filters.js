/* ============================================
   REORGANIZAR/FILTERS.JS
   ============================================
   Filtros, busca e ordenação sobre os dados reorganizados.
   ============================================ */

const ReorganizarFilters = {
  state: {
    data: [],
    filtered: [],
    search: '',
    categoria: '',
    tipocod: '',
    sortField: null,
    sortDir: 'asc'
  },

  setData(data) {
    this.state.data = Array.isArray(data) ? data : [];
    this.state.filtered = this.state.data.slice();
  },

  apply() {
    const { data, search, categoria, tipocod } = this.state;
    const s = search.trim().toLowerCase();

    this.state.filtered = data.filter(rec => {
      if (categoria && rec.CATEGORIA !== categoria) return false;
      if (tipocod && rec.TIPOCOD !== tipocod) return false;
      if (s) {
        const hay = `${rec.SEQ ?? ''} ${rec.DESC ?? ''} ${rec['COD ACESS'] ?? ''}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });

    if (this.state.sortField) this.sortInPlace();
    return this.state.filtered;
  },

  sortInPlace() {
    const { sortField, sortDir } = this.state;
    const dir = sortDir === 'asc' ? 1 : -1;

    this.state.filtered.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      const emptyA = va == null || va === '';
      const emptyB = vb == null || vb === '';
      if (emptyA && emptyB) return 0;
      if (emptyA) return 1;
      if (emptyB) return -1;

      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), 'pt-BR', { numeric: true }) * dir;
    });
  },

  setSearch(v)    { this.state.search = v == null ? '' : String(v); },
  setCategoria(v) { this.state.categoria = v == null ? '' : String(v); },
  setTipocod(v)   { this.state.tipocod = v == null ? '' : String(v); },

  setSort(field) {
    if (this.state.sortField === field) {
      this.state.sortDir = this.state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.state.sortField = field;
      this.state.sortDir = 'asc';
    }
  },

  getUniqueCategorias() {
    const set = new Set();
    this.state.data.forEach(r => { if (r.CATEGORIA) set.add(r.CATEGORIA); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  },

  getUniqueTipocods() {
    const set = new Set();
    this.state.data.forEach(r => { if (r.TIPOCOD) set.add(r.TIPOCOD); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  },

  reset() {
    this.state.search = '';
    this.state.categoria = '';
    this.state.tipocod = '';
    this.state.sortField = null;
    this.state.sortDir = 'asc';
    this.state.filtered = this.state.data.slice();
  },

  countFiltered() { return this.state.filtered.length; },
  countTotal()    { return this.state.data.length; }
};
