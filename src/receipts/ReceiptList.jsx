import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { useCurrentMonth } from '../state/AppStateContext.jsx';
import { ReceiptGroup } from './ReceiptGroup.jsx';

export function ReceiptList({ refreshToken }) {
  const [currentMonth] = useCurrentMonth();
  const [receipts, setReceipts] = useState([]);

  const load = () => apiFetch(`/api/receipts?month=${currentMonth}`).then((r) => r.json()).then(({ data }) => setReceipts(data));

  useEffect(() => { load(); }, [currentMonth, refreshToken]);

  if (!receipts.length) return null;

  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Receipts this month</h2>
      <div>
        {receipts.map((r) => <ReceiptGroup key={r.id} receipt={r} onChanged={load} />)}
      </div>
    </div>
  );
}
