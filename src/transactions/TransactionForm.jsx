import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { useCurrentMonth, useTxCategories } from '../state/AppStateContext.jsx';
import { txDefaultCategories } from '../state.js';

export function TransactionForm({ onSaved }) {
  const [currentMonth] = useCurrentMonth();
  const [dbTxCategories, setDbTxCategories] = useTxCategories();
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const loadCategories = () => apiFetch('/api/transaction-categories').then((r) => r.json()).then(({ data }) => setDbTxCategories(data));

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { setCategory(''); }, [type]);

  const categoryOptions = [...new Set([...txDefaultCategories[type], ...(dbTxCategories[type] || [])])];

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt) { alert('Amount is required.'); return; }
    await apiFetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, category, description: description.trim(), amount: amt, month: currentMonth }),
    });
    setDescription('');
    setAmount('');
    await loadCategories();
    onSaved();
  };

  return (
    <div className="card">
      <h2>Add income or expense</h2>
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
          <datalist id="txCategoryList">
            {categoryOptions.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Description</label>
          <input type="text" placeholder="e.g. January rent" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Amount ($)</label>
          <input type="number" placeholder="0.00" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-primary" onClick={submit}>Add</button>
    </div>
  );
}
