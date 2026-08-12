import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { useCurrentMonth } from '../state/AppStateContext.jsx';
import { TransactionRow } from './TransactionRow.jsx';

export function TransactionList({ refreshToken }) {
  const [currentMonth] = useCurrentMonth();
  const [transactions, setTransactions] = useState([]);

  const load = () => apiFetch(`/api/transactions?month=${currentMonth}`).then((r) => r.json()).then(({ data }) => setTransactions(data));

  useEffect(() => { load(); }, [currentMonth, refreshToken]);

  if (!transactions.length) return null;

  return (
    <div className="card">
      <h2>Income & expenses this month</h2>
      <div>
        {transactions.map((t) => <TransactionRow key={t.id} transaction={t} onChanged={load} />)}
      </div>
    </div>
  );
}
