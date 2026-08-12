import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { RecurringRow } from './RecurringRow.jsx';

export function RecurringList({ refreshToken }) {
  const [recurring, setRecurring] = useState([]);

  const load = () => apiFetch('/api/recurring-transactions').then((r) => r.json()).then(({ data }) => setRecurring(data));

  useEffect(() => { load(); }, [refreshToken]);

  if (!recurring.length) return null;

  return (
    <div className="card">
      <h2>Fixed items</h2>
      <div>
        {recurring.map((r) => <RecurringRow key={r.id} recurring={r} onChanged={load} />)}
      </div>
    </div>
  );
}
