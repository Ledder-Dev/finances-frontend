import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { useCurrentMonth } from '../state/AppStateContext.jsx';

export function SummaryGrid() {
  const [currentMonth] = useCurrentMonth();
  const [data, setData] = useState(null);

  useEffect(() => {
    apiFetch(`/api/summary?month=${currentMonth}`)
      .then((r) => r.json())
      .then(({ data }) => setData(data));
  }, [currentMonth]);

  if (!data) return null;

  const totalSpending = data.categories.reduce((s, c) => s + c.total, 0) + data.tax;
  const spendingPct = data.income > 0 ? (totalSpending / data.income) * 100 : 0;
  const breakdownItems = [
    ...data.categories.map((c) => ({ label: c.category, value: c.total })),
    ...(data.tax > 0 ? [{ label: 'Tax', value: data.tax }] : []),
  ].sort((a, b) => b.value - a.value);

  return (
    <div>
      <div className="summary-top">
        <div className="summary-hero summary-hero--income">
          <div className="sh-label">Income</div>
          <div className="sh-value income">${data.income.toFixed(2)}</div>
        </div>
        <div className="summary-hero summary-hero--spent">
          <div className="sh-label">Total spent</div>
          <div className="sh-value expense">${totalSpending.toFixed(2)}</div>
          {data.income > 0 && <div className="sh-sub">{spendingPct.toFixed(1)}% of income</div>}
        </div>
        <div className="summary-hero summary-hero--net">
          <div className="sh-label">Net</div>
          <div className={`sh-value ${data.net >= 0 ? 'net-positive' : 'net-negative'}`}>${data.net.toFixed(2)}</div>
        </div>
      </div>
      {!!breakdownItems.length && (
        <div className="summary-breakdown">
          <div className="bd-header">
            <span className="bd-title">Breakdown</span>
            <span className="bd-total">{breakdownItems.length} categories · ${totalSpending.toFixed(2)}</span>
          </div>
          {breakdownItems.map((item) => {
            const pct = totalSpending > 0 ? (item.value / totalSpending) * 100 : 0;
            const incomePct = data.income > 0 ? (item.value / data.income) * 100 : 0;
            return (
              <div key={item.label} className="bd-row">
                <div className="bd-label">{item.label}</div>
                <div className="bd-bar-wrap">
                  <div className="bd-bar" style={{ width: `${pct.toFixed(2)}%` }} />
                </div>
                <div className="bd-amount">{incomePct.toFixed(1)}%</div>
                <div className="bd-amount bd-amount--main expense">${item.value.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
