/* ============================================
   DASHBOARD.JS — Cards de estatísticas e gráficos
   ============================================ */

const CurvaABCDashboard = {
  chartInstance: null,

  compute(data) {
    const totalSKUs = data.length;
    let totalRS = 0;
    const abcCount = { A: 0, B: 0, C: 0 };
    const unids = new Set();
    let mapped = 0;

    data.forEach(r => {
      totalRS += (r.totalRS || 0);
      if (r.abc === 'A' || r.abc === 'B' || r.abc === 'C') abcCount[r.abc]++;
      if (r.unid) unids.add(r.unid);
      if (r.seqproduto !== '' || r.desccompleta !== '') mapped++;
    });

    const topByRS = [...data].sort((a, b) => (b.totalRS || 0) - (a.totalRS || 0)).slice(0, 5);
    const topByQtd = [...data].sort((a, b) => (b.qtd || 0) - (a.qtd || 0)).slice(0, 5);

    return {
      totalSKUs,
      totalRS,
      abcCount,
      unids: Array.from(unids).sort(),
      topByRS,
      topByQtd,
      mapped,
      unmapped: totalSKUs - mapped
    };
  },

  render(container, data) {
    const s = this.compute(data);
    const totalABC = s.abcCount.A + s.abcCount.B + s.abcCount.C || 1;
    const pct = (n) => ((n / totalABC) * 100).toFixed(1) + '%';

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card stat-info">
          <div class="stat-icon"><i class="fa-solid fa-boxes-stacked"></i></div>
          <div class="stat-body">
            <div class="stat-label">Total de SKUs</div>
            <div class="stat-value">${Utils.formatNumber(s.totalSKUs, 0)}</div>
          </div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-icon"><i class="fa-solid fa-sack-dollar"></i></div>
          <div class="stat-body">
            <div class="stat-label">Total em R$</div>
            <div class="stat-value">${Utils.formatCurrency(s.totalRS)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-ranking-star"></i></div>
          <div class="stat-body">
            <div class="stat-label">Classe A</div>
            <div class="stat-value">${s.abcCount.A} <small style="font-size:.7rem;color:var(--text-muted)">(${pct(s.abcCount.A)})</small></div>
          </div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-icon"><i class="fa-solid fa-scale-balanced"></i></div>
          <div class="stat-body">
            <div class="stat-label">Classe B</div>
            <div class="stat-value">${s.abcCount.B} <small style="font-size:.7rem;color:var(--text-muted)">(${pct(s.abcCount.B)})</small></div>
          </div>
        </div>
        <div class="stat-card stat-danger">
          <div class="stat-icon"><i class="fa-solid fa-arrow-trend-down"></i></div>
          <div class="stat-body">
            <div class="stat-label">Classe C</div>
            <div class="stat-value">${s.abcCount.C} <small style="font-size:.7rem;color:var(--text-muted)">(${pct(s.abcCount.C)})</small></div>
          </div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-icon"><i class="fa-solid fa-ruler"></i></div>
          <div class="stat-body">
            <div class="stat-label">Unidades</div>
            <div class="stat-value">${s.unids.length} <small style="font-size:.7rem;color:var(--text-muted)">${Utils.escapeHtml(s.unids.join(', '))}</small></div>
          </div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-icon"><i class="fa-solid fa-link"></i></div>
          <div class="stat-body">
            <div class="stat-label">Mapeados (SGE vs C5)</div>
            <div class="stat-value">${Utils.formatNumber(s.mapped, 0)}
              <small style="font-size:.7rem;color:var(--text-muted)">
                (${s.totalSKUs ? ((s.mapped / s.totalSKUs) * 100).toFixed(1) : 0}%)
              </small>
            </div>
          </div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-icon"><i class="fa-solid fa-link-slash"></i></div>
          <div class="stat-body">
            <div class="stat-label">Não Mapeados</div>
            <div class="stat-value">${Utils.formatNumber(s.unmapped, 0)}</div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-chart-pie"></i> Distribuição ABC</h3></div>
          <div class="chart-container"><canvas id="abcChart"></canvas></div>
        </div>

        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-trophy"></i> Top 5 por Total R$</h3></div>
          <ul class="top-list">
            ${s.topByRS.map((r, i) => `
              <li>
                <span class="top-rank">${i + 1}</span>
                <span class="top-name" title="${Utils.escapeHtml(r.desccompleta || r.produto)}">
                  ${Utils.escapeHtml(r.desccompleta || r.produto || r.codigo)}
                </span>
                <span class="top-value">${Utils.formatCurrency(r.totalRS)}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-cubes"></i> Top 5 por Quantidade</h3></div>
          <ul class="top-list">
            ${s.topByQtd.map((r, i) => `
              <li>
                <span class="top-rank">${i + 1}</span>
                <span class="top-name" title="${Utils.escapeHtml(r.desccompleta || r.produto)}">
                  ${Utils.escapeHtml(r.desccompleta || r.produto || r.codigo)}
                </span>
                <span class="top-value">${Utils.formatNumber(r.qtd, 2)} ${Utils.escapeHtml(r.unid || '')}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    this.renderChart(s.abcCount);
  },

  renderChart(abcCount) {
    const ctx = document.getElementById('abcChart');
    if (!ctx || !window.Chart) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const labels = ['Classe A', 'Classe B', 'Classe C'];
    const values = [abcCount.A, abcCount.B, abcCount.C];
    const colors = [CONFIG.ABC_COLORS.A, CONFIG.ABC_COLORS.B, CONFIG.ABC_COLORS.C];

    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  destroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
};