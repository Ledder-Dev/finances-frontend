import { useState } from 'react';
import { apiFetch } from '../api.js';
import { CategorySelect } from '../components/CategorySelect.jsx';

export function PurchaseHistoryRow({ purchase, unit, isBest, onChanged }) {
  const [editing, setEditing] = useState(false);
  const date = purchase.purchased_at ? purchase.purchased_at.split('T')[0] : purchase.month;

  const [category, setCategory] = useState(purchase.category);
  const [description, setDescription] = useState(purchase.description || '');
  const [store, setStore] = useState(purchase.store || '');
  const [editDate, setEditDate] = useState(date);
  const [qty, setQty] = useState(String(parseFloat(purchase.quantity)));
  const [amount, setAmount] = useState(String(parseFloat(purchase.total_amount)));

  const unitPriceDisplay = parseFloat(qty) > 0 && parseFloat(amount) > 0
    ? `$${(parseFloat(amount) / parseFloat(qty)).toFixed(4)}`
    : `$${parseFloat(purchase.unit_price).toFixed(4)}`;

  const save = async () => {
    if (!qty || !amount || !editDate) { alert('Quantity, amount and date are required.'); return; }
    await apiFetch(`/api/purchases/${purchase.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        description: description.trim(),
        store: store.trim(),
        quantity: parseFloat(qty),
        total_amount: parseFloat(amount),
        purchased_at: editDate,
      }),
    });
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    if (!confirm('Delete this purchase?')) return;
    await apiFetch(`/api/purchases/${purchase.id}`, { method: 'DELETE' });
    onChanged();
  };

  return (
    <>
      <div className="pt-history-row">
        <div className="pt-row-info">
          <span className="pt-meta">
            {date}{purchase.store ? ` · ${purchase.store}` : ''}{purchase.description ? ` · ${purchase.description}` : ''} · {parseFloat(purchase.quantity)} {unit}
          </span>
        </div>
        <div className="pt-row-right">
          <span className={`pt-unit-price${isBest ? ' best-price' : ''}`}>${parseFloat(purchase.unit_price).toFixed(4)}/{unit}</span>
          <span className="expense" style={{ fontSize: 13, fontWeight: 500 }}>${parseFloat(purchase.total_amount).toFixed(2)}</span>
        </div>
        <div className="pt-actions">
          <button className="btn btn-sm" onClick={() => setEditing((v) => !v)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={remove}>Del</button>
        </div>
      </div>
      {editing && (
        <div className="edit-form visible">
          <div className="form-row">
            <div className="form-group"><label>Category</label><CategorySelect value={category} onChange={setCategory} /></div>
            <div className="form-group"><label>Description</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Store</label><input type="text" list="storeList" value={store} onChange={(e) => setStore(e.target.value)} /></div>
            <div className="form-group"><label>Date</label><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} /></div>
          </div>
          <div className="form-row-3">
            <div className="form-group"><label>Quantity</label><input type="number" step="0.001" min="0.001" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
            <div className="form-group"><label>Total ($)</label><input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="form-group"><label>Unit price</label><div className="unit-price-display">{unitPriceDisplay}</div></div>
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
