import { state } from './state.js';
import { updateHeroInvestment } from './hero.js';
import { loadMonths } from './core.js';

export function trimmedMean(values) {
  if (!values.length) return 0;
  if (values.length < 3) return values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

export function renderCharts(months) {
  const card = document.getElementById('analysisChartsCard');
  if (!months.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';

  const sorted = [...months].reverse(); // oldest → newest
  const labels = sorted.map(m => m.month);
  const incomes = sorted.map(m => m.income);
  const expenses = sorted.map(m => m.expenses);
  const nets = sorted.map(m => m.income - m.expenses);

  const baseOpts = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `$${ctx.parsed.y.toFixed(2)}` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
      y: { ticks: { callback: v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`, font: { size: 10 } } }
    }
  };

  [
    { id: 'chartIncome',   data: incomes,  bg: 'rgba(39,80,10,0.55)',    border: '#27500a' },
    { id: 'chartExpenses', data: expenses, bg: 'rgba(121,31,31,0.55)',   border: '#791f1f' },
    { id: 'chartNet',      data: nets,
      bg: nets.map(v => v >= 0 ? 'rgba(39,80,10,0.55)' : 'rgba(121,31,31,0.55)'),
      border: nets.map(v => v >= 0 ? '#27500a' : '#791f1f') },
  ].forEach(({ id, data, bg, border }) => {
    if (state.chartInstances[id]) state.chartInstances[id].destroy();
    const ctx = document.getElementById(id).getContext('2d');
    state.chartInstances[id] = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: bg, borderColor: border, borderWidth: 1, borderRadius: 4 }] },
      options: { ...baseOpts, scales: { ...baseOpts.scales, y: { ...baseOpts.scales.y, beginAtZero: true } } }
    });
  });
}

export function editAnalysisMonth(month, income, expenses) {
  document.getElementById(`ar-income-${month}`).innerHTML =
    `<input type="number" id="ar-inc-${month}" value="${income.toFixed(2)}" step="0.01" min="0" style="width:90px;text-align:right;">`;
  document.getElementById(`ar-expenses-${month}`).innerHTML =
    `<input type="number" id="ar-exp-${month}" value="${expenses.toFixed(2)}" step="0.01" min="0" style="width:90px;text-align:right;">`;
  document.getElementById(`ar-net-${month}`).textContent = '';
  document.getElementById(`ar-actions-${month}`).innerHTML =
    `<button class="btn btn-primary btn-sm" onclick="saveAnalysisMonth('${month}')">Save</button>
     <button class="btn btn-sm" onclick="loadAnalysis()">Cancel</button>`;
}

export async function saveAnalysisMonth(month) {
  const income   = parseFloat(document.getElementById(`ar-inc-${month}`).value);
  const expenses = parseFloat(document.getElementById(`ar-exp-${month}`).value);
  if (isNaN(income) || isNaN(expenses)) return alert('Enter valid amounts.');
  await fetch('/api/monthly-summaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, income, expenses })
  });
  await loadAnalysis();
}

export async function loadAnalysis() {
  const res = await fetch('/api/analysis');
  const { data } = await res.json();

  const tableEl = document.getElementById('analysisTable');
  if (!tableEl) return;

  if (!data.months.length) {
    tableEl.innerHTML = '<p style="color:#999;font-size:13px;">No data yet.</p>';
    renderCharts([]);
    return;
  }

  renderCharts(data.months);

  tableEl.innerHTML = `
    <table class="compare-table" style="width:100%;">
      <thead>
        <tr>
          <th>Month</th>
          <th style="text-align:right;">Income</th>
          <th style="text-align:right;">Expenses</th>
          <th style="text-align:right;">Net</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${data.months.map(m => {
          const net = m.income - m.expenses;
          const actions = m.source === 'manual'
            ? `<button class="btn btn-sm" onclick="editAnalysisMonth('${m.month}',${m.income},${m.expenses})">Edit</button>
               <button class="btn btn-danger btn-sm" onclick="deleteHistoricalMonth('${m.month}')">Delete</button>`
            : '';
          return `<tr id="analysis-row-${m.month}">
            <td>${m.month}${m.source === 'manual' ? ' <span class="badge">manual</span>' : ''}</td>
            <td style="text-align:right;" class="income" id="ar-income-${m.month}">$${m.income.toFixed(2)}</td>
            <td style="text-align:right;" class="expense" id="ar-expenses-${m.month}">$${m.expenses.toFixed(2)}</td>
            <td style="text-align:right;" class="${net >= 0 ? 'net-positive' : 'net-negative'}" id="ar-net-${m.month}">$${net.toFixed(2)}</td>
            <td style="text-align:right;" id="ar-actions-${m.month}">${actions}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;

  const now = new Date();
  const realCurrentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const last12 = data.months.filter(m => m.month !== realCurrentMonth).slice(0, 12);
  const allPast = data.months.filter(m => m.month !== realCurrentMonth);

  const heroBanner = document.getElementById('heroBanner');
  if (allPast.length) {
    const historicNet = allPast.reduce((s, m) => s + (m.income - m.expenses), 0);
    const totalIncome = last12.reduce((s, m) => s + m.income, 0);
    const totalExp    = last12.reduce((s, m) => s + m.expenses, 0);
    const expPct      = totalIncome > 0 ? (totalExp / totalIncome * 100) : 0;
    document.getElementById('heroNet').textContent = `$${historicNet.toFixed(2)}`;
    document.getElementById('heroNetMonths').textContent = `${allPast.length} month${allPast.length !== 1 ? 's' : ''}`;
    document.getElementById('heroPct').textContent = `${expPct.toFixed(1)}% of income spent on average (last 12 months)`;
    heroBanner.style.display = 'block';
  } else {
    heroBanner.style.display = 'none';
  }

  const avgCard = document.getElementById('analysisAvgCard');
  if (last12.length >= 2) {
    const avgIncome   = trimmedMean(last12.map(m => m.income));
    const avgExpenses = trimmedMean(last12.map(m => m.expenses));
    const avgNet      = trimmedMean(last12.map(m => m.income - m.expenses));
    state.heroAvgExpenses12 = avgExpenses;
    updateHeroInvestment();
    document.getElementById('analysisAvg').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        <div class="metric">
          <div class="metric-label">Avg Income</div>
          <div class="metric-value income">$${avgIncome.toFixed(2)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Avg Expenses</div>
          <div class="metric-value expense">$${avgExpenses.toFixed(2)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Avg Net</div>
          <div class="metric-value ${avgNet >= 0 ? 'net-positive' : 'net-negative'}">$${avgNet.toFixed(2)}</div>
        </div>
      </div>
    `;
    avgCard.style.display = 'block';
  } else {
    avgCard.style.display = 'none';
  }

  const catCard = document.getElementById('analysisCatCard');
  if (data.categories.length) {
    const last12Months = new Set(last12.map(m => m.month));
    const catMap = {};
    data.categories.forEach(r => {
      if (!last12Months.has(r.month)) return;
      if (!catMap[r.category]) catMap[r.category] = [];
      catMap[r.category].push(r.total);
    });

    const catAvgs = Object.entries(catMap)
      .map(([category, vals]) => ({ category, avg: trimmedMean(vals), count: vals.length }))
      .sort((a, b) => b.avg - a.avg);

    document.getElementById('analysisCat').innerHTML = `
      <table class="compare-table" style="width:100%;">
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align:right;">Avg / month</th>
            <th style="text-align:right;">Months with data</th>
          </tr>
        </thead>
        <tbody>
          ${catAvgs.map(c => `
            <tr>
              <td>${c.category}</td>
              <td style="text-align:right;" class="expense">$${c.avg.toFixed(2)}</td>
              <td style="text-align:right;color:#999;">${c.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    catCard.style.display = 'block';
  } else {
    catCard.style.display = 'none';
  }
}

export async function addHistoricalMonth() {
  const month    = document.getElementById('histMonth').value;
  const income   = parseFloat(document.getElementById('histIncome').value) || 0;
  const expenses = parseFloat(document.getElementById('histExpenses').value) || 0;
  if (!month) return alert('Month is required.');
  await fetch('/api/monthly-summaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, income, expenses })
  });
  document.getElementById('histIncome').value = '';
  document.getElementById('histExpenses').value = '';
  await loadMonths();
  await loadAnalysis();
}

export async function deleteHistoricalMonth(month) {
  if (!confirm(`Delete manual data for ${month}?`)) return;
  await fetch(`/api/monthly-summaries/${encodeURIComponent(month)}`, { method: 'DELETE' });
  await loadMonths();
  await loadAnalysis();
}
