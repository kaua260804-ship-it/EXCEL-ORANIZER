/* ============================================
   UTILS.JS — Funções utilitárias
   ============================================ */

const Utils = {

  /* ---------- FORMATAÇÃO ---------- */

  /** Formata número com separador de milhares (pt-BR) */
  formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || value === '') return '';
    const n = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(n)) return String(value);
    return n.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  },

  /** Formata valor monetário em R$ */
  formatCurrency(value) {
    if (value === null || value === undefined || value === '') return '';
    const n = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(n)) return String(value);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  /** Formata data por extenso pt-BR */
  formatDate(date = new Date()) {
    return date.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  },

  /** Gera timestamp no formato YYYYMMDD_HHMMSS */
  timestamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  },

  /* ---------- VALIDAÇÃO ---------- */

  /** Verifica se string está vazia/undefined */
  isEmpty(v) {
    return v === null || v === undefined || String(v).trim() === '';
  },

  /** Verifica se uma string contém alguma das keywords (case-insensitive) */
  containsAny(str, keywords) {
    if (this.isEmpty(str)) return false;
    const s = String(str).toLowerCase();
    return keywords.some(k => s.includes(k.toLowerCase()));
  },

  /** Detecta se é um código com zeros à esquerda */
  isPaddedCode(v) {
    if (this.isEmpty(v)) return false;
    const s = String(v).trim();
    return /^0\d+$/.test(s);
  },

  /** Verifica se valor é numérico */
  isNumeric(v) {
    if (this.isEmpty(v)) return false;
    if (typeof v === 'number') return !isNaN(v);
    const s = String(v).trim().replace(',', '.');
    return /^-?\d+(\.\d+)?$/.test(s) && !isNaN(parseFloat(s));
  },

  /** Converte para número (ou null) */
  toNumber(v) {
    if (this.isEmpty(v)) return null;
    if (typeof v === 'number') return v;
    const s = String(v).trim().replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  },

  /** Normaliza código preservando zeros à esquerda */
  normalizeCode(v) {
    if (this.isEmpty(v)) return '';
    // Se veio como número do Excel, pode ter perdido zeros. Retornamos string.
    return String(v).trim();
  },

  /* ---------- DOM ---------- */

  /** Atalho querySelector */
  $(sel, ctx = document) { return ctx.querySelector(sel); },

  /** Atalho querySelectorAll (retorna array) */
  $$(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); },

  /** Cria elemento com atributos e filhos */
  el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  },

  /** Escapa HTML */
  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /* ---------- ARQUIVOS ---------- */

  /** Formata tamanho de arquivo */
  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  },

  /** Extrai extensão em minúsculas */
  getExtension(filename) {
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
  },

  /** Valida extensão do arquivo */
  isAcceptedFile(file) {
    const ext = this.getExtension(file.name);
    return CONFIG.ACCEPTED_EXTENSIONS.includes(ext);
  },

  /* ---------- DOWNLOAD ---------- */

  /** Dispara download de um Blob */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  /* ---------- DEBOUNCE / THROTTLE ---------- */

  debounce(fn, wait = 300) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  },

  throttle(fn, wait = 200) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= wait) { last = now; fn.apply(this, args); }
    };
  },

  /* ---------- STORAGE ---------- */

  storageGet(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },

  storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },

  storageRemove(key) {
    try { localStorage.removeItem(key); } catch {}
  }
};