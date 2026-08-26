import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api.js';
import { trimmedMean } from '../analysis.js';
import { useCurrentMonth } from '../state/AppStateContext.jsx';

const CHART_SPECS = [
  { id: 'chartIncome', key: 'income', bg: 'rgba(39,80,10,0.55)', border: '#27500a' },
  { id: 'chartExpenses', key: 'expenses', bg: 'rgba(121,31,31,0.55)', border: '#791f1f' },
  { id: 'chartNet', key: 'net', bg: null, border: null },
];

const baseOpts = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => `$${ctx.parsed.y.toFixed(2)}` } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
    y: { beginAtZero: true, ticks: { callback: (v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`, font: { size: 10 } } },
  },
};

export function AnalysisTab({ active }) {
  const [currentMonth] = useCurrentMonth();
  const [months, setMonths] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingMonth, setEditingMonth] = useState(null);
  const [editValues, setEditValues] = useState({ income: '', expenses: '' });
  const [histMonth, setHistMonth] = useState('');
  const [histIncome, setHistIncome] = useState('');
  const [histExpenses, setHistExpenses] = useState('');

  const canvasRefs = useRef({});
  const chartInstances = useRef({});

  const load = async () => {
    const { data } = await apiFetch('/api/analysis').then((r) => r.json());
    setMonths(data.months);
    setCategories(data.categories);
    setEditingMonth(null);
  };

  useEffect(() => { if (active) load(); }, [active, currentMonth]);

  useEffect(() => {
    if (!months.length) return;
    const sorted = [...months].reverse();
    const labels = sorted.map((m) => m.month);
    const nets = sorted.map((m) => m.income - m.expenses);

    CHART_SPECS.forEach(({ id, key, bg, border }) => {
      const canvas = canvasRefs.current[id];
      if (!canvas) return;
      if (chartInstances.current[id]) chartInstances.current[id].destroy();
      const data = key === 'net' ? nets : sorted.map((m) => m[key]);
      const backgroundColor = key === 'net' ? nets.map((v) => (v >= 0 ? 'rgba(39,80,10,0.55)' : 'rgba(121,31,31,0.55)')) : bg;
      const borderColor = key === 'net' ? nets.map((v) => (v >= 0 ? '#27500a' : '#791f1f')) : border;
      chartInstances.current[id] = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: { labels, datasets: [{ data, backgroundColor, borderColor, borderWidth: 1, borderRadius: 4 }] },
        options: baseOpts,
      });
    });

    return () => { Object.values(chartInstances.current).forEach((c) => c.destroy()); chartInstances.current = {}; };
  }, [months]);

  const addHistoricalMonth = async () => {
    if (!histMonth) { alert('Month is required.'); return; }
    await apiFetch('/api/monthly-summaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: histMonth, income: parseFloat(histIncome) || 0, expenses: parseFloat(histExpenses) || 0 }),
    });
    setHistIncome('');
    setHistExpenses('');
    await load();
  };

  const saveAnalysisMonth = async (month) => {
    const income = parseFloat(editValues.income);
    const expenses = parseFloat(editValues.expenses);
    if (isNaN(income) || isNaN(expenses)) { alert('Enter valid amounts.'); return; }
    await apiFetch('/api/monthly-summaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, income, expenses }),
    });
    await load();
  };

  const deleteHistoricalMonth = async (month) => {
    if (!confirm(`Delete manual data for ${month}?`)) return;
    await apiFetch(`/api/monthly-summaries/${encodeURIComponent(month)}`, { method: 'DELETE' });
    await load();
  };

  const upToSelected = months.filter((m) => m.month <= currentMonth && m.month !== currentMonth);
  const last12 = upToSelected.slice(0, 12);
  const avgIncome = last12.length >= 2 ? trimmedMean(last12.map((m) => m.income)) : 0;
  const avgExpenses = last12.length >= 2 ? trimmedMean(last12.map((m) => m.expenses)) : 0;
  const avgNet = last12.length >= 2 ? trimmedMean(last12.map((m) => m.income - m.expenses)) : 0;

  const last12Months = new Set(last12.map((m) => m.month));
  const catMap = {};
  categories.forEach((r) => {
    if (!last12Months.has(r.month)) return;
    (catMap[r.category] ??= []).push(r.total);
  });
  const catAvgs = Object.entries(catMap)
    .map(([category, vals]) => ({ category, avg: trimmedMean(vals), count: vals.length }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <>
      <div className="card">
        <h2>Add historical month</h2>
        <div className="form-row-3">
          <div className="form-group">
            <label>Month</label>
            <input type="month" value={histMonth} onChange={(e) => setHistMonth(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Income ($)</label>
            <input type="number" placeholder="0.00" step="0.01" min="0" value={histIncome} onChange={(e) => setHistIncome(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Expenses ($)</label>
            <input type="number" placeholder="0.00" step="0.01" min="0" value={histExpenses} onChange={(e) => setHistExpenses(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={addHistoricalMonth}>Add</button>
      </div>

      {!!months.length && (
        <div className="card">
          <h2>Monthly trends</h2>
          {CHART_SPECS.map(({ id }, i) => (
            <div key={id} className="chart-block" style={i === CHART_SPECS.length - 1 ? { marginBottom: 0 } : undefined}>
              <div className={`chart-title${id === 'chartIncome' ? ' income' : id === 'chartExpenses' ? ' expense' : ''}`}>
                {id === 'chartIncome' ? 'Income' : id === 'chartExpenses' ? 'Expenses' : 'Net'}
              </div>
              <canvas ref={(el) => { canvasRefs.current[id] = el; }} />
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>All months</h2>
        {!months.length ? (
          <p style={{ color: '#999', fontSize: 13 }}>No data yet.</p>
        ) : (
          <table className="compare-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Month</th>
                <th style={{ textAlign: 'right' }}>Income</th>
                <th style={{ textAlign: 'right' }}>Expenses</th>
                <th style={{ textAlign: 'right' }}>Net</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const net = m.income - m.expenses;
                const isEditing = editingMonth === m.month;
                return (
                  <tr key={m.month}>
                    <td>{m.month}{m.source === 'manual' ? <span className="badge">manual</span> : null}</td>
                    <td style={{ textAlign: 'right' }} className="income">
                      {isEditing
                        ? <input type="number" step="0.01" min="0" style={{ width: 90, textAlign: 'right' }} value={editValues.income} onChange={(e) => setEditValues((v) => ({ ...v, income: e.target.value }))} />
                        : `$${m.income.toFixed(2)}`}
                    </td>
                    <td style={{ textAlign: 'right' }} className="expense">
                      {isEditing
                        ? <input type="number" step="0.01" min="0" style={{ width: 90, textAlign: 'right' }} value={editValues.expenses} onChange={(e) => setEditValues((v) => ({ ...v, expenses: e.target.value }))} />
                        : `$${m.expenses.toFixed(2)}`}
                    </td>
                    <td style={{ textAlign: 'right' }} className={net >= 0 ? 'net-positive' : 'net-negative'}>
                      {isEditing ? '' : `$${net.toFixed(2)}`}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {m.source === 'manual' && (isEditing ? (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => saveAnalysisMonth(m.month)}>Save</button>
                          <button className="btn btn-sm" onClick={() => setEditingMonth(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-sm" onClick={() => { setEditingMonth(m.month); setEditValues({ income: m.income.toFixed(2), expenses: m.expenses.toFixed(2) }); }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteHistoricalMonth(m.month)}>Delete</button>
                        </>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {last12.length >= 2 && (
        <div className="card">
          <h2>Last 12 months — averages <span style={{ fontSize: 12, color: '#999', fontWeight: 400 }}>(trimmed: excl. highest &amp; lowest)</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <div className="metric">
              <div className="metric-label">Avg Income</div>
              <div className="metric-value income">${avgIncome.toFixed(2)}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Avg Expenses</div>
              <div className="metric-value expense">${avgExpenses.toFixed(2)}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Avg Net</div>
              <div className={`metric-value ${avgNet >= 0 ? 'net-positive' : 'net-negative'}`}>${avgNet.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {!!categories.length && (
        <div className="card">
          <h2>Category averages <span style={{ fontSize: 12, color: '#999', fontWeight: 400 }}>(last 12 months, trimmed)</span></h2>
          <table className="compare-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Avg / month</th>
                <th style={{ textAlign: 'right' }}>Months with data</th>
              </tr>
            </thead>
            <tbody>
              {catAvgs.map((c) => (
                <tr key={c.category}>
                  <td>{c.category}</td>
                  <td style={{ textAlign: 'right' }} className="expense">${c.avg.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#999' }}>{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
