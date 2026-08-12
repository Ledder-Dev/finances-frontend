import { useState } from 'react';
import { apiFetch } from '../api.js';
import { useTxCategories } from '../state/AppStateContext.jsx';

export function RecurringForm({ onSaved }) {
  const [, setDbTxCategories] = useTxCategories();
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const loadCategories = () => apiFetch('/api/transaction-categories').then((r) => r.json()).then(({ data }) => setDbTxCategories(data));

  const submit = async () => {
    const trimmedCategory = category.trim();
    const amt = parseFloat(amount);
    if (!trimmedCategory || !amt) { alert('Category and amount are required.'); return; }
    await apiFetch('/api/recurring-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, category: trimmedCategory, description: description.trim(), amount: amt }),
    });
    setCategory('');
    setDescription('');
    setAmount('');
    await loadCategories();
    onSaved();
  };

  return (
    <div className="card">
      <h2>Add fixed income or expense</h2>
      <p style={{ color: '#999', fontSize: 13, marginTop: -8, marginBottom: 12 }}>Added automatically every month. Edit or delete a given month's entry without affecting future months — remove it here to stop it entirely.</p>
      <div className="form-row">
        <div className="form-group">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="form-group">
          <label>Category</label>
          <input type="text" list="txCategoryList" placeholder="e.g. Rent" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Description</label>
          <input type="text" placeholder="e.g. Monthly rent" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Amount ($)</label>
          <input type="number" placeholder="0.00" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-primary" onClick={submit}>Add fixed item</button>
    </div>
  );
}
