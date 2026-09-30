/* ============================================
   CONFIG.JS — Constantes e configurações globais
   ============================================ */

const CONFIG = {
  APP_NAME: 'EXCEL ORGANIZER',
  APP_VERSION: '1.1.0',

  // Limite de preview (linhas exibidas nas tabelas)
  PREVIEW_ROWS: 50,

  // Limite de linhas salvas no histórico
  HISTORY_LIMIT: 5,

  // Chaves do localStorage
  STORAGE_KEYS: {
    THEME: 'excel_organizer_theme',
    HISTORY: 'excel_organizer_history'
  },

  // Formatos aceitos
  ACCEPTED_EXTENSIONS: ['.xls', '.xlsx', '.csv'],
  ACCEPTED_MIME: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ],

  // Palavras-chave para detecção de linhas indesejadas (SGE)
  KEYWORDS: {
    HEADER_SGE: ['SGE - Sistema de Gerenciamento Empresarial', 'SGE – Sistema'],
    INFO: ['EMPRESA:', 'Local:', 'PERIODO:', 'Página', 'Usuario:', 'Usuário:'],
    COLUMN_HEADER: ['Código', 'Produto', 'Ocor'],
    TOTALS: [
      'QUANTIDADE DE ITENS:',
      'TOTAL FRENTE DE CAIXA:',
      'TOTAL RETAGUARDA:',
      'TOTAL GERAL:'
    ]
  },

  // Colunas finais do modo Curva ABC (após enriquecimento com SGE vs C5)
  CURVA_ABC_COLUMNS: [
    'Código', 'Produto', 'Ocor', 'Peças', 'Qtd', 'Unid',
    '%', 'Pr. Médio', 'Total R$', '%', 'ABC', '% Ac.',
    'SEQFAMILIA', 'SEQPRODUTO', 'DESCCOMPLETA'
  ],

  // Colunas normalizadas (nomes internos)
  CURVA_ABC_FIELDS: [
    'codigo', 'produto', 'ocor', 'pecas', 'qtd', 'unid',
    'perc1', 'precoMedio', 'totalRS', 'perc2', 'abc', 'percAc',
    'seqfamilia', 'seqproduto', 'desccompleta'
  ],

  // Cores dos badges ABC
  ABC_COLORS: {
    A: '#16a34a',
    B: '#f59e0b',
    C: '#dc2626'
  },

  // --- Mapeamento SGE vs C5 ---
  MAPPER: {
    // Caminho relativo da planilha de referência (hospedada junto ao site)
    REFERENCE_FILE: 'dados/CODIGOS SGE VS C5.xlsx',

    // Nome da aba esperada (se vazio, usa a primeira)
    REFERENCE_SHEET: '',

    // Cabeçalhos esperados na planilha de referência (case-insensitive, normalizados)
    COLUMNS: {
      SEQFAMILIA: 'seqfamilia',
      SEQPRODUTO: 'seqproduto',
      DESCCOMPLETA: 'desccompleta',
      CODIGO_SGE: 'codigo sge' // após normalização (remove acentos, pontuação)
    }
  }
};