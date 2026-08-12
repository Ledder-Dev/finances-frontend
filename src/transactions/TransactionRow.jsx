import { useState } from 'react';
import { apiFetch } from '../api.js';

export function TransactionRow({ transaction, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [description, setDescription] = useState(transaction.description || '');
  const [amount, setAmount] = useState(String(parseFloat(transaction.amount)));

  const save = async () => {
    const amt = parseFloat(amount);
    if (!category.trim() || !amt) { alert('Category and amount are required.'); return; }
    await apiFetch(`/api/transactions/${transaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, category: category.trim(), description: description.trim(), amount: amt }),
    });
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    await apiFetch(`/api/transactions/${transaction.id}`, { method: 'DELETE' });
    onChanged();
  };

  return (
    <>
      <div className="list-item">
        <div className="list-item-info">
          <div className="list-item-name">{transaction.description || '—'}<span className="badge">{transaction.category}</span></div>
          <div className="list-item-meta">{transaction.month}</div>
        </div>
        <div className="list-item-right">
          <div className={`list-item-amount ${transaction.type}`}>
            {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
          </div>
        </div>
        <button className="btn btn-sm" onClick={() => setEditing((v) => !v)}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={remove}>Delete</button>
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
