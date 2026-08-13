import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { useHeroStats } from '../state/AppStateContext.jsx';

export function DebtsTab({ active }) {
  const [, setHeroStats] = useHeroStats();
  const [debts, setDebts] = useState([]);
  const [type, setType] = useState('receivable');
  const [person, setPerson] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const load = async () => {
    const { data } = await apiFetch('/api/debts').then((r) => r.json());
    setDebts(data);
    const openTotal = (t) => data.filter((d) => d.type === t && !d.settled).reduce((s, d) => s + parseFloat(d.amount), 0);
    setHeroStats((s) => ({ ...s, receivableTotal: openTotal('receivable'), payableTotal: openTotal('payable') }));
  };

  useEffect(() => { if (active) load(); }, [active]);

  const addDebt = async () => {
    const trimmedPerson = person.trim();
    const parsedAmount = parseFloat(amount);
    if (!trimmedPerson || !parsedAmount) { alert('Person and amount are required.'); return; }
    await apiFetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, person: trimmedPerson, description: description.trim(), amount: parsedAmount }),
    });
    setPerson('');
    setDescription('');
    setAmount('');
    await load();
  };

  const settleDebt = async (id) => {
    await apiFetch(`/api/debts/${id}/settle`, { method: 'PUT' });
    await load();
  };

  const deleteDebt = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await apiFetch(`/api/debts/${id}`, { method: 'DELETE' });
    await load();
  };

  const receivables = debts.filter((d) => d.type === 'receivable');
  const payables = debts.filter((d) => d.type === 'payable');

  const renderSection = (title, items, cls) => {
    if (!items.length) return null;
    const openItems = items.filter((d) => !d.settled);
    const total = openItems.reduce((s, d) => s + parseFloat(d.amount), 0);
    return (
      <>
        <div className="debts-section-title">{title}</div>
        {items.map((d) => (
          <div key={d.id} className={`list-item${d.settled ? ' debt-settled' : ''}`}>
            <div className="list-item-info">
              <div className="list-item-name">{d.person}{d.description ? ` · ${d.description}` : ''}</div>
              <div className="list-item-meta">{d.month}{d.settled ? ' · settled' : ''}</div>
            </div>
            <div className="list-item-right">
              <div className={`list-item-amount ${cls}`}>${parseFloat(d.amount).toFixed(2)}</div>
            </div>
            {!d.settled && <button className="btn btn-sm" onClick={() => settleDebt(d.id)}>Settle</button>}
            <button className="btn btn-danger btn-sm" onClick={() => deleteDebt(d.id)}>Delete</button>
          </div>
        ))}
        {!!openItems.length && (
          <div className="debts-total">
            <span className="debts-total-label">Total open</span>
            <span className={cls}>${total.toFixed(2)}</span>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="card">
        <h2>Add debt</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="receivable">Receivable (owed to me)</option>
              <option value="payable">Payable (I owe)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Person / entity</label>
            <input type="text" placeholder="e.g. John" value={person} onChange={(e) => setPerson(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Description</label>
            <input type="text" placeholder="Optional" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Amount ($)</label>
            <input type="number" placeholder="0.00" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={addDebt}>Add</button>
      </div>

      {!!debts.length && (
        <div className="card">
          <div>
            {renderSection('Owed to me (receivable)', receivables, 'income')}
            {renderSection('I owe (payable)', payables, 'expense')}
          </div>
        </div>
      )}
    </>
  );
}
