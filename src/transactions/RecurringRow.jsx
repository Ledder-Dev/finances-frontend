import { useState } from 'react';
import { apiFetch } from '../api.js';

export function RecurringRow({ recurring, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState(recurring.type);
  const [category, setCategory] = useState(recurring.category);
  const [description, setDescription] = useState(recurring.description || '');
  const [amount, setAmount] = useState(String(parseFloat(recurring.amount)));

  const save = async () => {
    const trimmedCategory = category.trim();
    const amt = parseFloat(amount);
    if (!trimmedCategory || !amt) { alert('Category and amount are required.'); return; }
    await apiFetch(`/api/recurring-transactions/${recurring.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, category: trimmedCategory, description: description.trim(), amount: amt }),
    });
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    if (!confirm("Stop adding this automatically every month? Already-added transactions are kept.")) return;
    await apiFetch(`/api/recurring-transactions/${recurring.id}`, { method: 'DELETE' });
    onChanged();
  };

  return (
    <>
      <div className="list-item">
        <div className="list-item-info">
          <div className="list-item-name">{recurring.description || '—'}<span className="badge">{recurring.category}</span></div>
          <div className="list-item-meta">Added automatically every month</div>
        </div>
        <div className="list-item-right">
          <div className={`list-item-amount ${recurring.type}`}>
            {recurring.type === 'income' ? '+' : '-'}${parseFloat(recurring.amount).toFixed(2)}
          </div>
        </div>
        <button className="btn btn-sm" onClick={() => setEditing((v) => !v)}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={remove}>Remove from fixed</button>
      </div>
      {editing && (
        <div className="edit-form visible">
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
              <input type="text" list="txCategoryList" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Amount ($)</label>
              <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="edit-actions">
            <button className="btn btn-primary" style={{ width: 'auto', padding: '7px 20px' }} onClick={save}>Save</button>
            <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
